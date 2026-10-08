from rest_framework import serializers
from .models import Patient, MedicalRecord, Consultation, MedicalAttachment, Appointment, ClinicalAuditLog
from django.db import transaction
from datetime import timedelta



class MedicalAttachmentSerializer(serializers.ModelSerializer):
    file_extension = serializers.ReadOnlyField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = MedicalAttachment
        fields = ['id', 'consultation', 'file', 'file_url', 'title', 'file_extension', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at', 'file_extension', 'file_url']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None


class ConsultationSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    consultation_date_formatted = serializers.DateTimeField(
        source='consultation_date',
        format='%d/%m/%Y %H:%M',
        read_only=True
    )
    attachments = MedicalAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Consultation
        fields = [
            'id',
            'medical_record',
            'doctor',
            'doctor_name',
            'consultation_date',
            'consultation_date_formatted',
            'reason',
            'symptoms',
            'physical_examination',
            'blood_pressure',
            'weight_kg',
            'height_m',
            'temperature_c',
            'heart_rate_bpm',
            'respiratory_rate',
            'oxygen_saturation',
            'diagnosis',
            'treatment_plan',
            'notes',
            'attachments',
            'is_active',
        ]
        read_only_fields = ['is_active']

    def get_doctor_name(self, obj):
        if not obj.doctor:
            return 'Médico de Turno'

        full_name = f"{obj.doctor.first_name or ''} {obj.doctor.last_name or ''}".strip()
        if full_name:
            return full_name

        return f"@{obj.doctor.username}"

class MedicalRecordDetailSerializer(serializers.ModelSerializer):
    consultations = ConsultationSerializer(many=True, read_only=True)
    patient = serializers.SerializerMethodField()
    last_consultation = serializers.SerializerMethodField()

    class Meta:
        model = MedicalRecord
        fields = [
            'id', 
            'record_number', 
            'allergies', 
            'medical_background', 
            'family_background', 
            'opened_at', 
            'notes', 
            'patient', 
            'consultations', 
            'last_consultation',
        ]

    def get_patient(self, obj):
        patient = obj.patient
        return {
            'id': patient.id,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'identification_card': patient.identification_card,
            'birth_date': patient.birth_date,
            'gender': patient.gender,
            'blood_type': patient.blood_type,
            'phone_number': patient.phone_number,
            'address': patient.address,
            'is_active': patient.is_active,
        }

    def get_last_consultation(self, obj):
        latest = obj.consultations.first()
        if not latest:
            return None
        return ConsultationSerializer(latest).data


class PatientSerializer(serializers.ModelSerializer):
    medical_record = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = '__all__'

    def get_medical_record(self, obj):
        if hasattr(obj, 'medical_record'):
            return {
                'id': obj.medical_record.id,
                'record_number': obj.medical_record.record_number,
                'opened_at': obj.medical_record.opened_at,
            }
        return None

class ClinicalAuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicalAuditLog
        fields = ['id', 'record_number', 'action', 'performed_by', 'timestamp', 'details']
        read_only_fields = fields


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    scheduled_at_formatted = serializers.DateTimeField(
        source='scheduled_at',
        format='%d/%m/%Y %H:%M',
        read_only=True
    )

    class Meta:
        model = Appointment
        fields = [
            'id',
            'patient',
            'patient_name',
            'doctor',
            'doctor_name',
            'scheduled_at',
            'scheduled_at_formatted',
            'duration_minutes',
            'reason',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'scheduled_at_formatted']

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"

    def get_doctor_name(self, obj):
        first = getattr(obj.doctor, 'first_name', '')
        last = getattr(obj.doctor, 'last_name', '')
        full = f"{first} {last}".strip()
        return full if full else f"@{obj.doctor.username}"

    def validate(self, attrs):
        doctor = attrs.get('doctor', getattr(self.instance, 'doctor', None))
        patient = attrs.get('patient', getattr(self.instance, 'patient', None))
        scheduled_at = attrs.get('scheduled_at', getattr(self.instance, 'scheduled_at', None))
        duration_minutes = attrs.get(
            'duration_minutes',
            getattr(self.instance, 'duration_minutes', 30)
        )

        if not scheduled_at or not doctor:
            return attrs

        new_start = scheduled_at
        new_end = new_start + timedelta(minutes=duration_minutes)

        with transaction.atomic():
            overlapping_doctor = Appointment.objects.select_for_update().filter(
                doctor=doctor,
                status__in=['SCHEDULED', 'WAITING']
            )
            if self.instance and self.instance.pk:
                overlapping_doctor = overlapping_doctor.exclude(pk=self.instance.pk)

            for apt in overlapping_doctor:
                apt_start = apt.scheduled_at
                apt_end = apt_start + timedelta(minutes=apt.duration_minutes)
                if new_start < apt_end and new_end > apt_start:
                    raise serializers.ValidationError({
                        'scheduled_at': (
                            f"Conflicto de concurrencia: el médico ya tiene una cita "
                            f"reservada ({apt_start.strftime('%H:%M')} - "
                            f"{apt_end.strftime('%H:%M')})."
                        )
                    })

            if patient:
                overlapping_patient = Appointment.objects.select_for_update().filter(
                    patient=patient,
                    status__in=['SCHEDULED', 'WAITING']
                )
                if self.instance and self.instance.pk:
                    overlapping_patient = overlapping_patient.exclude(pk=self.instance.pk)

                for apt in overlapping_patient:
                    apt_start = apt.scheduled_at
                    apt_end = apt_start + timedelta(minutes=apt.duration_minutes)
                    if new_start < apt_end and new_end > apt_start:
                        raise serializers.ValidationError({
                            'patient': (
                                'El paciente ya cuenta con otra cita activa '
                                'en este mismo rango horario.'
                            )
                        })

        return attrs