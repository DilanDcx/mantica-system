from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomLoginView

urlpatterns = [
    path('auth/login/', CustomLoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]