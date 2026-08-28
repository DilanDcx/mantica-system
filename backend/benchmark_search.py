import os
import time
import statistics
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from patients.models import Patient

SEARCH_TERMS = ['Carlos', 'Torres', '081-', '8888', 'EXP-00', 'Maria', 'González', 'Castillo']

print("=== INICIANDO BENCHMARK DE BÚSQUEDA (HU-NFR01) ===")
latencies = []

# Ejecución de 100 consultas representativas
for i in range(100):
    term = SEARCH_TERMS[i % len(SEARCH_TERMS)]
    t0 = time.perf_counter()
    
    # Consulta simulando el SearchFilter del ViewSet
    results = list(Patient.objects.filter(
        first_name__icontains=term
    ) | Patient.objects.filter(
        last_name__icontains=term
    ) | Patient.objects.filter(
        identification_card__icontains=term
    ) | Patient.objects.filter(
        phone_number__icontains=term
    ))
    
    t1 = time.perf_counter()
    elapsed_ms = (t1 - t0) * 1000.0
    latencies.append(elapsed_ms)

latencies.sort()

def get_percentile(data, percentile):
    k = (len(data) - 1) * (percentile / 100.0)
    f = int(k)
    c = f + 1
    if c < len(data):
        return data[f] + (data[c] - data[f]) * (k - f)
    return data[f]

p50 = statistics.median(latencies)
p95 = get_percentile(latencies, 95)
p99 = get_percentile(latencies, 99)

print(f"Total consultas ejecutadas: {len(latencies)}")
print(f"Registros en BD: {Patient.objects.count()}")
print(f"Latencia Media (P50): {p50:.2f} ms")
print(f"Latencia Percentil 95 (P95): {p95:.2f} ms")
print(f"Latencia Percentil 99 (P99): {p99:.2f} ms")

if p95 < 500:
    print("\n>>> RESULTADO QA: APROBADO (P95 < 500 ms) <<<")
else:
    print("\n>>> RESULTADO QA: NO CUMPLE SLA <<<")