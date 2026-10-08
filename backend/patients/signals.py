import uuid
from django.db.models.signals import post_save, pre_save, pre_delete
from django.dispatch import receiver
from .models import Patient, MedicalRecord, Consultation, ClinicalAuditLog
from django.db.models.deletion import ProtectedError


# 1. Señal para creación automática de expediente digital
@receiver(post_save, sender=Patient)
def create_patient_medical_record(sender, instance, created, **kwargs):
    """
    Crea automáticamente el expediente clínico digital al registrar un nuevo paciente.
    """
    if created:
        unique_suffix = str(uuid.uuid4().hex[:6]).upper()
        record_number = f"EXP-{instance.id:04d}-{unique_suffix}"

        MedicalRecord.objects.create(
            patient=instance,
            record_number=record_number
        )


# 2. Señal para auditoría clínica automática
AUDITED_CONSULTATION_FIELDS = (
    'reason',
    'symptoms',
    'physical_examination',
    'blood_pressure',
    'weight_kg',
    'temperature_c',
    'heart_rate_bpm',
    'respiratory_rate',
    'oxygen_saturation',
    'diagnosis',
    'treatment_plan',
    'notes',
    'is_active',
)


def consultation_snapshot(instance):
    return {
        'reason': instance.reason,
        'symptoms': instance.symptoms,
        'physical_examination': instance.physical_examination,
        'blood_pressure': instance.blood_pressure,
        'weight_kg': str(instance.weight_kg) if instance.weight_kg is not None else None,
        'temperature_c': str(instance.temperature_c) if instance.temperature_c is not None else None,
        'heart_rate_bpm': instance.heart_rate_bpm,
        'respiratory_rate': instance.respiratory_rate,
        'oxygen_saturation': str(instance.oxygen_saturation) if instance.oxygen_saturation is not None else None,
        'diagnosis': instance.diagnosis,
        'treatment_plan': instance.treatment_plan,
        'notes': instance.notes,
        'is_active': instance.is_active,
    }


@receiver(pre_save, sender=Consultation)
def capture_previous_consultation_values(sender, instance, **kwargs):
    if not instance.pk:
        instance._audit_previous_values = None
        return

    previous_values = (
        sender.objects
        .filter(pk=instance.pk)
        .values(*AUDITED_CONSULTATION_FIELDS)
        .first()
    )

    if previous_values:
        for field in ('weight_kg', 'temperature_c', 'oxygen_saturation'):
            if previous_values[field] is not None:
                previous_values[field] = str(previous_values[field])

    instance._audit_previous_values = previous_values


@receiver(post_save, sender=Consultation)
def log_consultation_changes(sender, instance, created, **kwargs):
    new_values = consultation_snapshot(instance)
    old_values = getattr(instance, '_audit_previous_values', None)

    if created or old_values is None:
        action = 'CREATE'
        changes = {
            field: {'old': None, 'new': value}
            for field, value in new_values.items()
        }
    else:
        changes = {
            field: {'old': old_values[field], 'new': new_values[field]}
            for field in new_values
            if old_values[field] != new_values[field]
        }

        action = (
            'DELETE'
            if old_values['is_active'] and not new_values['is_active']
            else 'UPDATE'
        )

        if not changes:
            return

    actor = getattr(instance, '_audit_actor', None)
    doctor_username = instance.doctor.username if instance.doctor else 'Sistema / Turno'
    performed_by = actor.username if actor else doctor_username

    ClinicalAuditLog.objects.create(
        consultation=instance,
        record_number=instance.medical_record.record_number,
        action=action,
        performed_by=performed_by,
        details=changes,
    )


@receiver(pre_delete, sender=Consultation)
def block_physical_consultation_deletion(sender, instance, **kwargs):
    raise ProtectedError(
        'El borrado físico de consultas clínicas está bloqueado. Inactiva la consulta.',
        [instance],
    )