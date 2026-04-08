
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './RecipeDetail.css';

const API = process.env.REACT_APP_API_URL || '';


const useAuthHeader = (token) =>
  useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

const Section = ({ title, children, right }) => (
  <section className="rd-section">
    <div className="section-head">
      <h3>{title}</h3>
      <div>{right}</div>
    </div>
    {children}
  </section>
);

//nutri info
const MacroPie = ({ protein = 0, carbs = 0, fat = 0, size = 130, stroke = 16 }) => {
  const total = Math.max(0, +protein) + Math.max(0, +carbs) + Math.max(0, +fat);
  if (!total) return <div className="muted">No macro data</div>;

  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const pct = (v) => v / total;
  const seg = (p) => C * p;

  const pC = pct(carbs), pP = pct(protein), pF = pct(fat);
  const sC = seg(pC), sP = seg(pP), sF = seg(pF);
  const oC = 0, oP = C - sP, oF = C - sP - sF;
  const c = size / 2;

  return (
    <div className="macro-wrapper">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="#eee" strokeWidth={stroke} />
        <circle cx={c} cy={c} r={r} fill="none" stroke="#f59e0b" strokeWidth={stroke}
          strokeDasharray={`${sC} ${C - sC}`} strokeDashoffset={oC}
          transform={`rotate(-90 ${c} ${c})`} />
        <circle cx={c} cy={c} r={r} fill="none" stroke="#3b82f6" strokeWidth={stroke}
          strokeDasharray={`${sP} ${C - sP}`} strokeDashoffset={oP}
          transform={`rotate(-90 ${c} ${c})`} />
        <circle cx={c} cy={c} r={r} fill="none" stroke="#ef4444" strokeWidth={stroke}
          strokeDasharray={`${sF} ${C - sF}`} strokeDashoffset={oF}
          transform={`rotate(-90 ${c} ${c})`} />
      </svg>
      <div>
        <div><b>Carbs:</b> {Math.round(pC * 100)}%</div>
        <div><b>Protein:</b> {Math.round(pP * 100)}%</div>
        <div><b>Fat:</b> {Math.round(pF * 100)}%</div>
      </div>
    </div>
  );
};

//rating
const StarRating = ({ recipeId, token, initialAvg = 0, initialCount = 0 }) => {
  const headers = useAuthHeader(token);
  const [avg, setAvg] = useState(initialAvg || 0);
  const [count, setCount] = useState(initialCount || 0);
  const [my, setMy] = useState(0);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/recipes/${recipeId}/ratings/me`, { headers })
      .then((r) => r.json())
      .then((d) => setMy(d?.value || 0))
      .catch(() => {});
  }, [recipeId, token]); 

  const rate = async (value) => {
    if (!token) return alert('Please login to rate this recipe.');
    const res = await fetch(`${API}/api/recipes/${recipeId}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) return alert('Could not submit rating');
    const data = await res.json();
    setMy(value);
    setAvg(data.averageRating ?? avg);
    setCount(data.ratingsCount ?? count);
  };

  return (
    <div className="stars">
      {[1,2,3,4,5].map((n) => (
        <button
          key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => rate(n)}
          className="star-btn"
          style={{ color: (hover || my) >= n ? '#f59e0b' : '#d1d5db' }}
          aria-label={`Rate ${n}`}
          title={`Rate ${n}`}
          type="button"
        >
          ★
        </button>
      ))}
      <span className="star-meta">{avg?.toFixed?.(1) ?? '0.0'} ({count})</span>
    </div>
  );
};

