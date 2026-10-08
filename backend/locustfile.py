import random
from locust import HttpUser, task, between

class AppointmentStressUser(HttpUser):
    # Simula pausas reales entre interacciones de usuarios
    wait_time = between(1, 3)
    token = None
    doctor_id = None
    patient_ids = []

    def on_start(self):
        """Autenticación inicial para cada usuario virtual"""
        res = self.client.post("/api/auth/token/", json={
            "username": "Freddy",      # Usuario administrador/recepción
            "password": "Admin1234"  # Contraseña del entorno
        })
        
        if res.status_code == 404:
            res = self.client.post("/api/auth/login/", json={
                "username": "Freddy",
                "password": "Admin1234"
            })
        
        if res.status_code == 200:
            data = res.json()
            # Compatible tanto si la clave se llama 'access' como si se llama 'token'
            self.token = data.get("access") or data.get("token")
            self.client.headers = {"Authorization": f"Bearer {self.token}"}
            self.bootstrap_data()
        else:
            print(f"FALLO DE AUTENTICACION [{res.status_code}]: {res.text}")

    def bootstrap_data(self):
        """Carga doctores y pacientes existentes para las pruebas concurrentes"""
        doc_res = self.client.get("/api/appointments/doctors-list/")
        if doc_res.status_code == 200 and doc_res.json():
            self.doctor_id = doc_res.json()[0]["id"]

        pat_res = self.client.get("/api/patients/?page_size=20")
        if pat_res.status_code == 200:
            results = pat_res.json().get("results", pat_res.json())
            self.patient_ids = [p["id"] for p in results]

    @task(6)
    def view_daily_agenda(self):
        """Lectura concurrente del tablero de agenda (alta frecuencia)"""
        self.client.get("/api/appointments/?date=2026-09-10", name="/api/appointments/ [GET]")

    @task(3)
    def view_doctors(self):
        """Consulta concurrente de disponibilidad de médicos"""
        self.client.get("/api/appointments/doctors-list/", name="/api/appointments/doctors-list/ [GET]")

    @task(1)
    def attempt_concurrent_booking(self):
        """Inserción concurrente: varios usuarios intentan reservar los mismos bloques de tiempo"""
        if not self.doctor_id or not self.patient_ids:
            return

        # Genera competencia deliberada en bloques horarios fijos
        competing_hours = ["08:00", "08:30", "09:00", "09:30", "10:00"]
        chosen_time = random.choice(competing_hours)
        scheduled_at = f"2026-10-15T{chosen_time}:00"

        payload = {
            "patient": random.choice(self.patient_ids),
            "doctor": self.doctor_id,
            "scheduled_at": scheduled_at,
            "duration_minutes": 30,
            "reason": "Prueba de carga y concurrencia HU-NFR02"
        }

        with self.client.post("/api/appointments/", json=payload, catch_response=True, name="/api/appointments/ [POST Concurrent]") as response:
            if response.status_code == 201:
                response.success()
            elif response.status_code == 400 and ("Conflicto" in response.text or "scheduled_at" in response.text or "patient" in response.text):
                # Un rechazo 400 por bloqueo de traslape es el comportamiento esperado del negocio
                response.success()
            else:
                response.failure(f"Fallo inesperado: {response.status_code} - {response.text}")