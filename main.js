document.addEventListener("DOMContentLoaded", () => {
  const DEFAULTS = { pot: 40, watts: 200 };
  const STORAGE_KEYS = { pot: "pot", watts: "watts" };

  const potInput = document.getElementById("pot");
  const wattsInput = document.getElementById("watts");
  const litersRange = document.getElementById("litersRange");
  const flush = document.getElementById("flush");
  const interval = document.getElementById("interval");
  const calcBtn = document.getElementById("calc-btn");
  const resetBtn = document.getElementById("reset-btn");

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

  function readNumber(input) {
    return parseFloat(input.value);
  }

  function loadStoredNumber(key, fallback) {
    const stored = localStorage.getItem(key);
    const num = parseFloat(stored);
    return Number.isFinite(num) ? num : fallback;
  }

  function saveInputs(pot, watts) {
    localStorage.setItem(STORAGE_KEYS.pot, pot);
    localStorage.setItem(STORAGE_KEYS.watts, watts);
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

    litersRange.textContent = `${watering.minLit.toFixed(1)}–${watering.maxLit.toFixed(1)} L`;
    flush.textContent = `${watering.flushLit.toFixed(1)} L`;
    interval.textContent = `${intervalData.low}–${intervalData.high} Tage`;
    updateNutrients(watering.minLit, watering.maxLit);
  }

  function recalc() {
    const pot = readNumber(potInput);
    const watts = readNumber(wattsInput);

    if (!Number.isFinite(pot) || !Number.isFinite(watts) || pot <= 0 || watts <= 0) {
      alert("Bitte gültige positive Werte eingeben!");
      return;
    }

    renderResults(pot, watts);
    saveInputs(pot, watts);
  }

  function resetDefaults() {
    potInput.value = DEFAULTS.pot;
    wattsInput.value = DEFAULTS.watts;
    recalc();
  }

  function hydrateFromStorage() {
    potInput.value = loadStoredNumber(STORAGE_KEYS.pot, DEFAULTS.pot);
    wattsInput.value = loadStoredNumber(STORAGE_KEYS.watts, DEFAULTS.watts);
  }

  calcBtn.addEventListener("click", recalc);
  resetBtn.addEventListener("click", resetDefaults);

  hydrateFromStorage();
  recalc();
});
