from types import SimpleNamespace
from unittest.mock import patch

from django.db.models.signals import pre_delete
from django.test import SimpleTestCase

from patients.models import Consultation
from patients.views import ClinicalAuditLogViewSet
from users.models import Role
from users.permissions import IsAdminUserRole


class ClinicalAuditLogTests(SimpleTestCase):
    @patch('patients.signals.ClinicalAuditLog.objects.create')
    def test_deletion_is_logged_with_actor(self, create_log):
        actor = SimpleNamespace(username='admin-test')
        consultation = SimpleNamespace(
            _audit_actor=actor,
            medical_record=SimpleNamespace(record_number='EXP-TEST'),
            reason='motivo de prueba',
            diagnosis='diagnóstico de prueba',
            blood_pressure='120/80',
            weight_kg=60,
            temperature_c=37,
            heart_rate_bpm=70,
        )

        pre_delete.send(sender=Consultation, instance=consultation)

        create_log.assert_called_once()
        logged_data = create_log.call_args.kwargs
        self.assertIsNone(logged_data['consultation'])
        self.assertEqual(logged_data['record_number'], 'EXP-TEST')
        self.assertEqual(logged_data['action'], 'DELETE')
        self.assertEqual(logged_data['performed_by'], 'admin-test')

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