/* ----------------------- Spice & Portion Simulator (inline) ------------------ */
const FRACTIONS = { "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1/3, "⅔": 2/3, "⅕": 0.2, "⅖": 0.4, "⅗": 0.6, "⅘": 0.8, "⅙": 1/6, "⅚": 5/6, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875 };
const SPICY_RE = /\b(chil+?i|chili|chilli|green chilli|red chilli|chilli powder|cayenne|paprika|pepper|black pepper|peppercorns?)\b/i;
const SPICE_FACTORS = { Mild: 0.6, Medium: 1.0, Spicy: 1.4 };
const PORTION_PRESETS = [
  { key: "single", label: "Single", factor: 1 },
  { key: "couple", label: "Couple", factor: 2 },
  { key: "family", label: "Family (4)", factor: 4 },
  { key: "event",  label: "Event (10)", factor: 10 },
];
const parseAmountToken = (token) => {
  token = token.trim();
  if (FRACTIONS[token] != null) return FRACTIONS[token];
  const mixed = token.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = token.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const num = token.replace(',', '.');
  if (!isNaN(Number(num))) return Number(num);
  return null;
};
const formatAmount = (n) => {
  const r = Math.round(n * 10) / 10;
  return Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : String(r);
};
const scaleLine = (line, factor) => {
  const s = line;
  const range = s.match(/^(\s*)(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])\s*[-–]\s*(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])(.*)$/);
  if (range) {
    const [, lead, aTok, bTok, tail] = range;
    const a = parseAmountToken(aTok); const b = parseAmountToken(bTok);
    if (a != null && b != null) return `${lead}${formatAmount(a*factor)}-${formatAmount(b*factor)}${tail}`;
  }
  const single = s.match(/^(\s*)(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])(.*)$/);
  if (single) {
    const [, lead, tok, tail] = single;
    const val = parseAmountToken(tok);
    if (val != null) return `${lead}${formatAmount(val*factor)}${tail}`;
  }
  return s;
};
const splitLines = (ingredients) =>
  (ingredients || '')
    .split(/\r?\n|,(?=(?:[^()]|\([^)]*\))*$)/g)
    .map((l) => l.trim())
    .filter(Boolean);

