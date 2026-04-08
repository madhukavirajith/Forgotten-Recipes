import React, { useEffect, useMemo, useState } from 'react';
import './MeasurementConverter.css';

/** Mass -> grams */
const MASS_TO_G = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237,
};

/** Volume -> milliliters */
const VOL_TO_ML = {
  tsp: 4.92892159375,
  tbsp: 14.78676478125,
  'fl oz': 29.5735295625,
  cup: 236.5882365,
  pint: 473.176473,
  quart: 946.352946,
  gallon: 3785.411784,
  ml: 1,
  l: 1000,
};

const MASS_UNITS = Object.keys(MASS_TO_G);
const VOL_UNITS = Object.keys(VOL_TO_ML);

const INGREDIENTS = [
  { key: 'water', label: 'Water', d: 1.00 },
  { key: 'milk', label: 'Milk', d: 1.03 },
  { key: 'all_purpose_flour', label: 'Flour (All-Purpose)', d: 0.53 },
  { key: 'whole_wheat_flour', label: 'Flour (Whole Wheat)', d: 0.59 },
  { key: 'sugar', label: 'Sugar (Granulated)', d: 0.85 },
  { key: 'brown_sugar', label: 'Sugar (Brown, packed)', d: 0.90 },
  { key: 'butter', label: 'Butter', d: 0.91 },
  { key: 'olive_oil', label: 'Oil (Olive/Vegetable)', d: 0.91 },
  { key: 'honey', label: 'Honey', d: 1.42 },
  { key: 'rice', label: 'Rice (uncooked)', d: 0.80 },
  { key: 'salt', label: 'Salt (table)', d: 1.20 },
  { key: 'yogurt', label: 'Yogurt', d: 1.03 },
  { key: 'custom', label: 'Custom…', d: 1.00 },
];

const DEFAULTS = { amount: 1, fromUnit: 'cup', toUnit: 'g', ingredientKey: 'water', decimals: 2 };

const isMass = (u) => MASS_UNITS.includes(u);
const isVol  = (u) => VOL_UNITS.includes(u);

function convert({ amount, fromUnit, toUnit, density }) {
  const a = Number(amount);
  if (!a || a < 0) return { value: 0, steps: ['Enter a positive amount.'] };

  // Mass -> Mass
  if (isMass(fromUnit) && isMass(toUnit)) {
    const g = a * MASS_TO_G[fromUnit];
    const out = g / MASS_TO_G[toUnit];
    return { value: out, steps: [
      `${a} ${fromUnit} → g = ${a} × ${MASS_TO_G[fromUnit].toFixed(6)} = ${g.toFixed(3)} g`,
      `g → ${toUnit} = ${g.toFixed(3)} ÷ ${MASS_TO_G[toUnit].toFixed(6)} = ${out}`
    ]};
  }

  // Volume -> Volume
  if (isVol(fromUnit) && isVol(toUnit)) {
    const ml = a * VOL_TO_ML[fromUnit];
    const out = ml / VOL_TO_ML[toUnit];
    return { value: out, steps: [
      `${a} ${fromUnit} → mL = ${a} × ${VOL_TO_ML[fromUnit].toFixed(3)} = ${ml.toFixed(2)} mL`,
      `mL → ${toUnit} = ${ml.toFixed(2)} ÷ ${VOL_TO_ML[toUnit].toFixed(3)} = ${out}`
    ]};
  }

  // Volume -> Mass
  if (isVol(fromUnit) && isMass(toUnit)) {
    const ml = a * VOL_TO_ML[fromUnit];
    const g = ml * density;
    const out = g / MASS_TO_G[toUnit];
    return { value: out, steps: [
      `${a} ${fromUnit} → mL = ${a} × ${VOL_TO_ML[fromUnit].toFixed(3)} = ${ml.toFixed(2)} mL`,
      `g = mL × density = ${ml.toFixed(2)} × ${density} = ${g.toFixed(2)} g`,
      `g → ${toUnit} = ${g.toFixed(2)} ÷ ${MASS_TO_G[toUnit].toFixed(6)} = ${out}`
    ]};
  }

  // Mass -> Volume
  if (isMass(fromUnit) && isVol(toUnit)) {
    const g = a * MASS_TO_G[fromUnit];
    const ml = g / density;
    const out = ml / VOL_TO_ML[toUnit];
    return { value: out, steps: [
      `${a} ${fromUnit} → g = ${a} × ${MASS_TO_G[fromUnit].toFixed(6)} = ${g.toFixed(2)} g`,
      `mL = g ÷ density = ${g.toFixed(2)} ÷ ${density} = ${ml.toFixed(2)} mL`,
      `mL → ${toUnit} = ${ml.toFixed(2)} ÷ ${VOL_TO_ML[toUnit].toFixed(3)} = ${out}`
    ]};
  }

  return { value: 0, steps: ['Unsupported unit combination.'] };
}

