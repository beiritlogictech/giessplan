# 💧 Gießplan & Pflege-Checker (Django-App)

Interaktive Gieß-/Dünger- und Wetter-Check-App, jetzt als Django-Projekt mit statischen Assets (Bootstrap + Vanilla JS).

## Schnellstart (Lokal)

1) Python & Pipenv/venv bereitstellen  
   ```bash
   cd giessplan
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2) OpenWeather-Key hinterlegen (für Wetter-Vorschläge)  
   ```bash
   cp .env.example .env
   # OPENWEATHER_KEY in .env setzen (wird serverseitig genutzt)
   ```

3) Django starten  
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   Öffne http://127.0.0.1:8000/

## Technologie-Stack
- Django (Templates, Staticfiles)
- Bootstrap 5 + Manrope
- Vanilla JS (Berechnung, LocalStorage, OpenWeather-Fetch)

## Berechnungslogik (Reminder)
- Gießmenge: 20–25 % des Topfvolumens
- Spülmenge: 3 × Topfvolumen
- Intervall: <300 W → 4–6 Tage; ≥300 W → 3–5 Tage; ≥600 W → 2–4 Tage
- BIOBIZZ-Dosierung: Grow 2 ml/L, CalMag 1 ml/L, TopMax 1 ml/L, BioBloom 2 ml/L (auf Basis der Gießmenge pro Vorgang)

## Deploy-Hinweise
- Wetter-Key bleibt auf dem Server (Proxy unter /api/weather/); kein clientseitiges env.js mehr nötig.
- SECRET_KEY/DEBUG per Umgebungsvariablen setzen (`DJANGO_SECRET_KEY`, `DJANGO_DEBUG=0` im Prod).
- Für GitHub Pages (statisch): `docs/index.html` zeigt einen „In Arbeit“-Hinweis, bis ein vollwertiges Deployment läuft.