const SpicePortionSimulator = ({ ingredients, baseSpice = "Medium" }) => {
  const [spice, setSpice] = useState("Medium");
  const [portionKey, setPortionKey] = useState("single");
  const portionFactor = useMemo(
    () => (PORTION_PRESETS.find((p) => p.key === portionKey)?.factor || 1),
    [portionKey]
  );
  const lines = useMemo(() => splitLines(ingredients), [ingredients]);

  const adjusted = useMemo(() => {
    const sFactor = SPICE_FACTORS[spice] ?? 1;
    return lines.map((line) => {
      const isSpicy = SPICY_RE.test(line);
      const factor = portionFactor * (isSpicy ? sFactor : 1);
      return scaleLine(line, factor);
    });
  }, [lines, spice, portionFactor]);

  const showWarning = useMemo(() => {
    if (!lines.some((l) => SPICY_RE.test(l))) return false;
    return spice === 'Spicy' || (spice === 'Medium' && baseSpice !== 'Mild');
  }, [lines, spice, baseSpice]);

  return (
    <div className="simulator">
      <h3>Spice & Portions</h3>
      <div className="sim-row">
        <div className="sim-col">
          <div className="label">Spice level</div>
          <div className="segmented">
            {['Mild','Medium','Spicy'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`seg-btn ${spice === lvl ? 'active' : ''}`}
                onClick={() => setSpice(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
          {showWarning && (
            <div className="health-warning">
              ⚠️ Spicy foods may aggravate gastritis / acid reflux. Consider choosing <b>Mild</b>.
            </div>
          )}
        </div>
        <div className="sim-col">
          <div className="label">Portion size</div>
          <div className="segmented">
            {PORTION_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`seg-btn ${portionKey === p.key ? 'active' : ''}`}
                onClick={() => setPortionKey(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="adjusted-box">
        <div className="box-head">Adjusted Ingredients</div>
        {adjusted.length ? (
          <ul className="ing-list">
            {adjusted.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        ) : <div className="muted">No ingredients found.</div>}
        <div className="muted small">
          Scaling is heuristic; always taste and adjust. Nutrition shown is for the original recipe.
        </div>
      </div>
    </div>
  );
};

/* --------------------------------- comments --------------------------------- */
const Comments = ({ recipeId, token }) => {
  const headers = useAuthHeader(token);
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');

  const load = async () => {
    const r = await fetch(`${API}/api/recipes/${recipeId}/comments?limit=50`);
    setItems(await r.json());
  };
  useEffect(() => { load(); }, [recipeId]);

  const post = async (e) => {
    e.preventDefault();
    if (!token) return alert('Login to comment');
    const r = await fetch(`${API}/api/recipes/${recipeId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) return alert('Could not post comment');
    const c = await r.json();
    setItems([c, ...items]);
    setText('');
  };

  const del = async (id) => {
    if (!token) return;
    const r = await fetch(`${API}/api/recipes/${recipeId}/comments/${id}`, {
      method: 'DELETE',
      headers
    });
    if (r.ok) setItems(items.filter((i) => i._id !== id));
  };

  return (
    <div className="comments">
      <form onSubmit={post} className="comment-form">
        <input
          className="comment-input"
          placeholder="Write a comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="comment-submit">Post</button>
      </form>

      {items.length === 0 && <div className="muted">No comments yet.</div>}

      <ul className="comment-list">
        {items.map((c) => (
          <li key={c._id} className="comment-item">
            <div className="comment-meta">
              {c.user?.name || 'User'} • {new Date(c.createdAt).toLocaleString()}
            </div>
            <div>{c.text}</div>
            <button onClick={() => del(c._id)} className="comment-delete">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ---------------------------------- feedback -------------------------------- */
const FeedbackModal = ({ recipeId, token, onClose }) => {
  const headers = useAuthHeader(token);
  const [type, setType] = useState('content');
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!token) return alert('Login to send feedback');
    const r = await fetch(`${API}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ recipeId, type, message }),
    });
    if (!r.ok) {
      let msg = 'Could not send feedback';
      try { const j = await r.json(); if (j?.message) msg = j.message; } catch {}
      return alert(msg);
    }
    onClose();
    alert('Thanks! Your feedback was sent to the admins.');
  };

  return (
    <div className="modal-mask">
      <form onSubmit={submit} className="modal">
        <h3>Send Feedback</h3>
        <select value={type} onChange={(e)=>setType(e.target.value)} className="modal-field">
          <option value="content">Content issue</option>
          <option value="abuse">Abuse / report</option>
          <option value="bug">Bug</option>
          <option value="other">Other</option>
        </select>
        <textarea
          className="modal-field"
          placeholder="Describe the issue…"
          value={message}
          onChange={(e)=>setMessage(e.target.value)}
          rows={6}
        />
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button className="btn-primary">Send</button>
        </div>
      </form>
    </div>
  );
};

/* ---------------------------------- share bar -------------------------------- */
const ShareBar = ({ url, title }) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    alert('Link copied!');
  };
  const webShare = () => {
    if (navigator.share) navigator.share({ title, url }).catch(() => copy());
    else copy();
  };

  return (
    <div className="sharebar">
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer">Facebook</a>
      <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`} target="_blank" rel="noreferrer">Twitter</a>
      <a href={`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`} target="_blank" rel="noreferrer">WhatsApp</a>
      <a href={`mailto:?subject=${encodedText}&body=${encodedUrl}`}>Email</a>
      <button onClick={webShare} type="button">Share</button>
      <button onClick={copy} type="button">Copy</button>
    </div>
  );
};

/* --------------------------------- main page -------------------------------- */
export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = useAuthHeader(token);

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`${API}/api/recipes/${id}`);
        if (!r.ok) throw new Error('Not found');
        const data = await r.json();
        if (mounted) setRecipe(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const saveToCookbook = async () => {
    if (!token) return alert('Please log in to save recipes to your cookbook.');
    try {
      const r = await fetch(`${API}/api/visitor/cookbook/${id}`, { method: 'POST', headers });
      if (!r.ok) throw new Error('save failed');
      alert('Saved to your cookbook!');
    } catch (e) {
      alert('Could not save to cookbook.');
    }
  };

  // Auth-gated nutrition report
  const downloadNutritionPdf = async () => {
    if (!token) return alert('Please log in to download the nutrition report.');
    try {
      const res = await fetch(`${API}/api/recipes/${id}/nutrition-report`, {
        headers
      });
      if (!res.ok) {
        let msg = 'Could not download report';
        try { const j = await res.json(); if (j?.message) msg = j.message; } catch {}
        return alert(msg);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nutrition-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Could not download report');
    }
  };

  // Auth-gated full recipe PDF
  const downloadRecipePdf = async () => {
    if (!token) return alert('Please login to download this recipe as a PDF.');
    try {
      const res = await fetch(`${API}/api/recipes/${id}/recipe-pdf`, { headers });
      if (!res.ok) {
        let msg = 'Could not download recipe PDF';
        try { const j = await res.json(); if (j.message) msg = j.message; } catch {}
        return alert(msg);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recipe?.name || 'recipe'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Could not download recipe PDF');
    }
  };

  if (loading) return <div className="page-wrap"><div className="muted">Loading…</div></div>;
  if (!recipe) return <div className="page-wrap"><div className="muted">Recipe not found.</div></div>;

  const n = recipe.nutrition || {};
  const chartData = {
    protein: Number(n.protein) || 0,
    carbs: Number(n.carbs) || 0,
    fat: Number(n.fat) || 0,
  };
  const flag = n.ratingFlag || 'neutral';
  const flagColor =
    flag === 'weight-loss' ? 'green' :
    flag === 'weight-gain' ? 'red' : 'goldenrod';

  const pageUrl = `${window.location.origin}/recipes/${recipe._id}`;

  return (
    <div className="page-wrap">
      <Link to="/recipes" className="back-link">← Back to recipes</Link>

      <article className="recipe-detail">
        <header className="detail-header">
          <div>
            <h1>{recipe.name}</h1>
            <div className="meta-row">
              <span><b>Category:</b> {recipe.category || 'N/A'}</span>
              <span><b>Spice:</b> {recipe.spiceLevel || 'N/A'}</span>
              <span><b>Diet:</b> {recipe.dietType || 'N/A'}</span>
              {recipe.culture && <span><b>Culture:</b> {recipe.culture}</span>}
            </div>
            <div className="meta-row">
              <StarRating
                recipeId={recipe._id}
                token={token}
                initialAvg={recipe.averageRating || 0}
                initialCount={recipe.ratingsCount || 0}
              />
              <span
                className="flag"
                style={{
                  background: flagColor,
                  color: '#fff',
                  padding: '.15rem .5rem',
                  borderRadius: '6px',
                  textTransform: 'capitalize'
                }}
              >
                {flag}
              </span>
            </div>
          </div>
          {recipe.image && <img className="detail-hero" src={recipe.image} alt={recipe.name} />}
        </header>

        <Section
          title="Nutrition Report"
          right={
            token
              ? <button onClick={downloadNutritionPdf} className="btn-primary">Download PDF</button>
              : <span className="muted small">Log in to download</span>
          }
        >
          <div className="nutrition-grid">
            <MacroPie protein={chartData.protein} carbs={chartData.carbs} fat={chartData.fat} />
            <div className="kv">
              <div><b>Calories:</b> {n.calories || 0}</div>
              <div><b>Protein:</b> {n.protein || 0} g</div>
              <div><b>Carbs:</b> {n.carbs || 0} g</div>
              <div><b>Fat:</b> {n.fat || 0} g</div>
              {Array.isArray(recipe.tags) && recipe.tags.length > 0 && (
                <div><b>Tags:</b> {recipe.tags.join(', ')}</div>
              )}
              <small className="muted">Pie shows Carbs / Protein / Fat.</small>
            </div>
          </div>

          {Array.isArray(n.vitamins) && n.vitamins.length > 0 && (
            <div className="vit-list">
              <h4>Vitamins & Minerals</h4>
              <ul>
                {n.vitamins.map((v, i) => (
                  <li key={i}>• {v.name}: {v.amount}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(n.benefits) && n.benefits.length > 0 && (
            <div className="benefit-list">
              <h4>Ingredient Benefits</h4>
              <ul>
                {n.benefits.map((b, i) => <li key={i}>• {b}</li>)}
              </ul>
            </div>
          )}
        </Section>

        {/* Spice & Portion Simulator */}
        <Section title="Spice & Portion Adjuster">
          <SpicePortionSimulator
            ingredients={recipe.ingredients}
            baseSpice={recipe.spiceLevel}
          />
        </Section>

        <Section title="Ingredients">
          <p>{recipe.ingredients || '—'}</p>
        </Section>

        <Section title="Instructions">
          <p style={{ whiteSpace: 'pre-wrap' }}>{recipe.instructions || '—'}</p>
        </Section>

        <Section title="Story & Culture">
          <p>{recipe.story || recipe.cultureStory || recipe.culture || '—'}</p>
        </Section>

        <Section
          title="Interact"
          right={<ShareBar url={pageUrl} title={recipe.name} />}
        >
          <div className="action-row">
            <button onClick={saveToCookbook} className="btn-primary">Save to Cookbook</button>
            <button className="btn-outline" onClick={() => navigate(`/recipes/${id}/cook`)}>Start Cook Mode</button>
            {token && (
              <button onClick={downloadRecipePdf} className="btn-outline">Download Recipe (PDF)</button>
            )}
            <button onClick={() => setShowFeedback(true)} className="btn-outline">Send Feedback</button>
          </div>
        </Section>

        <Section title="Comments">
          <Comments recipeId={recipe._id} token={token} />
        </Section>
      </article>

      {showFeedback && (
        <FeedbackModal
          recipeId={recipe._id}
          token={token}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
