import json
import os
import urllib.error
import urllib.parse
import urllib.request

from django.http import JsonResponse, HttpResponseBadRequest
from django.shortcuts import render
from django.views.decorators.http import require_GET


def home(request):
    return render(request, "planner/index.html")


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
