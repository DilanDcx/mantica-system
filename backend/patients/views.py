from datetime import date
from django.db.models import Q
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Patient, MedicalRecord, Consultation, ClinicalAuditLog
from .serializers import (
    PatientSerializer,
    MedicalRecordDetailSerializer,
    ConsultationSerializer
)
from rest_framework.parsers import MultiPartParser, FormParser
from .models import MedicalAttachment
from .serializers import MedicalAttachmentSerializer
from .models import Appointment
from .serializers import AppointmentSerializer
from django.core.exceptions import ValidationError
from django.db import transaction

User = get_user_model()


class HomeDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_consultations = Consultation.objects.count()
        active_staff_count = User.objects.filter(is_active=True).count()
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

        # 4. Filtro por Rango de Edad
        min_age = params.get('min_age')
        max_age = params.get('max_age')
        today = date.today()
        if max_age and max_age.isdigit():
            min_birth = today.replace(year=today.year - int(max_age) - 1)
            queryset = queryset.filter(patient__birth_date__gt=min_birth)
        if min_age and min_age.isdigit():
            max_birth = today.replace(year=today.year - int(min_age))
            queryset = queryset.filter(patient__birth_date__lte=max_birth)

        # 5. Filtro por Altura en metros
        min_height = params.get('min_height')
        max_height = params.get('max_height')
        if min_height:
            queryset = queryset.filter(consultations__height_m__gte=float(min_height)).distinct()
        if max_height:
            queryset = queryset.filter(consultations__height_m__lte=float(max_height)).distinct()

        # 6. Filtro por Peso en kg
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

    @action(detail=True, methods=['patch'], url_path='update-clinical-alerts')
    def update_clinical_alerts(self, request, pk=None):
        """
        TSK-HU09.2.1: Actualiza alergias y antecedentes del expediente clínico.
        """
        record = self.get_object()

        if 'allergies' in request.data:
            record.allergies = request.data.get('allergies')
        if 'medical_background' in request.data:
            record.medical_background = request.data.get('medical_background')
        if 'family_background' in request.data:
            record.family_background = request.data.get('family_background')

        record.save(update_fields=['allergies', 'medical_background', 'family_background'])
        
        # Registrar auditoría del cambio
        user = request.user if request.user.is_authenticated else None
        performed_by = user.username if user else 'SISTEMA'
        
        ClinicalAuditLog.objects.create(
            consultation=None,
            record_number=record.record_number,
            action='UPDATE',
            performed_by=performed_by,
            details={
                'action_detail': 'Actualización de alergias y antecedentes clínicos',
                'allergies': record.allergies,
                'medical_background': record.medical_background,
                'family_background': record.family_background
            }
        )

        serializer = self.get_serializer(record)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        """
        TSK-HU10.1: Retorna el historial médico cronológico completo de atenciones.
        """
        record = self.get_object()
        consultations = record.consultations.select_related('doctor').order_by('-consultation_date')
        serializer = ConsultationSerializer(consultations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    
class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = Consultation.objects.all().select_related('medical_record', 'doctor')
    serializer_class = ConsultationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        consultation = serializer.save(doctor=user)
        
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
        
class MedicalAttachmentViewSet(viewsets.ModelViewSet):
    queryset = MedicalAttachment.objects.all().select_related('consultation__medical_record')
    serializer_class = MedicalAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        # Validar tamaño máximo opcional (ej: 10MB)
        file_obj = request.FILES.get('file')
        if file_obj and file_obj.size > 10 * 1024 * 1024:
            return Response(
                {'detail': 'El archivo excede el límite máximo permitido de 10 MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)
    
class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().select_related('patient', 'doctor').order_by('scheduled_at')
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        doctor_id = self.request.query_params.get('doctor')
        date_str = self.request.query_params.get('date')

        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        if date_str:
            queryset = queryset.filter(scheduled_at__date=date_str)

        return queryset

    @action(detail=False, methods=['get'], url_path='doctors-list')
    def get_doctors(self, request):
        """Devuelve la lista de usuarios médicos para el selector del frontend"""
        doctors = User.objects.filter(role__name='DOCTOR', is_active=True).values('id', 'first_name', 'last_name', 'username')
        return Response(list(doctors), status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_appointment(self, request, pk=None):
        """TSK-HU12.2.1: Cancela una cita y libera el bloque en la agenda"""
        appointment = self.get_object()
        
        if appointment.status == 'CANCELLED':
            return Response(
                {'detail': 'La cita médica ya se encuentra cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        appointment.status = 'CANCELLED'
        appointment.save(update_fields=['status', 'updated_at'])
        
        return Response(
            {'detail': 'Cita cancelada correctamente. El bloque horario ha sido liberado.'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['patch', 'post'], url_path='reschedule')
    def reschedule_appointment(self, request, pk=None):
        """TSK-HU12.2.1: Modifica fecha, hora o duración validando colisiones"""
        appointment = self.get_object()
        
        if appointment.status == 'CANCELLED':
            return Response(
                {'detail': 'No se puede reprogramar una cita cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_scheduled_at = request.data.get('scheduled_at')
        new_duration = request.data.get('duration_minutes', appointment.duration_minutes)

        if not new_scheduled_at:
            return Response(
                {'scheduled_at': 'Debe proporcionar la nueva fecha y hora.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment.scheduled_at = new_scheduled_at
        appointment.duration_minutes = int(new_duration)

        try:
            appointment.clean()
            appointment.save(update_fields=['scheduled_at', 'duration_minutes', 'updated_at'])
        except ValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(appointment)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='mark-arrived')
    def mark_arrived(self, request, pk=None):
        """TSK-HU13.1: Marca la presencia del paciente en sala de espera"""
        appointment = self.get_object()

        if appointment.status == 'CANCELLED':
            return Response(
                {'detail': 'No se puede registrar asistencia en una cita cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment.status = 'WAITING'
        appointment.save(update_fields=['status', 'updated_at'])

        return Response(
            {'detail': 'Llegada confirmada. Paciente marcado en sala de espera.', 'status': appointment.status},
            status=status.HTTP_200_OK
        )
        
    @action(detail=True, methods=['post'], url_path='complete')
    def complete_appointment(self, request, pk=None):
        """Marca una cita médica como Completada"""
        appointment = self.get_object()

        if appointment.status == 'CANCELLED':
            return Response(
                {'detail': 'No se puede completar una cita médica cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment.status = 'COMPLETED'
        appointment.save(update_fields=['status', 'updated_at'])

        return Response(
            {'detail': 'Cita médica completada con éxito.', 'status': appointment.status},
            status=status.HTTP_200_OK
        )
        
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['patch', 'post'], url_path='reschedule')
    def reschedule_appointment(self, request, pk=None):
        with transaction.atomic():
            appointment = Appointment.objects.select_for_update().get(pk=pk)
            
            if appointment.status == 'CANCELLED':
                return Response(
                    {'detail': 'No se puede reprogramar una cita cancelada.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            new_scheduled_at = request.data.get('scheduled_at')
            new_duration = request.data.get('duration_minutes', appointment.duration_minutes)

            if not new_scheduled_at:
                return Response(
                    {'scheduled_at': 'Debe proporcionar la nueva fecha y hora.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer = self.get_serializer(
                appointment,
                data={'scheduled_at': new_scheduled_at, 'duration_minutes': new_duration},
                partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response(serializer.data, status=status.HTTP_200_OK)