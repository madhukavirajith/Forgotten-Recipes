
import React, { useMemo, useState } from "react";


const FRACTIONS = {
  "¼": 0.25, "½": 0.5, "¾": 0.75,
  "⅓": 1 / 3, "⅔": 2 / 3,
  "⅕": 0.2, "⅖": 0.4, "⅗": 0.6, "⅘": 0.8,
  "⅙": 1 / 6, "⅚": 5 / 6,
  "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

// ingredients considered “spicy”
const SPICY_RE = /\b(chil+?i|chili|chilli|green chilli|red chilli|chilli powder|cayenne|paprika|pepper|black pepper|peppercorns?)\b/i;

// scale factors
const SPICE_FACTORS = { Mild: 0.6, Medium: 1.0, Spicy: 1.4 };
const PORTION_PRESETS = [
  { key: "single", label: "Single", factor: 1 },
  { key: "couple", label: "Couple", factor: 2 },
  { key: "family", label: "Family (4)", factor: 4 },
  { key: "event",  label: "Event (10)", factor: 10 },
];

// turn “1 1/2”, “1/2”, “2-3”, “2–3”, “½” into numbers
function parseAmountToken(token) {
  token = token.trim();
  // unicode fraction only
  if (FRACTIONS[token] != null) return FRACTIONS[token];

  // mixed number: 1 1/2
  const mixed = token.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);

  // simple fraction: 1/2
  const frac = token.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);

  // decimal / integer
  const num = token.replace(',', '.');
  if (!isNaN(Number(num))) return Number(num);

  return null;
}

// returns scaled line (keeps text; scales first numeric or range)
function scaleLine(line, factor) {
  const s = line;

  // range like "2-3" or "2–3"
  const range = s.match(/^(\s*)(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])\s*[-–]\s*(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])(.*)$/);
  if (range) {
    const [ , lead, aTok, bTok, tail ] = range;
    const a = parseAmountToken(aTok);
    const b = parseAmountToken(bTok);
    if (a != null && b != null) {
      const a2 = formatAmount(a * factor);
      const b2 = formatAmount(b * factor);
      return `${lead}${a2}-${b2}${tail}`;
    }
  }

  // single amount at start
  const single = s.match(/^(\s*)(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])(.*)$/);
  if (single) {
    const [ , lead, tok, tail ] = single;
    const val = parseAmountToken(tok);
    if (val != null) {
      const val2 = formatAmount(val * factor);
      return `${lead}${val2}${tail}`;
    }
  }

  // nothing to scale (no amount found)
  return s;
}

function formatAmount(n) {
  // keep 1 decimal if needed
  const r = Math.round(n * 10) / 10;
  return (Math.abs(r - Math.round(r)) < 1e-9) ? String(Math.round(r)) : String(r);
}

function splitLines(ingredients) {
  if (!ingredients) return [];
  // split by newlines OR commas (common in your data)
  return ingredients
    .split(/\r?\n|,(?=(?:[^()]|\([^)]*\))*$)/g)
    .map(l => l.trim())
    .filter(Boolean);
}

/** Component **/
export default function SpicePortionSimulator({ ingredients, baseSpice = "Medium" }) {
  const [spice, setSpice] = useState("Medium");
  const [portionKey, setPortionKey] = useState("single");

  const portionFactor = useMemo(
    () => (PORTION_PRESETS.find(p => p.key === portionKey)?.factor || 1),
    [portionKey]
  );

  const lines = useMemo(() => splitLines(ingredients), [ingredients]);

  const adjusted = useMemo(() => {
    const sFactor = SPICE_FACTORS[spice] ?? 1;
    return lines.map((line) => {
      const isSpicy = SPICY_RE.test(line);
      // Portion factor always applies, then extra multiplier for spicy items
      const factor = portionFactor * (isSpicy ? sFactor : 1);
      return scaleLine(line, factor);
    });
  }, [lines, spice, portionFactor]);

  const showGastritisWarning = useMemo(() => {
    if (!lines.some((l) => SPICY_RE.test(l))) return false;
    return spice === "Spicy" || (spice === "Medium" && baseSpice !== "Mild");
  }, [lines, spice, baseSpice]);

  return (
    <div className="simulator">
      <h3>Spice & Portions</h3>

      <div className="sim-row">
        <div className="sim-col">
          <div className="label">Spice level</div>
          <div className="segmented">
            {["Mild", "Medium", "Spicy"].map((lvl) => (
              <button
                key={lvl}
                className={`seg-btn ${spice === lvl ? "active" : ""}`}
                onClick={() => setSpice(lvl)}
                type="button"
              >
                {lvl}
              </button>
            ))}
          </div>
          {showGastritisWarning && (
            <div className="health-warning">
              ⚠️ Spicy foods may aggravate gastritis / acid reflux. Consider using
              <b> Mild</b> or consult a professional.
            </div>
          )}
        </div>

        <div className="sim-col">
          <div className="label">Portion size</div>
          <div className="segmented">
            {PORTION_PRESETS.map((p) => (
              <button
                key={p.key}
                className={`seg-btn ${portionKey === p.key ? "active" : ""}`}
                onClick={() => setPortionKey(p.key)}
                type="button"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="adjusted-box">
        <div className="box-head">Adjusted Ingredients</div>
        {adjusted.length === 0 ? (
          <div className="muted">No ingredients found.</div>
        ) : (
          <ul className="ing-list">
            {adjusted.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        )}
        <div className="muted small">
          Scaling is heuristic; always taste and adjust. Nutrition values shown on
          the page are for the original recipe.
        </div>
      </div>
    </div>
  );
}
