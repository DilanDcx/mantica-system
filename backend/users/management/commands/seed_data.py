from django.core.management.base import BaseCommand
from users.models import Role, User
from django.contrib.auth.hashers import make_password


class Command(BaseCommand):
    help = 'Pobla la base de datos con los 4 roles iniciales del C4 y un usuario administrador con preguntas de seguridad'

    def handle(self, *args, **kwargs):
        self.stdout.write('Iniciando creación de datos base...')

        # 1. Crear Roles del RBAC (Código, Nombre descriptivo, Descripción funcional)
        roles_data = [
            (Role.ADMIN, 'Administrador de TI', 'Gestiona usuarios, audita accesos y asigna roles RBAC'),
            (Role.DOCTOR, 'Personal Médico', 'Consulta expedientes, atenciones, diagnósticos y cierre clínico'),
            (Role.ADMISSION, 'Personal de Admisión', 'Registra pacientes, datos demográficos y gestiona agenda de citas'),
            (Role.DIRECTOR, 'Dirección del Centro', 'Visualiza dashboards estadísticos y genera reportes oficiales estructurados'),
        ]

        created_roles = {}
        for role_code, display_name, description in roles_data:
            role, created = Role.objects.get_or_create(
                name=role_code,
                defaults={'description': description}
            )
            created_roles[role_code] = role
            if created:
                self.stdout.write(self.style.SUCCESS(f'Rol creado: {display_name} ({role_code})'))
            else:
                self.stdout.write(f'Rol ya existente: {display_name} ({role_code})')

        # 2. Crear o Actualizar Usuario Administrador Inicial
        admin_code = 'ADM-01'
        
        # Preguntas y respuestas por defecto para pruebas de recuperación
        q1 = '¿Nombre de tu primera mascota?'
        a1 = make_password('firulais')
        q2 = '¿Ciudad natal de tu madre?'
        a2 = make_password('leon')
        q3 = '¿Nombre de tu escuela primaria?'
        a3 = make_password('la salle')

        admin_user = User.objects.filter(username=admin_code).first()

        if not admin_user:
            admin_user = User.objects.create_superuser(
                username=admin_code,
                email='admin@manticaberio.gob.ni',
                password='AdminPassword123!',
                first_name='Admin',
                last_name='Sistema',
                role=created_roles[Role.ADMIN],
                security_question_1=q1,
                security_answer_1=a1,
                security_question_2=q2,
                security_answer_2=a2,
                security_question_3=q3,
                security_answer_3=a3
            )
            self.stdout.write(self.style.SUCCESS('Usuario Administrador creado exitosamente con preguntas de seguridad.'))
            self.stdout.write(self.style.WARNING(f'Código: {admin_code} | Clave: AdminPassword123!'))
        else:
            # Asegurar asignación de rol y actualización de preguntas si no existen
            admin_user.role = created_roles[Role.ADMIN]
            admin_user.security_question_1 = q1
            admin_user.security_answer_1 = a1
            admin_user.security_question_2 = q2
            admin_user.security_answer_2 = a2
            admin_user.security_question_3 = q3
            admin_user.security_answer_3 = a3
            admin_user.save()
            self.stdout.write(f'Usuario Administrador ({admin_code}) actualizado con rol y preguntas.')

        self.stdout.write(self.style.SUCCESS('Proceso de seed_data finalizado exitosamente.'))