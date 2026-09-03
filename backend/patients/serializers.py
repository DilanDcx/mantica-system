from rest_framework import serializers
from .models import Patient, MedicalRecord, Consultation, ClinicalAuditLog


class ConsultationSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    consultation_date_formatted = serializers.DateTimeField(
        source='consultation_date', 
        format='%d/%m/%Y %H:%M', 
        read_only=True
    )

    class Meta:
        model = Consultation
        fields = '__all__'

    def get_doctor_name(self, obj):
        if not obj.doctor:
            return 'Médico de Turno'
        
        full_name = f"{obj.doctor.first_name or ''} {obj.doctor.last_name or ''}".strip()
        if full_name:
            return full_name
        
        # Fallback al username si no tiene nombres cargados (ej. @ADM-01 o @DOC-01)
        return f"@{obj.doctor.username}"

class MedicalRecordDetailSerializer(serializers.ModelSerializer):
    consultations = ConsultationSerializer(many=True, read_only=True)
    patient = serializers.SerializerMethodField()
    last_consultation = serializers.SerializerMethodField()

    class Meta:
        model = MedicalRecord
        fields = ['id', 'record_number', 'opened_at', 'notes', 'patient', 'consultations', 'last_consultation']

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