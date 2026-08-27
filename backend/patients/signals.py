import uuid
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Patient, MedicalRecord


@receiver(post_save, sender=Patient)
def create_patient_medical_record(sender, instance, created, **kwargs):
    """
    Crea automáticamente el expediente clínico digital al registrar un nuevo paciente.
    """
    if created:
        # Generación de código único de expediente (ej. EXP-2026-XXXX)
        unique_suffix = str(uuid.uuid4().hex[:6]).upper()
        record_number = f"EXP-{instance.id:04d}-{unique_suffix}"
        
        MedicalRecord.objects.create(
            patient=instance,
            record_number=record_number
        )