export default function MeasurementConverter() {
  const [amount, setAmount] = useState(DEFAULTS.amount);
  const [fromUnit, setFromUnit] = useState(DEFAULTS.fromUnit);
  const [toUnit, setToUnit] = useState(DEFAULTS.toUnit);
  const [ingredientKey, setIngredientKey] = useState(DEFAULTS.ingredientKey);
  const [customDensity, setCustomDensity] = useState(1.0);
  const [decimals, setDecimals] = useState(DEFAULTS.decimals);

  const ingredient = useMemo(
    () => INGREDIENTS.find(i => i.key === ingredientKey) || INGREDIENTS[0],
    [ingredientKey]
  );
  const density = ingredient.key === 'custom' ? Number(customDensity || 1) : ingredient.d;

  useEffect(() => {
    if (ingredientKey !== 'custom') setCustomDensity(ingredient.d);
  }, [ingredientKey]); 

  const { value, steps } = useMemo(
    () => convert({ amount, fromUnit, toUnit, density }),
    [amount, fromUnit, toUnit, density]
  );

  const rounded = useMemo(() => {
    const n = Number(value);
    if (!isFinite(n)) return '';
    const factor = Math.pow(10, Number(decimals || 0));
    return Math.round(n * factor) / factor;
  }, [value, decimals]);

  const swap = () => { setFromUnit(toUnit); setToUnit(fromUnit); };

  const canCross = isVol(fromUnit) !== isVol(toUnit);
  const resultText = `${amount || 0} ${fromUnit} ≈ ${rounded || 0} ${toUnit}${canCross ? ` (${ingredient.label})` : ''}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(resultText); alert('Copied to clipboard'); } catch {}
  };

  return (
    <div className="conv">
      <h2 className="conv__title">Measurement Converter</h2>

      <div className="conv__grid">
        <div className="conv__block">
          <label className="lbl">Amount</label>
          <input type="number" min="0" step="any" className="inp" value={amount}
                 onChange={e => setAmount(e.target.value)} />
        </div>

        <div className="conv__block">
          <label className="lbl">From</label>
          <select className="inp" value={fromUnit} onChange={e => setFromUnit(e.target.value)}>
            <optgroup label="Volume">{VOL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}</optgroup>
            <optgroup label="Mass">{MASS_UNITS.map(u => <option key={u} value={u}>{u}</option>)}</optgroup>
          </select>
        </div>

        <div className="conv__swap">
          <button className="btn btn--ghost" onClick={swap}>⇅ Swap</button>
        </div>

        <div className="conv__block">
          <label className="lbl">To</label>
          <select className="inp" value={toUnit} onChange={e => setToUnit(e.target.value)}>
            <optgroup label="Volume">{VOL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}</optgroup>
            <optgroup label="Mass">{MASS_UNITS.map(u => <option key={u} value={u}>{u}</option>)}</optgroup>
          </select>
        </div>

        <div className="conv__block">
          <label className="lbl">Decimals</label>
          <select className="inp" value={decimals} onChange={e => setDecimals(e.target.value)}>
            <option>0</option><option>1</option><option>2</option><option>3</option><option>4</option>
          </select>
        </div>
      </div>

      {canCross && (
        <div className="conv__density">
          <div className="conv__block conv__ingredient">
            <label className="lbl">Ingredient (for density)</label>
            <select className="inp" value={ingredientKey} onChange={e => setIngredientKey(e.target.value)}>
              {INGREDIENTS.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
            </select>
          </div>

          <div className="conv__block">
            <label className="lbl">Density (g/mL)</label>
            <input type="number" min="0.01" step="any"
                   disabled={ingredient.key !== 'custom'}
                   className="inp"
                   value={ingredient.key === 'custom' ? customDensity : ingredient.d}
                   onChange={e => setCustomDensity(e.target.value)} />
            <small className="muted">Water ≈ 1.00, Olive oil ≈ 0.91, Honey ≈ 1.42</small>
          </div>
        </div>
      )}

      <div className="conv__result">
        <div className="conv__result-main">
          <div className="conv__result-line">{resultText}</div>
          <button className="btn" onClick={copy}>Copy</button>
        </div>

        <details className="conv__details">
          <summary>Show steps</summary>
          <ul>{steps.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </details>
      </div>

      <div className="conv__hints">
        <span className="pill">1 cup = 16 tbsp = 48 tsp</span>
        <span className="pill">1 cup ≈ 236.59 mL</span>
        <span className="pill">1 oz = 28.35 g</span>
        <span className="pill">1 lb = 16 oz = 453.59 g</span>
      </div>
    </div>
  );
}
