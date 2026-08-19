from django.core.management.base import BaseCommand
from users.models import Role, User

class Command(BaseCommand):
    help = 'Pobla la base de datos con roles iniciales y un usuario administrador'

    def handle(self, *args, **kwargs):
        self.stdout.write('Iniciando creación de datos base...')

        # 1. Crear Roles del RBAC
        roles_data = [
            (Role.ADMIN, 'Administrador del Sistema'),
            (Role.DOCTOR, 'Médico General / Especialista'),
            (Role.RECEPTIONIST, 'Recepcionista / Personal de Admisión'),
        ]

        created_roles = {}
        for role_code, description in roles_data:
            role, created = Role.objects.get_or_create(
                name=role_code,
                defaults={'description': description}
            )
            created_roles[role_code] = role
            if created:
                self.stdout.write(self.style.SUCCESS(f'Rol creado: {role_code}'))
            else:
                self.stdout.write(f'Rol ya existente: {role_code}')

        # 2. Crear Usuario Administrador Inicial
        admin_code = 'ADM-01'
        if not User.objects.filter(username=admin_code).exists():
            admin_user = User.objects.create_superuser(
                username=admin_code,
                email='admin@manticaberio.gob.ni',
                password='AdminPassword123!',
                first_name='Admin',
                last_name='Sistema',
                role=created_roles[Role.ADMIN]
            )
            self.stdout.write(self.style.SUCCESS(f'Usuario Administrador creado exitosamente.'))
            self.stdout.write(self.style.WARNING(f'Código de acceso: {admin_code} | Clave: AdminPassword123!'))
        else:
            self.stdout.write(f'Usuario Administrador ({admin_code}) ya existe.')