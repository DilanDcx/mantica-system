from django.db import models
from django.conf import settings


class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro'),
    ]

    # Datos Personales
    first_name = models.CharField(max_length=100, verbose_name="Nombres")
    last_name = models.CharField(max_length=100, verbose_name="Apellidos")
    identification_card = models.CharField(
        max_length=20, 
        unique=True, 
        db_index=True, 
        verbose_name="Número de Cédula"
    )
    birth_date = models.DateField(verbose_name="Fecha de Nacimiento")
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name="Género")
    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Teléfono")
    address = models.TextField(blank=True, null=True, verbose_name="Dirección Domiciliar")

    # Contacto de Emergencia
    emergency_contact_name = models.CharField(
        max_length=150, 
        verbose_name="Nombre de Contacto de Emergencia"
    )
    emergency_contact_phone = models.CharField(
        max_length=20, 
        verbose_name="Teléfono de Emergencia"
    )
    emergency_contact_relation = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        verbose_name="Parentesco"
    )

    is_active = models.BooleanField(default=True, verbose_name="Activo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Paciente"
        verbose_name_plural = "Pacientes"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.identification_card})"


class MedicalRecord(models.Model):
    """Expediente Clínico Digital asociado automáticamente al paciente."""
    patient = models.OneToOneField(
        Patient, 
        on_delete=models.CASCADE, 
        related_name="medical_record"
    )
    record_number = models.CharField(
        max_length=30, 
        unique=True, 
        db_index=True, 
        verbose_name="Número de Expediente"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="records_created"
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Observaciones Generales")
    opened_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Expediente Clínico"
        verbose_name_plural = "Expedientes Clínicos"

    def __str__(self):
        return f"Expediente #{self.record_number} - {self.patient}"