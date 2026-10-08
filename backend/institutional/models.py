from django.db import models


class InstitutionalConfiguration(models.Model):
    name = models.CharField(
        max_length=200,
        default='Centro de Salud',
    )
    address = models.CharField(max_length=300, blank=True)
    logo_url = models.URLField(max_length=500, blank=True)

    hours_title = models.CharField(max_length=100, blank=True, default='')
    weekday_label = models.CharField(max_length=100, blank=True, default='')
    weekday_hours = models.CharField(max_length=100, blank=True, default='')
    saturday_label = models.CharField(max_length=100, blank=True, default='')
    saturday_hours = models.CharField(max_length=100, blank=True, default='')
    emergency_label = models.CharField(max_length=100, blank=True, default='')
    emergency_hours = models.CharField(max_length=100, blank=True, default='')
    emergency_phone_label = models.CharField(max_length=100, blank=True, default='')
    emergency_phone = models.CharField(max_length=50, blank=True, default='')
    information_label = models.CharField(max_length=100, blank=True, default='')
    information_phone = models.CharField(max_length=50, blank=True, default='')

    campaign_title = models.CharField(max_length=200, blank=True, default='')
    campaign_text = models.TextField(blank=True, default='')

    mission_title = models.CharField(max_length=100, blank=True, default='')
    mission_text = models.TextField(blank=True, default='')

    certification_title = models.CharField(max_length=200, blank=True, default='')
    certification_text = models.CharField(max_length=200, blank=True, default='')

    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.pk = 1
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.name