from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomLoginView,
    LogoutView,
    GetSecurityQuestionsView,
    ResetPasswordWithQuestionsView,
    ChangePasswordView,
    UserViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # CRUD de Usuarios (/api/users/)
    path('', include(router.urls)),

    # Autenticación y Tokens
    path('auth/login/', CustomLoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),

    # Recuperación y Cambio de Contraseña
    path('auth/security-questions/', GetSecurityQuestionsView.as_view(), name='security_questions'),
    path('auth/reset-password-questions/', ResetPasswordWithQuestionsView.as_view(), name='reset_password_questions'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
]