import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Cookbook.css';

const API = process.env.REACT_APP_API_URL || '';


const useAuth = () => {
  const token = localStorage.getItem('token');
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {}),
    [token]
  );
  return { token, headers };
};


async function removeCookbookItem(idOrRecipeId, headers) {
  
  let res = await fetch(`${API}/api/visitor/cookbook/${idOrRecipeId}`, {
    method: 'DELETE',
    headers
  });
  if (res.ok) return true;

  
  res = await fetch(`${API}/api/visitor/cookbook/${idOrRecipeId}`, { method: 'DELETE', headers });
  return res.ok;
}


async function patchCookbookItem(itemId, payload, headers) {
  try {
    const res = await fetch(`${API}/api/visitor/cookbook/${itemId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    return false;
  }
}


async function downloadRecipePdf(recipeId, token) {
  if (!token) {
    alert('Please login to download recipes as PDF.');
    return;
  }
  try {
    const res = await fetch(`${API}/api/recipes/${recipeId}/recipe-pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Could not generate recipe PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recipe-${recipeId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert(e.message || 'Could not download recipe PDF');
  }
}

/** Print/Export selected items to a pretty, printer-friendly meal plan. */
function exportSelectedToPrint(selectedItems) {
  if (!selectedItems.length) {
    alert('Select at least one recipe.');
    return;
  }
  const win = window.open('', '_blank');
  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Meal Plan</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 24px; color:#111; }
    h1 { margin: 0 0 6px; }
    .muted { color:#6b7280; }
    .grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:16px; }
    .card { border:1px solid #eee; border-radius:12px; padding:14px; }
    .title { font-weight:800; margin:0 0 6px; }
    .meta { color:#6b7280; font-size: 13px; margin-bottom:8px; }
    .notes { background:#fffbe8; border:1px dashed #e3d9b5; padding:8px; border-radius:8px; margin-top:8px; }
    .kv { font-size:14px; line-height:1.45; margin-top:6px; }
    @media print {
      .grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <h1>Meal Plan</h1>
  <div class="muted">${new Date().toLocaleString()}</div>
  <div class="grid">
    ${selectedItems
      .map(
        (i) => `
      <div class="card">
        <div class="title">${i.recipe.name || 'Recipe'}</div>
        <div class="meta">
          ${[i.recipe.category, i.recipe.spiceLevel, i.recipe.dietType].filter(Boolean).join(' • ')}
        </div>
        <div class="kv"><b>Ingredients:</b> ${i.recipe.ingredients || '-'}</div>
        <div class="kv"><b>Instructions:</b> ${i.recipe.instructions || '-'}</div>
        ${i.notes ? `<div class="notes"><b>Notes:</b> ${i.notes}</div>` : ''}
      </div>
    `
      )
      .join('')}
  </div>
  <script>window.print();</script>
</body>
</html>`;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

/** Nutrition totals helper */
function sumNutrition(items) {
  const sum = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  items.forEach((it) => {
    const n = it.recipe?.nutrition || {};
    sum.calories += Number(n.calories || 0);
    sum.protein += Number(n.protein || 0);
    sum.carbs += Number(n.carbs || 0);
    sum.fat += Number(n.fat || 0);
  });
  return sum;
}

export default function CookbookPanel() {
  const { token, headers } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]); 
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Fetch cookbook on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API}/api/visitor/cookbook`, { headers });
        const data = await res.json();
        
        const normalized = (Array.isArray(data) ? data : []).map((x) => {
          if (x.recipe) return { _id: x._id || x.id, recipe: x.recipe, notes: x.notes || '' };
          
          const rid = x._id || x.id || x.recipeId;
          return { _id: rid, recipe: x, notes: '' };
        });
        if (mounted) setItems(normalized);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [headers]);

  // Filter + search
  const visible = useMemo(() => {
    let out = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (i) =>
          i.recipe?.name?.toLowerCase().includes(q) ||
          i.recipe?.ingredients?.toLowerCase().includes(q) ||
          i.recipe?.culture?.toLowerCase().includes(q) ||
          i.notes?.toLowerCase().includes(q)
      );
    }
    return out;
  }, [items, search]);

  const totals = sumNutrition(visible.filter((v) => selectedIds.includes(v._id)));

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const setNotes = async (item, notes) => {
    const optimistic = items.map((i) => (i._id === item._id ? { ...i, notes } : i));
    setItems(optimistic);
    const ok = await patchCookbookItem(item._id, { notes }, headers);
    if (!ok) console.info('PATCH /cookbook/:id not available; kept notes in local state.');
  };

  const removeItem = async (item) => {
    const id = item._id || item.recipe?._id;
    const ok = await removeCookbookItem(id, headers);
    if (ok) {
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      setSelectedIds((prev) => prev.filter((x) => x !== item._id));
    } else {
      alert('Could not remove item.');
    }
  };

  if (!token) {
    return (
      <section className="cookbook">
        <div className="cookbook-head">
          <h3>My Cookbook</h3>
        </div>
        <div className="cookbook-empty">Please log in to save and manage your cookbook.</div>
      </section>
    );
  }

  return (
    <section className="cookbook">
      <div className="cookbook-head">
        <h3>My Cookbook</h3>

        <div className="toolbar">
          <input
            className="input"
            placeholder="Search saved recipes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            className="btn outline"
            onClick={() => exportSelectedToPrint(items.filter((i) => selectedIds.includes(i._id)))}
            title="Export selected to printable meal plan"
            disabled={!selectedIds.length}
          >
            Export Meal Plan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="cookbook-empty muted">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="cookbook-empty">No recipes saved.</div>
      ) : (
        <>
          {selectedIds.length > 0 && (
            <div className="selection-bar">
              <div>
                <b>{selectedIds.length}</b> selected •
                <span className="muted"> Totals:</span>
                <span className="chip">Kcal {totals.calories}</span>
                <span className="chip">P {totals.protein}g</span>
                <span className="chip">C {totals.carbs}g</span>
                <span className="chip">F {totals.fat}g</span>
              </div>
              <button className="btn small outline" onClick={() => setSelectedIds([])}>
                Clear
              </button>
            </div>
          )}

          <div className="cookbook-grid">
            {visible.map((item) => {
              const r = item.recipe || {};
              return (
                <div key={item._id} className="cb-card">
                  <div className="cb-top">
                    <label className="cb-check">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item._id)}
                        onChange={() => toggleSelect(item._id)}
                      />
                      <span />
                    </label>

                    <div className="cb-title">
                      <Link to={`/recipes/${r._id}`} className="cb-link">
                        {r.name}
                      </Link>
                      <div className="cb-meta">
                        {[r.category, r.spiceLevel, r.dietType].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                  </div>

                  {r.image && (
                    <Link to={`/recipes/${r._id}`} className="cb-img-wrap">
                      <img src={r.image} alt={r.name} />
                    </Link>
                  )}

                  <div className="cb-actions">
                    <button className="btn" onClick={() => downloadRecipePdf(r._id, token)}>
                      PDF
                    </button>
                    <Link className="btn outline" to={`/recipes/${r._id}`}>
                      View
                    </Link>
                    <button className="btn danger" onClick={() => removeItem(item)}>
                      Remove
                    </button>
                  </div>

                  <div className="cb-notes">
                    <textarea
                      placeholder="Add personal notes… (eg. use less salt, add lime)"
                      value={item.notes || ''}
                      onChange={(e) => setNotes(item, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
