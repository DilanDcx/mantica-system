import uuid
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Patient, MedicalRecord, Consultation, ClinicalAuditLog


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
@receiver(post_save, sender=Consultation)
def log_consultation_changes(sender, instance, created, **kwargs):
    """
    Registra de forma automática la creación y modificaciones de datos clínicos en la bitácora.
    """
    action = 'CREATE' if created else 'UPDATE'
    doctor_username = instance.doctor.username if instance.doctor else 'Sistema / Turno'
    
    details = {
        'reason': instance.reason,
        'diagnosis': instance.diagnosis,
        'blood_pressure': instance.blood_pressure,
        'weight_kg': str(instance.weight_kg) if instance.weight_kg else None,
        'temperature_c': str(instance.temperature_c) if instance.temperature_c else None,
        'heart_rate_bpm': instance.heart_rate_bpm,
    }

    ClinicalAuditLog.objects.create(
        consultation=instance,
        record_number=instance.medical_record.record_number,
        action=action,
        performed_by=doctor_username,
        details=details
    )