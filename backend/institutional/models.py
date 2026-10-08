from django.db import models


class InstitutionalConfiguration(models.Model):
    name = models.CharField(
        max_length=200,
        default='Centro de Salud',
    )
    address = models.CharField(max_length=300, blank=True)
    logo_url = models.URLField(max_length=500, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.pk = 1
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.name