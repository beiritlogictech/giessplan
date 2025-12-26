const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");
const outPath = path.join(__dirname, "planner", "static", "planner", "env.js");

if (!fs.existsSync(envPath)) {
  console.error("Keine .env gefunden. Bitte .env aus .env.example erstellen.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const match = envContent.match(/^OPENWEATHER_KEY\s*=\s*(.+)$/m);

if (!match || !match[1]) {
  console.error("OPENWEATHER_KEY nicht in .env gefunden.");
  process.exit(1);
}

const key = match[1].trim();
const js = `window.__ENV = { OPENWEATHER_KEY: "${key}" };`;

fs.writeFileSync(outPath, js, "utf8");
console.log("env.js erzeugt.");
