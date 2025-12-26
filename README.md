# 💧 Gießplan & Pflege-Checker (Django)

Interaktive Gieß-/Dünger- und Wetter-Check-App (Bootstrap + Vanilla JS) mit serverseitigem OpenWeather-Proxy.

## Voraussetzungen

- Python 3.9+ (venv empfohlen)
- Optional Node, falls du eigene Frontend-Builds ergänzen willst

## Schnellstart

1. Umgebung aufsetzen

   ```bash
   cd giessplan
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Konfiguration hinterlegen

   ```bash
   cp .env.example .env          # OPENWEATHER_KEY setzen, optional DJANGO_SECRET_KEY/DJANGO_DEBUG
   ```

3. Datenbank & Server starten

   ```bash
   python manage.py migrate
   python manage.py runserver    # http://127.0.0.1:8000/
   ```

## Funktionen

- Berechnet Gießmenge (20–25 % Volumen), Spülmenge (3×) und Intervall (abhängig von W).
- BIOBIZZ-Dosierung: Grow 2 ml/L, CalMag 1 ml/L, TopMax 1 ml/L, BioBloom 2 ml/L (Basis: Gießmenge).
- Wetter-Check über `/api/weather/`; Key bleibt serverseitig, Frontend ruft nur die API.

## Deployment

- Umgebungsvariablen: `OPENWEATHER_KEY` serverseitig setzen; `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=0` für Prod.
- Staticfiles: Für Produktion `python manage.py collectstatic` einplanen (aktuelles Setup nutzt App-Static).
- GitHub Pages (statisch): `docs/index.html` zeigt eine „In Arbeit“-Seite. Pages auf Branch `main`, Folder `/docs` konfigurieren, bis das echte Deployment live ist.
- Assets: Favicon unter `planner/static/planner/img/wassertropfen.svg` (Quelle: Pixabay – Motiv von OpenClipart-Vectors: [https://pixabay.com/de/users/openclipart-vectors-30363/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=2023258](https://pixabay.com/de/users/openclipart-vectors-30363/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=2023258))
