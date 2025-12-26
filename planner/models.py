from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    pot_volume = models.FloatField(default=40)
    watts = models.FloatField(default=200)
    city = models.CharField(max_length=120, blank=True, default="")

    def as_dict(self):
        return {
            "pot": self.pot_volume,
            "watts": self.watts,
            "city": self.city,
        }

    def __str__(self):
        return f"Profile for {self.user.username}"
