
import React, { useEffect, useMemo, useState, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL || ''; 

export default function TwistTool() {
  const [recipes, setRecipes] = useState([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);

  const [suggestMap, setSuggestMap] = useState({});   
  const [selections, setSelections] = useState({});   
  const [preview, setPreview] = useState('');

  // Load approved recipes
  useEffect(() => {
    fetch('/api/recipes')
      .then(r => r.json())
      .then(d => setRecipes(Array.isArray(d) ? d : []))
      .catch(() => setRecipes([]));
  }, []);

  // Load server suggestion dictionary
  useEffect(() => {
    fetch('/api/visitor/twist-suggestions')
      .then(r => r.json())
      .then(d => setSuggestMap(d?.map || {}))
      .catch(() => setSuggestMap({}));
  }, []);

  // Filter by search box
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return recipes;
    return recipes.filter(r =>
      r.name?.toLowerCase().includes(query) ||
      r.ingredients?.toLowerCase().includes(query) ||
      r.culture?.toLowerCase().includes(query)
    );
  }, [q, recipes]);

  // Split original ingredients into lines
  const ingredientLines = useMemo(() => {
    return (selected?.ingredients || '')
      .split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }, [selected]);

  // Find suggestion hits for this recipe
  const hits = useMemo(() => {
    if (!selected || !ingredientLines.length) return [];
    const out = [];
    ingredientLines.forEach(line => {
      const low = line.toLowerCase();
      Object.keys(suggestMap).forEach(rawKey => {
        const synonyms = rawKey.split('|').map(s => s.trim());
        if (synonyms.some(term => low.includes(term))) {
          const canonical = synonyms[0];
          if (!out.find(x => x.key === canonical)) {
            out.push({ key: canonical, options: suggestMap[rawKey] || [] });
          }
        }
      });
    });
    return out;
  }, [ingredientLines, suggestMap, selected]);

  // Live preview: replace canonical key with chosen sub
  useEffect(() => {
    if (!selected) return setPreview('');
    let text = selected.ingredients || '';
    Object.entries(selections).forEach(([from, to]) => {
      if (!to) return;
      const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig');
      text = text.replace(re, to);
    });
    setPreview(text);
  }, [selections, selected]);

  
  const submitTwist = useCallback(async () => {
    if (!selected) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to submit a twist.');
      return;
    }

    const choices = Object.entries(selections)
      .filter(([, to]) => !!to)
      .map(([from, to]) => ({ from, to }));

    const res = await fetch(`${API}/api/visitor/twist/${selected._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,   
      },
      body: JSON.stringify({ choices }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error || 'Failed to submit twist');
      return;
    }

    await res.json();
    alert('Twisted recipe submitted. A dietician will add the nutrition report.');
    setSelections({});
  }, [API, selected, selections]);

  return (
    <div className="twist-container" style={{ maxWidth: 980, margin: '0 auto', padding: '1rem' }}>
      <h2>Western Twist Tool</h2>

      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr 1fr', marginBottom: 12 }}>
        <input
          placeholder="Search a traditional recipe to twist…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ gridColumn: '1 / -1', padding: 10, borderRadius: 12, border: '1px solid #ddd' }}
        />
        {filtered.slice(0, 4).map(r => (
          <button
            key={r._id}
            onClick={() => { setSelected(r); setSelections({}); }}
            style={{
              textAlign: 'left', padding: 10, borderRadius: 12,
              border: '1px solid #eee', background: selected?._id === r._id ? '#f7f9ff' : '#fff'
            }}
          >
            <div style={{ fontWeight: 700 }}>{r.name}</div>
            <div style={{ color: '#777', fontSize: 12 }}>{(r.culture || r.category || '').toString()}</div>
          </button>
        ))}
      </div>

      {!selected ? (
        <p style={{ color: '#777' }}>Pick a recipe to start twisting.</p>
      ) : (
        <div style={{ border: '1px solid #eee', borderRadius: 14, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>{selected.name}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <h4>Original Ingredients</h4>
              <textarea readOnly value={ingredientLines.join('\n')}
                        style={{ width: '100%', minHeight: 160, resize: 'vertical' }} />
            </div>

            <div>
              <h4>Western Substitutes</h4>
              {hits.length === 0 ? (
                <p style={{ color: '#777', fontSize: 14 }}>
                  No specific suggestions detected for this recipe. You can still submit a twist by editing the ingredients manually
                  (Head Chef may tweak).
                </p>
              ) : hits.map(h => (
                <div key={h.key} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>{h.key}</div>
                  <select
                    value={selections[h.key] || ''}
                    onChange={e => setSelections(s => ({ ...s, [h.key]: e.target.value }))}
                    style={{ padding: 8, borderRadius: 10, border: '1px solid #ddd' }}
                  >
                    <option value="">(skip)</option>
                    {h.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div>
              <h4>Preview (Twisted Ingredients)</h4>
              <textarea readOnly value={preview || ingredientLines.join('\n')}
                        style={{ width: '100%', minHeight: 160, resize: 'vertical' }} />
            </div>

            <div>
              <h4>Base Recipe Nutrition (for reference)</h4>
              <MacroPie
                protein={selected?.nutrition?.protein || 0}
                carbs={selected?.nutrition?.carbs || 0}
                fat={selected?.nutrition?.fat || 0}
              />
              <small style={{ color: '#666' }}>
                The twisted recipe’s nutrition will be added by the dietician after review.
              </small>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button onClick={submitTwist}
                    style={{ padding: '10px 14px', borderRadius: 10, border: 'none',
                             background: '#111', color: '#fff' }}>
              Submit for Head Chef Approval
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* tiny inline pie for macros */
function MacroPie({ protein = 0, carbs = 0, fat = 0, size = 160, stroke = 18 }) {
  const total = Math.max(0, Number(protein)) + Math.max(0, Number(carbs)) + Math.max(0, Number(fat));
  if (!total) return <div style={{ color: '#777' }}>No macro data</div>;

  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const center = size / 2;

  const pCarbs = carbs / total;
  const pProtein = protein / total;
  const pFat = fat / total;

  const sCarbs = c * pCarbs;
  const sProtein = c * pProtein;
  const sFat = c * pFat;

  const oCarbs = 0;
  const oProtein = c - sProtein;
  const oFat = c - sProtein - sFat;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Macro pie chart">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#f0f0f0" strokeWidth={stroke} />
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#f59e0b" strokeWidth={stroke}
                strokeDasharray={`${sCarbs} ${c - sCarbs}`} strokeDashoffset={oCarbs}
                transform={`rotate(-90 ${center} ${center})`} />
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#3b82f6" strokeWidth={stroke}
                strokeDasharray={`${sProtein} ${c - sProtein}`} strokeDashoffset={oProtein}
                transform={`rotate(-90 ${center} ${center})`} />
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#ef4444" strokeWidth={stroke}
                strokeDasharray={`${sFat} ${c - sFat}`} strokeDashoffset={oFat}
                transform={`rotate(-90 ${center} ${center})`} />
      </svg>
      <div>
        <div><b>Carbs:</b> {Math.round(pCarbs * 100)}%</div>
        <div><b>Protein:</b> {Math.round(pProtein * 100)}%</div>
        <div><b>Fat:</b> {Math.round(pFat * 100)}%</div>
      </div>
    </div>
  );
}
