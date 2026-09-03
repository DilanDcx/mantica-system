from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from datetime import date
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import Patient, MedicalRecord, Consultation, ClinicalAuditLog
from .serializers import (
    PatientSerializer,
    MedicalRecordDetailSerializer,
    ConsultationSerializer
)


User = get_user_model()

class HomeDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Total de consultas médicas registradas
        total_consultations = Consultation.objects.count()

        # 2. Personal habilitado/activo en el sistema
        active_staff_count = User.objects.filter(is_active=True).count()

        # 3. Citas pendientes (placeholder mientras se crea el módulo)
        pending_appointments = 0

        return Response({
            'consultations_count': total_consultations,
            'active_staff_count': active_staff_count,
            'pending_appointments': pending_appointments,
        })
        
        
class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'identification_card', 'phone_number', 'medical_record__record_number']
    ordering_fields = ['first_name', 'last_name', 'identification_card', 'created_at', 'is_active']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Patient.objects.all().select_related('medical_record').order_by('-created_at')
        params = self.request.query_params

        # 1. Rango de Fechas (Fecha de Registro)
        start_date = params.get('start_date')
        end_date = params.get('end_date')
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)

        # 2. Género
        gender = params.get('gender')
        if gender:
            queryset = queryset.filter(gender=gender)

        # 3. Tipo de Sangre
        blood_type = params.get('blood_type')
        if blood_type:
            queryset = queryset.filter(blood_type=blood_type)

        # 4. Rango de Edad (calculado sobre birth_date)
        min_age = params.get('min_age')
        max_age = params.get('max_age')
        today = date.today()
        if max_age and max_age.isdigit():
            min_birth = today.replace(year=today.year - int(max_age) - 1)
            queryset = queryset.filter(birth_date__gt=min_birth)
        if min_age and min_age.isdigit():
            max_birth = today.replace(year=today.year - int(min_age))
            queryset = queryset.filter(birth_date__lte=max_birth)

        # 5. Altura (consultas médicas registradas en su expediente)
        min_height = params.get('min_height')
        max_height = params.get('max_height')
        if min_height:
            try:
                queryset = queryset.filter(medical_record__consultations__height_m__gte=float(min_height)).distinct()
            except ValueError:
                pass
        if max_height:
            try:
                queryset = queryset.filter(medical_record__consultations__height_m__lte=float(max_height)).distinct()
            except ValueError:
                pass

        # 6. Peso (consultas médicas registradas en su expediente)
        min_weight = params.get('min_weight')
        max_weight = params.get('max_weight')
        if min_weight:
            try:
                queryset = queryset.filter(medical_record__consultations__weight_kg__gte=float(min_weight)).distinct()
            except ValueError:
                pass
        if max_weight:
            try:
                queryset = queryset.filter(medical_record__consultations__weight_kg__lte=float(max_weight)).distinct()
            except ValueError:
                pass

        return queryset

    @action(detail=True, methods=['patch'], url_path='toggle-status')
    def toggle_status(self, request, pk=None):
        patient = self.get_object()
        patient.is_active = not patient.is_active
        patient.save(update_fields=['is_active'])
        return Response(
            {'id': patient.id, 'is_active': patient.is_active, 'detail': 'Estado actualizado.'},
            status=status.HTTP_200_OK
        )


class MedicalRecordViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MedicalRecordDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['record_number', 'patient__first_name', 'patient__last_name', 'patient__identification_card']

    def get_queryset(self):
        queryset = MedicalRecord.objects.all().select_related('patient').prefetch_related('consultations__doctor')
        params = self.request.query_params

        # 1. Filtro por Género
        gender = params.get('gender')
        if gender:
            queryset = queryset.filter(patient__gender=gender)

        # 2. Filtro por Tipo de Sangre
        blood_type = params.get('blood_type')
        if blood_type:
            queryset = queryset.filter(patient__blood_type=blood_type)

        # 3. Filtro por Rango de Fechas de Atención / Apertura
        start_date = params.get('start_date')
        end_date = params.get('end_date')
        if start_date:
            queryset = queryset.filter(
                Q(consultations__consultation_date__date__gte=start_date) | Q(opened_at__date__gte=start_date)
            ).distinct()
        if end_date:
            queryset = queryset.filter(
                Q(consultations__consultation_date__date__lte=end_date) | Q(opened_at__date__lte=end_date)
            ).distinct()

        # 4. Filtro por Rango de Edad (calculado sobre birth_date)
        min_age = params.get('min_age')
        max_age = params.get('max_age')
        today = date.today()
        if max_age and max_age.isdigit():
            # Paciente debe haber nacido después de: hoy - (max_age + 1) años
            min_birth = today.replace(year=today.year - int(max_age) - 1)
            queryset = queryset.filter(patient__birth_date__gt=min_birth)
        if min_age and min_age.isdigit():
            # Paciente debe haber nacido antes de: hoy - min_age años
            max_birth = today.replace(year=today.year - int(min_age))
            queryset = queryset.filter(patient__birth_date__lte=max_birth)

        # 5. Filtro por Altura en metros (sobre las atenciones registradas)
        min_height = params.get('min_height')
        max_height = params.get('max_height')
        if min_height:
            queryset = queryset.filter(consultations__height_m__gte=float(min_height)).distinct()
        if max_height:
            queryset = queryset.filter(consultations__height_m__lte=float(max_height)).distinct()

        # 6. Filtro por Peso en kg (sobre las atenciones registradas)
        min_weight = params.get('min_weight')
        max_weight = params.get('max_weight')
        if min_weight:
            try:
                queryset = queryset.filter(consultations__weight_kg__gte=float(min_weight)).distinct()
            except ValueError:
                pass
        if max_weight:
            try:
                queryset = queryset.filter(consultations__weight_kg__lte=float(max_weight)).distinct()
            except ValueError:
                pass

        return queryset

class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = Consultation.objects.all().select_related('medical_record', 'doctor')
    serializer_class = ConsultationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        consultation = serializer.save(doctor=user)
        
        # Auditoría clínica sin bloqueos de rol
        doctor_username = user.username if user else 'ADM-01'
        doctor_id = user.id if user else None

        ClinicalAuditLog.objects.create(
            consultation=consultation,
            record_number=consultation.medical_record.record_number,
            action='CREATE',
            performed_by=doctor_username,
            details={
                'diagnosis': consultation.diagnosis,
                'blood_pressure': consultation.blood_pressure,
                'weight_kg': str(consultation.weight_kg) if consultation.weight_kg else None,
                'height_m': str(consultation.height_m) if consultation.height_m else None,
                'temperature_c': str(consultation.temperature_c) if consultation.temperature_c else None,
                'heart_rate_bpm': consultation.heart_rate_bpm,
                'doctor_id': doctor_id,
            }
        )

    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        consultation = serializer.save()
        
        ClinicalAuditLog.objects.create(
            consultation=consultation,
            record_number=consultation.medical_record.record_number,
            action='UPDATE',
            performed_by=user.username if user else 'ADM-01',
            details={
                'diagnosis': consultation.diagnosis,
                'treatment_plan': consultation.treatment_plan,
            }
        )