from types import SimpleNamespace
from datetime import date
from unittest.mock import Mock, call, patch

from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory
from django.db.models.signals import post_save, pre_delete
from django.db.models.deletion import ProtectedError
from django.test import SimpleTestCase

from patients.models import Consultation
from patients.views import ClinicalAuditLogViewSet
from users.models import Role
from users.permissions import IsAdminUserRole


class ClinicalAuditLogTests(SimpleTestCase):
    def make_consultation(self):
        return SimpleNamespace(
            medical_record=SimpleNamespace(record_number='EXP-TEST'),
            doctor=None,
            reason='motivo anterior',
            symptoms=None,
            physical_examination=None,
            blood_pressure='120/80',
            weight_kg=60,
            temperature_c=37,
            heart_rate_bpm=70,
            respiratory_rate=16,
            oxygen_saturation=98,
            diagnosis='diagnóstico anterior',
            treatment_plan=None,
            notes=None,
            is_active=True,
        )

    def old_values(self):
        return {
            'reason': 'motivo anterior',
            'symptoms': None,
            'physical_examination': None,
            'blood_pressure': '120/80',
            'weight_kg': '60',
            'temperature_c': '37',
            'heart_rate_bpm': 70,
            'respiratory_rate': 16,
            'oxygen_saturation': '98',
            'diagnosis': 'diagnóstico anterior',
            'treatment_plan': None,
            'notes': None,
            'is_active': True,
        }

    @patch('patients.signals.ClinicalAuditLog.objects.create')
    def test_update_log_saves_old_and_new_values(self, create_log):
        consultation = self.make_consultation()
        consultation.diagnosis = 'diagnóstico actualizado'
        consultation._audit_actor = SimpleNamespace(username='admin-test')
        consultation._audit_previous_values = self.old_values()

        post_save.send(
            sender=Consultation,
            instance=consultation,
            created=False,
        )

        logged_data = create_log.call_args.kwargs
        self.assertEqual(logged_data['action'], 'UPDATE')
        self.assertEqual(logged_data['performed_by'], 'admin-test')
        self.assertEqual(
            logged_data['details']['diagnosis'],
            {
                'old': 'diagnóstico anterior',
                'new': 'diagnóstico actualizado',
            },
        )

    @patch('patients.signals.ClinicalAuditLog.objects.create')
    def test_inactivation_is_logged_as_delete(self, create_log):
        consultation = self.make_consultation()
        consultation.is_active = False
        consultation._audit_actor = SimpleNamespace(username='admin-test')
        consultation._audit_previous_values = self.old_values()

        post_save.send(
            sender=Consultation,
            instance=consultation,
            created=False,
        )

        logged_data = create_log.call_args.kwargs
        self.assertEqual(logged_data['action'], 'DELETE')
        self.assertEqual(
            logged_data['details']['is_active'],
            {'old': True, 'new': False},
        )

    def test_physical_deletion_is_blocked(self):
        consultation = self.make_consultation()

        with self.assertRaises(ProtectedError):
            pre_delete.send(sender=Consultation, instance=consultation)

    def test_audit_permission_is_restricted_to_admin(self):
        permission = IsAdminUserRole()
        admin_request = SimpleNamespace(
            user=SimpleNamespace(
                is_authenticated=True,
                role=SimpleNamespace(name=Role.ADMIN),
            )
        )
        doctor_request = SimpleNamespace(
            user=SimpleNamespace(
                is_authenticated=True,
                role=SimpleNamespace(name=Role.DOCTOR),
            )
        )

        self.assertTrue(permission.has_permission(admin_request, None))
        self.assertFalse(permission.has_permission(doctor_request, None))
        self.assertIn(IsAdminUserRole, ClinicalAuditLogViewSet.permission_classes)

    def test_audit_log_filters_by_date_and_user(self):
        queryset = Mock()
        queryset.filter.return_value = queryset

        view = ClinicalAuditLogViewSet()
        view.queryset = queryset
        request = APIRequestFactory().get(
            '/api/audit-logs/',
            {
                'fecha_desde': '2026-10-01',
                'fecha_hasta': '2026-10-08',
                'usuario': 'admin-test',
                'modulo': 'consultas',
            },
        )
        view.request = Request(request)

        view.get_queryset()

        self.assertEqual(
            queryset.filter.call_args_list,
            [
                call(timestamp__date__gte=date(2026, 10, 1)),
                call(timestamp__date__lte=date(2026, 10, 8)),
                call(performed_by__icontains='admin-test'),
            ],
        )

    def test_audit_log_rejects_invalid_date(self):
        view = ClinicalAuditLogViewSet()
        view.queryset = Mock()
        request = APIRequestFactory().get(
            '/api/audit-logs/',
            {'fecha_desde': 'ayer'},
        )
        view.request = Request(request)

        with self.assertRaises(ValidationError):
            view.get_queryset()

    def test_unknown_audit_module_returns_no_results(self):
        queryset = Mock()
        view = ClinicalAuditLogViewSet()
        view.queryset = queryset
        request = APIRequestFactory().get(
            '/api/audit-logs/',
            {'modulo': 'usuarios'},
        )
        view.request = Request(request)

        view.get_queryset()

        queryset.none.assert_called_once_with()