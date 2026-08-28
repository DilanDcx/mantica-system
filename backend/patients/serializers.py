from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import Patient, MedicalRecord
from .models import Patient, MedicalRecord, Consultation, ClinicalAuditLog


class ConsultationSerializer(serializers.ModelSerializer):
    doctor_name = serializers.ReadOnlyField(source='doctor.get_full_name')
    consultation_date_formatted = serializers.DateTimeField(source='consultation_date', format='%d/%m/%Y %H:%M', read_only=True)

    class Meta:
        model = Consultation
        fields = '__all__'


class MedicalRecordDetailSerializer(serializers.ModelSerializer):
    consultations = ConsultationSerializer(many=True, read_only=True)
    patient = serializers.SerializerMethodField()
    last_consultation = serializers.SerializerMethodField()

    class Meta:
        model = MedicalRecord
        fields = ['id', 'record_number', 'opened_at', 'notes', 'patient', 'consultations', 'last_consultation']

    def get_patient(self, obj):
        return {
            'id': obj.patient.id,
            'first_name': obj.patient.first_name,
            'last_name': obj.patient.last_name,
            'identification_card': obj.patient.identification_card,
            'birth_date': obj.patient.birth_date,
            'gender': obj.patient.gender,
            'phone_number': obj.patient.phone_number,
            'address': obj.patient.address,
            'is_active': obj.patient.is_active,
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