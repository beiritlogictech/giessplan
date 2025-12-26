document.addEventListener("DOMContentLoaded", () => {
  const appContextEl = document.getElementById("app-context");
  const appContext = appContextEl ? JSON.parse(appContextEl.textContent || "{}") : {};
  const isAuthenticated = !!appContext.isAuthenticated;
  const serverProfile = appContext.profile || {};

  const DEFAULTS = {
    pot: serverProfile.pot ?? 40,
    watts: serverProfile.watts ?? 200,
    city: serverProfile.city ?? "",
  };
  const STORAGE_KEYS = { pot: "pot", watts: "watts", city: "city" };

  const dom = {
    potInput: document.getElementById("pot"),
    wattsInput: document.getElementById("watts"),
    litersRange: document.getElementById("litersRange"),
    flush: document.getElementById("flush"),
    interval: document.getElementById("interval"),
    calcBtn: document.getElementById("calc-btn"),
    resetBtn: document.getElementById("reset-btn"),
    cityInput: document.getElementById("city"),
    weatherBtn: document.getElementById("weather-btn"),
    weatherStatus: document.getElementById("weather-status"),
    weatherMeta: document.getElementById("weather-meta"),
    weatherSuggestion: document.getElementById("weather-suggestion"),
  };

  const nutrientConfig = [
    { key: "grow", elementId: "grow-amount", dosePerLiter: 2 },
    { key: "calmag", elementId: "calmag-amount", dosePerLiter: 1 },
    { key: "topmax", elementId: "topmax-amount", dosePerLiter: 1 },
    { key: "biobloom", elementId: "biobloom-amount", dosePerLiter: 2 },
  ];

  const nutrientElements = nutrientConfig.reduce((acc, item) => {
    acc[item.key] = document.getElementById(item.elementId);
    return acc;
  }, {});

  const storage = {
    number(key, fallback) {
      const stored = localStorage.getItem(key);
      const num = parseFloat(stored);
      return Number.isFinite(num) ? num : fallback;
    },
    text(key, fallback = "") {
      return localStorage.getItem(key) || fallback;
    },
    saveInputs(pot, watts) {
      localStorage.setItem(STORAGE_KEYS.pot, pot);
      localStorage.setItem(STORAGE_KEYS.watts, watts);
    },
    saveCity(city) {
      localStorage.setItem(STORAGE_KEYS.city, city);
    },
  };

  function getCsrfToken() {
    const cookie = document.cookie.split(";").find((c) => c.trim().startsWith("csrftoken="));
    if (cookie) return cookie.split("=")[1];
    const meta = document.querySelector("meta[name='csrf-token']");
    return meta ? meta.getAttribute("content") : "";
  }

  async function persistPreferences(pot, watts, city) {
    storage.saveInputs(pot, watts);
    storage.saveCity(city);

    if (!isAuthenticated) return;

    try {
      await fetch("/api/preferences/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken(),
        },
        body: JSON.stringify({ pot, watts, city }),
      });
    } catch (err) {
      console.warn("Konnte Profil nicht speichern:", err);
    }
  }

  const format = {
    range(min, max, unit) {
      return `${min.toFixed(1)}–${max.toFixed(1)} ${unit}`;
    },
  };

  function readNumber(input) {
    return parseFloat(input.value);
  }

  function calculateWatering(pot) {
    return {
      minLit: pot * 0.2,
      maxLit: pot * 0.25,
      flushLit: pot * 3,
    };
  }

  function calculateInterval(watts) {
    let low = 4;
    let high = 6;
    if (watts >= 300) [low, high] = [3, 5];
    if (watts >= 600) [low, high] = [2, 4];
    return { low, high };
  }

  function updateNutrients(minLit, maxLit) {
    nutrientConfig.forEach(({ key, dosePerLiter }) => {
      const minDose = (minLit * dosePerLiter).toFixed(1);
      const maxDose = (maxLit * dosePerLiter).toFixed(1);
      nutrientElements[key].textContent = `${minDose}–${maxDose} ml`;
    });
  }

  function renderResults(pot, watts) {
    const watering = calculateWatering(pot);
    const intervalData = calculateInterval(watts);

    dom.litersRange.textContent = format.range(watering.minLit, watering.maxLit, "L");
    dom.flush.textContent = `${watering.flushLit.toFixed(1)} L`;
    dom.interval.textContent = `${intervalData.low}–${intervalData.high} Tage`;
    updateNutrients(watering.minLit, watering.maxLit);
  }

  function recalc() {
    const pot = readNumber(dom.potInput);
    const watts = readNumber(dom.wattsInput);

    if (!Number.isFinite(pot) || !Number.isFinite(watts) || pot <= 0 || watts <= 0) {
      alert("Bitte gültige positive Werte eingeben!");
      return;
    }

    renderResults(pot, watts);
    persistPreferences(pot, watts, dom.cityInput.value.trim());
  }

  function resetDefaults() {
    dom.potInput.value = DEFAULTS.pot;
    dom.wattsInput.value = DEFAULTS.watts;
    recalc();
  }

  function hydrateFromStorage() {
    const pot = isAuthenticated && serverProfile.pot ? serverProfile.pot : storage.number(STORAGE_KEYS.pot, DEFAULTS.pot);
    const watts =
      isAuthenticated && serverProfile.watts ? serverProfile.watts : storage.number(STORAGE_KEYS.watts, DEFAULTS.watts);
    const city = isAuthenticated && typeof serverProfile.city === "string"
      ? serverProfile.city
      : storage.text(STORAGE_KEYS.city, DEFAULTS.city || "");

    dom.potInput.value = pot;
    dom.wattsInput.value = watts;
    dom.cityInput.value = city;
  }

  async function fetchWeather() {
    let city = dom.cityInput.value.trim();
    if (!city) {
      const modalInput = document.getElementById("modal-city-input");
      const saveBtn = document.getElementById("modal-city-save");
      const bsModal = new bootstrap.Modal(document.getElementById("modalCity"));
      modalInput.value = "";
      bsModal.show();
      return new Promise((resolve) => {
        const submit = () => {
          city = modalInput.value.trim();
          if (!city) return;
          dom.cityInput.value = city;
          bsModal.hide();
          saveBtn.removeEventListener("click", submit);
          resolve(fetchWeather());
        };
        saveBtn.addEventListener("click", submit);
      });
    }

    dom.weatherStatus.textContent = "Lade Wetterdaten...";
    dom.weatherMeta.textContent = city;
    dom.weatherSuggestion.textContent = "—";
    dom.weatherSuggestion.classList.remove("tone-success", "tone-warning");

    try {
      const response = await fetch(`/api/weather/?city=${encodeURIComponent(city)}`);
      if (!response.ok) {
        let detail = `${response.status} ${response.statusText}`;
        try {
          const errJson = await response.json();
          if (errJson?.message) detail = `${detail} – ${errJson.message}`;
          if (errJson?.error) detail = `${detail} – ${errJson.error}`;
          if (errJson?.detail) detail = `${detail} – ${errJson.detail}`;
        } catch {
          /* ignore */
        }
        throw new Error(`Fehler beim Laden der Wetterdaten (${detail})`);
      }
      const data = await response.json();

      dom.weatherStatus.textContent = `${data.temp.toFixed(1)}°C, ${data.description}`;
      dom.weatherMeta.textContent = `Luftfeuchte ${data.humidity}% · Wind ${data.wind_kmh.toFixed(1)} km/h`;
      dom.weatherSuggestion.textContent = data.suggestion?.text || "—";
      if (data.suggestion?.tone === "ok") dom.weatherSuggestion.classList.add("tone-success");
      if (data.suggestion?.tone === "warn") dom.weatherSuggestion.classList.add("tone-warning");
      if (!data.suggestion?.tone) dom.weatherSuggestion.classList.add("tone-success");

      persistPreferences(readNumber(dom.potInput), readNumber(dom.wattsInput), city);
    } catch (err) {
      dom.weatherStatus.textContent = "Wetterdaten konnten nicht geladen werden.";
      dom.weatherMeta.textContent = err.message || "Unbekannter Fehler";
      dom.weatherSuggestion.textContent = "—";
    }
  }

  dom.calcBtn.addEventListener("click", recalc);
  dom.resetBtn.addEventListener("click", resetDefaults);
  dom.weatherBtn.addEventListener("click", fetchWeather);

  hydrateFromStorage();
  recalc();
});
