import uuid
import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from patients.models import Patient, MedicalRecord

FIRST_NAMES = ['Carlos', 'María', 'José', 'Ana', 'Luis', 'Sofía', 'Jorge', 'Elena', 'Edmundo', 'Lucía', 'Mario', 'Patricia', 'Fernando', 'Carmen']
LAST_NAMES = ['Torres', 'González', 'Arcia', 'Martínez', 'López', 'Pérez', 'Sánchez', 'Ramírez', 'Vargas', 'Morales', 'Castillo', 'Hernández']
MUNICIPALITIES = ['081', '082', '001', '002', '121', '201', '321']

class Command(BaseCommand):
    help = 'Pobla la base de datos con 10,000 registros de pacientes sintéticos para pruebas de carga'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=10000, help='Cantidad de pacientes a generar')

    def handle(self, *args, **options):
        count = options['count']
        self.stdout.write(self.style.WARNING(f"Iniciando generación masiva de {count} pacientes..."))

        start_date = date(1950, 1, 1)
        end_date = date(2015, 12, 31)
        days_range = (end_date - start_date).days

        patients_to_create = []
        existing_count = Patient.objects.count()

        for i in range(1, count + 1):
            idx = existing_count + i
            fn = random.choice(FIRST_NAMES)
            ln = random.choice(LAST_NAMES)
            muni = random.choice(MUNICIPALITIES)
            bdate = start_date + timedelta(days=random.randint(0, days_range))
            date_str = bdate.strftime('%d%m%y')
            consec = f"{random.randint(1000, 9999)}"
            letter = chr(random.randint(65, 90))
            cedula = f"{muni}-{date_str}-{consec}{letter}"
            phone = f"+505 {random.randint(8000, 8999)}-{random.randint(1000, 9999)}"

            patient = Patient(
                first_name=fn,
                last_name=ln,
                identification_card=cedula,
                birth_date=bdate,
                gender=random.choice(['M', 'F']),
                phone_number=phone,
                address=f"Barrio San Felipe, Casa #{random.randint(10, 500)}",
                emergency_contact_name=f"{random.choice(FIRST_NAMES)} {ln}",
                emergency_contact_phone=phone,
                emergency_contact_relation=random.choice(['Madre', 'Padre', 'Hermano/a', 'Cónyuge', 'Primo/a']),
                is_active=True
            )
            patients_to_create.append(patient)

        with transaction.atomic():
            created_patients = Patient.objects.bulk_create(patients_to_create, batch_size=2000)
            
            records_to_create = []
            for p in created_patients:
                rec_num = f"EXP-{p.id:04d}-{uuid.uuid4().hex[:6].upper()}"
                records_to_create.append(MedicalRecord(patient=p, record_number=rec_num))

            MedicalRecord.objects.bulk_create(records_to_create, batch_size=2000)

        self.stdout.write(self.style.SUCCESS(f"¡Éxito! Se insertaron {count} pacientes y expedientes digitales."))