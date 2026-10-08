from django.db import models
from django.conf import settings
from django.contrib.postgres.indexes import GinIndex
import os
from django.core.validators import FileExtensionValidator
from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError


class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro'),
    ]

    BLOOD_TYPE_CHOICES = [
        ('O+', 'O Positivo (O+)'),
        ('O-', 'O Negativo (O-)'),
        ('A+', 'A Positivo (A+)'),
        ('A-', 'A Negativo (A-)'),
        ('B+', 'B Positivo (B+)'),
        ('B-', 'B Negativo (B-)'),
        ('AB+', 'AB Positivo (AB+)'),
        ('AB-', 'AB Negativo (AB-)'),
    ]

    first_name = models.CharField(max_length=150, verbose_name='Nombres')
    last_name = models.CharField(max_length=150, verbose_name='Apellidos')
    identification_card = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Número de Cédula'
    )
    birth_date = models.DateField(verbose_name='Fecha de Nacimiento')
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name='Género')
    blood_type = models.CharField(
        max_length=5,
        choices=BLOOD_TYPE_CHOICES,
        blank=True,
        null=True,
        verbose_name='Tipo de Sangre'
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True, db_index=True, verbose_name='Teléfono')
    address = models.TextField(blank=True, null=True, verbose_name='Dirección')
    
    # Contacto de emergencia
    emergency_contact_name = models.CharField(max_length=200, blank=True, null=True, verbose_name='Nombre de Contacto')
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Teléfono de Contacto')
    emergency_contact_relation = models.CharField(max_length=100, blank=True, null=True, verbose_name='Parentesco')

    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Registro')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última Actualización')

    class Meta:
        verbose_name = 'Paciente'
        verbose_name_plural = 'Pacientes'
        ordering = ['-created_at']
        indexes = [
            GinIndex(name='patient_first_name_trgm_idx', fields=['first_name'], opclasses=['gin_trgm_ops']),
            GinIndex(name='patient_last_name_trgm_idx', fields=['last_name'], opclasses=['gin_trgm_ops']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.identification_card})"


class MedicalRecord(models.Model):
    patient = models.OneToOneField(
        Patient,
        on_delete=models.CASCADE,
        related_name='medical_record',
        verbose_name='Paciente'
    )
    record_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Número de Expediente'
    )
    
    allergies = models.TextField(
        blank=True,
        null=True,
        verbose_name='Alergias Conocidas',
        help_text='Alergias a medicamentos, alimentos u otras sustancias'
    )
    medical_background = models.TextField(
        blank=True,
        null=True,
        verbose_name='Antecedentes Médicos / Patológicos',
        help_text='Enfermedades crónicas, cirugías previas, etc.'
    )
    family_background = models.TextField(
        blank=True,
        null=True,
        verbose_name='Antecedentes Heredofamiliares',
        help_text='Antecedentes de diabetes, hipertensión o cáncer familiar'
    )
    opened_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Apertura')
    notes = models.TextField(blank=True, null=True, verbose_name='Notas Iniciales')

    class Meta:
        verbose_name = 'Expediente Digital'
        verbose_name_plural = 'Expedientes Digitales'

    def __str__(self):
        return f"Expediente {self.record_number} - {self.patient.first_name} {self.patient.last_name}"


class Consultation(models.Model):
    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.CASCADE,
        related_name='consultations',
        verbose_name='Expediente'
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='consultations',
        verbose_name='Médico Atendiente'
    )
    consultation_date = models.DateTimeField(auto_now_add=True, verbose_name='Fecha y Hora')
    
    reason = models.TextField(verbose_name='Motivo de Consulta')
    symptoms = models.TextField(blank=True, null=True, verbose_name='Síntomas / Cuadro Clínico')
    physical_examination = models.TextField(blank=True, null=True, verbose_name='Examen Físico')
    
    blood_pressure = models.CharField(max_length=20, blank=True, null=True, verbose_name='Presión Arterial (mmHg)')
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, verbose_name='Peso (kg)')
    height_m = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True, verbose_name='Altura (m)')
    temperature_c = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True, verbose_name='Temperatura (°C)')
    heart_rate_bpm = models.IntegerField(blank=True, null=True, verbose_name='Frecuencia Cardíaca (lpm)')
    respiratory_rate = models.IntegerField(blank=True, null=True, verbose_name='Frecuencia Respiratoria (rpm)')
    oxygen_saturation = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True, verbose_name='Saturación O2 (%)')

    diagnosis = models.TextField(verbose_name='Diagnóstico')
    treatment_plan = models.TextField(blank=True, null=True, verbose_name='Plan de Tratamiento / Receta')
    notes = models.TextField(blank=True, null=True, verbose_name='Observaciones Adicionales')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_active = models.BooleanField(default=True, verbose_name='Activa')

    class Meta:
        verbose_name = 'Consulta Médica'
        verbose_name_plural = 'Consultas Médicas'
        ordering = ['-consultation_date']

    def __str__(self):
        return f"Consulta {self.id} - {self.medical_record.record_number} ({self.consultation_date.strftime('%d/%m/%Y')})"


class ClinicalAuditLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Creación de Consulta'),
        ('UPDATE', 'Modificación de Consulta'),
        ('DELETE', 'Eliminación de Consulta'),
    ]

    consultation = models.ForeignKey(
        Consultation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    record_number = models.CharField(max_length=50, verbose_name='Número de Expediente')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    performed_by = models.CharField(max_length=150, verbose_name='Usuario Responsable')
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict, verbose_name='Detalles del Cambio')

    class Meta:
        verbose_name = 'Bitácora de Auditoría Clínica'
        verbose_name_plural = 'Bitácoras de Auditoría Clínica'
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.action}] Exp: {self.record_number} por {self.performed_by} ({self.timestamp.strftime('%d/%m/%Y %H:%M')})"
    

def consultation_attachment_path(instance, filename):
    return f"medical_records/{instance.consultation.medical_record.record_number}/consultations/{instance.consultation.id}/{filename}"

class MedicalAttachment(models.Model):
    consultation = models.ForeignKey(
        Consultation,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name='Consulta'
    )
    file = models.FileField(
        upload_to=consultation_attachment_path,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'png', 'jpg', 'jpeg'])],
        verbose_name='Archivo'
    )
    title = models.CharField(max_length=150, verbose_name='Título / Descripción del Estudio')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Subida')

    class Meta:
        verbose_name = 'Estudio / Documento Adjunto'
        verbose_name_plural = 'Estudios / Documentos Adjuntos'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.title} ({self.consultation.medical_record.record_number})"

    @property
    def file_extension(self):
        name, ext = os.path.splitext(self.file.name)
        return ext.lower().replace('.', '')
    
class Appointment(models.Model):
    STATUS_CHOICES = [
        ('SCHEDULED', 'Programada'),
        ('WAITING', 'En Sala de Espera'),
        ('COMPLETED', 'Completada'),
        ('CANCELLED', 'Cancelada'),
        ('NO_SHOW', 'No asistió'),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name='Paciente'
    )
    doctor = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='doctor_appointments',
        verbose_name='Médico Asignado'
    )
    scheduled_at = models.DateTimeField(
        verbose_name='Fecha y Hora de Inicio'
    )
    duration_minutes = models.PositiveIntegerField(
        default=30,
        verbose_name='Duración estimada (min)'
    )
    reason = models.CharField(
        max_length=255,
        verbose_name='Motivo de la Cita'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='SCHEDULED',
        verbose_name='Estado'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Cita Médica'
        verbose_name_plural = 'Citas Médicas'
        ordering = ['scheduled_at']

    @property
    def end_time(self):
        return self.scheduled_at + timedelta(minutes=self.duration_minutes)

    def clean(self):
        super().clean()
        if not self.scheduled_at:
            return

        # Validación 1: No permitir citas en el pasado
        if self.scheduled_at < timezone.now():
            raise ValidationError({'scheduled_at': 'No se pueden programar citas en fechas u horas pasadas.'})

        # Validación 2: Regla anticolisión (TSK-HU12.1.1)
        new_start = self.scheduled_at
        new_end = new_start + timedelta(minutes=self.duration_minutes)

        # Buscar citas activas del mismo médico que se traslapen
        overlapping_doctor = Appointment.objects.filter(
            doctor=self.doctor,
            status__in=['SCHEDULED', 'WAITING']
        )
        if self.pk:
            overlapping_doctor = overlapping_doctor.exclude(pk=self.pk)

        for apt in overlapping_doctor:
            apt_start = apt.scheduled_at
            apt_end = apt.scheduled_at + timedelta(minutes=apt.duration_minutes)
            # Existe traslape si (InicioA < FinB) y (FinA > InicioB)
            if new_start < apt_end and new_end > apt_start:
                raise ValidationError({
                    'scheduled_at': f"El médico ya tiene una cita programada entre {apt_start.strftime('%H:%M')} y {apt_end.strftime('%H:%M')}."
                })

        # Validación 3: Evitar que el mismo paciente tenga dos citas simultáneas
        overlapping_patient = Appointment.objects.filter(
            patient=self.patient,
            status='SCHEDULED'
        )
        if self.pk:
            overlapping_patient = overlapping_patient.exclude(pk=self.pk)

        for apt in overlapping_patient:
            apt_start = apt.scheduled_at
            apt_end = apt.scheduled_at + timedelta(minutes=apt.duration_minutes)
            if new_start < apt_end and new_end > apt_start:
                raise ValidationError({
                    'patient': 'El paciente ya cuenta con otra cita activa en este mismo rango horario.'
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Cita: {self.patient.first_name} con Dr(a). {self.doctor.username} ({self.scheduled_at.strftime('%d/%m/%Y %H:%M')})"