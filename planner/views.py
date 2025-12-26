import json
import os
import urllib.error
import urllib.parse
import urllib.request

from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django.http import JsonResponse, HttpResponseBadRequest
from django.shortcuts import render, redirect
from django.views.decorators.http import require_GET, require_http_methods

from .models import UserProfile


def home(request):
    profile_data = None
    if request.user.is_authenticated:
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile_data = profile.as_dict()

    context = {
        "app_context_json": json.dumps(
            {"isAuthenticated": request.user.is_authenticated, "profile": profile_data or {}},
            ensure_ascii=False,
        )
    }
    return render(request, "planner/index.html", context)


def _suggest_action(temp, humidity, wind_kmh, description):
    desc = description.lower()
    has_rain = "rain" in desc or "regen" in desc
    is_stormy = wind_kmh > 30

    if has_rain or humidity >= 85:
        return {"text": "Heute kein Umtopfen – zu nass/regenreich.", "tone": "warn"}
    if is_stormy:
        return {"text": "Starker Wind – lieber drinnen bleiben.", "tone": "warn"}
    if 15 <= temp <= 26 and 45 <= humidity <= 75 and wind_kmh <= 15:
        return {"text": "Gutes Wetter zum Umtopfen oder Einsetzen.", "tone": "ok"}
    if temp < 10:
        return {"text": "Kühl – besser warten oder indoor arbeiten.", "tone": "info"}
    if temp > 30:
        return {"text": "Sehr warm – nur morgens/abends gießen/arbeiten.", "tone": "info"}
    return {"text": "Neutral – nach Gefühl entscheiden.", "tone": "info"}


@require_GET
def weather(request):
    city = request.GET.get("city", "").strip()
    if not city:
        return HttpResponseBadRequest("city parameter required")

    api_key = os.environ.get("OPENWEATHER_KEY")
    if not api_key:
        return JsonResponse({"error": "OPENWEATHER_KEY missing on server"}, status=500)

    params = {
        "q": city,
        "units": "metric",
        "lang": "de",
        "appid": api_key,
    }
    url = f"https://api.openweathermap.org/data/2.5/weather?{urllib.parse.urlencode(params)}"

    try:
        with urllib.request.urlopen(url, timeout=8) as resp:
            raw = resp.read()
            data = json.loads(raw)
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")
        return JsonResponse({"error": f"{e.code} {e.reason}", "detail": detail}, status=e.code)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

    temp = data.get("main", {}).get("temp", 0)
    humidity = data.get("main", {}).get("humidity", 0)
    wind_kmh = (data.get("wind", {}).get("speed") or 0) * 3.6
    description = (data.get("weather") or [{}])[0].get("description", "unbekannt")

    suggestion = _suggest_action(temp, humidity, wind_kmh, description)

    return JsonResponse(
        {
            "city": city,
            "temp": temp,
            "humidity": humidity,
            "wind_kmh": wind_kmh,
            "description": description,
            "suggestion": suggestion,
        }
    )


@login_required
@require_http_methods(["GET", "POST"])
def preferences(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        return JsonResponse(profile.as_dict())

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    pot = payload.get("pot")
    watts = payload.get("watts")
    city = payload.get("city", "").strip()

    if not isinstance(pot, (int, float)) or pot <= 0:
        return JsonResponse({"error": "pot must be positive number"}, status=400)
    if not isinstance(watts, (int, float)) or watts <= 0:
        return JsonResponse({"error": "watts must be positive number"}, status=400)

    profile.pot_volume = pot
    profile.watts = watts
    profile.city = city[:120]
    profile.save(update_fields=["pot_volume", "watts", "city"])

    return JsonResponse(profile.as_dict())


@require_http_methods(["GET", "POST"])
def signup(request):
    if request.user.is_authenticated:
        return redirect("home")

    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Registrierung erfolgreich. Du bist jetzt eingeloggt.")
            return redirect("home")
        else:
            first_error = next(iter(form.errors.as_data().values()), None)
            msg = first_error[0].messages[0] if first_error else "Bitte Eingaben prüfen."
            messages.error(request, f"Registrierung fehlgeschlagen: {msg}")
    else:
        form = UserCreationForm()

    return render(request, "registration/signup.html", {"form": form})
