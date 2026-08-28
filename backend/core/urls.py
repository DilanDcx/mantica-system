from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),  # Expone la ruta http://localhost:8000/api/auth/login/
    path('api/', include('patients.urls')),
]