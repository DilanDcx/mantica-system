from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import Patient, MedicalRecord


class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = ['id', 'record_number', 'opened_at', 'notes']


class PatientSerializer(serializers.ModelSerializer):
    medical_record = MedicalRecordSerializer(read_only=True)
    
    # Sobrescribir el campo para personalizar el mensaje de unicidad en español
    identification_card = serializers.CharField(
        max_length=20,
        validators=[
            UniqueValidator(
                queryset=Patient.objects.all(),
                message="Ya existe un paciente registrado con este número de cédula."
            )
        ]
    )

    class Meta:
        model = Patient
        fields = [
            'id', 'first_name', 'last_name', 'identification_card',
            'birth_date', 'gender', 'phone_number', 'address',
            'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relation', 'is_active', 'medical_record',
            'created_at'
        ]

    def validate_identification_card(self, value):
        return value.strip().upper()