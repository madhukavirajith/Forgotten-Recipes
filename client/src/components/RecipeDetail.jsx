// client/src/components/RecipeDetail.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './RecipeDetail.css';

// Import icons
import { 
  FaArrowLeft, 
  FaStar, 
  FaDownload, 
  FaBookmark, 
  FaShare, 
  FaFacebook, 
  FaTwitter, 
  FaWhatsapp, 
  FaEnvelope, 
  FaCopy,
  FaPrint,
  FaUtensils,
  FaClock,
  FaFire,
  FaLeaf,
  FaHeart,
  FaComment,
  FaFlag,
  FaCheckCircle,
  FaInfoCircle,
  FaChartPie,
  FaTag,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaRegThumbsUp
} from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL || '';

// ==================== Helper Components ====================

const Section = ({ title, icon, children, right, className = "" }) => (
  <section className={`rd-section ${className}`}>
    <div className="section-head">
      <h3>
        {icon && <span className="section-icon">{icon}</span>}
        {title}
      </h3>
      {right && <div className="section-right">{right}</div>}
    </div>
    {children}
  </section>
);

// ==================== Macro Pie Chart ====================
const MacroPie = ({ protein = 0, carbs = 0, fat = 0, size = 140, stroke = 18 }) => {
  const total = Math.max(0, +protein) + Math.max(0, +carbs) + Math.max(0, +fat);
  if (!total) return <div className="muted">No macro data available</div>;

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
      <div className="macro-chart">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
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
      </div>
      <div className="macro-legend">
        <div className="macro-legend-item">
          <span className="macro-color carbs"></span>
          <span>Carbs: {Math.round(pC * 100)}%</span>
        </div>
        <div className="macro-legend-item">
          <span className="macro-color protein"></span>
          <span>Protein: {Math.round(pP * 100)}%</span>
        </div>
        <div className="macro-legend-item">
          <span className="macro-color fat"></span>
          <span>Fat: {Math.round(pF * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

// ==================== Star Rating ====================
const StarRating = ({ recipeId, token, initialAvg = 0, initialCount = 0 }) => {
  const headers = useMemo(() => 
    token ? { Authorization: `Bearer ${token}` } : undefined, [token]);
  const [avg, setAvg] = useState(initialAvg || 0);
  const [count, setCount] = useState(initialCount || 0);
  const [my, setMy] = useState(0);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/recipes/${recipeId}/ratings/me`, { headers })
      .then(r => r.json())
      .then(d => setMy(d?.value || 0))
      .catch(() => {});
  }, [recipeId, token, headers]);

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
    <div className="star-rating">
      <div className="stars">
        {[1,2,3,4,5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => rate(n)}
            className={`star-btn ${(hover || my) >= n ? 'active' : ''}`}
            aria-label={`Rate ${n} stars`}
          >
            ★
          </button>
        ))}
      </div>
      <span className="star-meta">
        <FaStar className="star-icon" /> {avg.toFixed?.(1) ?? '0.0'} ({count} reviews)
      </span>
    </div>
  );
};

// ==================== Spice & Portion Simulator ====================
const FRACTIONS = { 
  "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1/3, "⅔": 2/3, 
  "⅕": 0.2, "⅖": 0.4, "⅗": 0.6, "⅘": 0.8, "⅙": 1/6, 
  "⅚": 5/6, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875 
};
const SPICY_RE = /\b(chil+?i|chili|chilli|green chilli|red chilli|chilli powder|cayenne|paprika|pepper|black pepper|peppercorns?)\b/i;
const SPICE_FACTORS = { Mild: 0.6, Medium: 1.0, Spicy: 1.4 };
const PORTION_PRESETS = [
  { key: "single", label: "Single", factor: 1, icon: "👤" },
  { key: "couple", label: "Couple", factor: 2, icon: "👥" },
  { key: "family", label: "Family (4)", factor: 4, icon: "👨‍👩‍👧‍👦" },
  { key: "event", label: "Event (10)", factor: 10, icon: "🎉" },
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
  const range = line.match(/^(\s*)(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])\s*[-–]\s*(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])(.*)$/);
  if (range) {
    const [, lead, aTok, bTok, tail] = range;
    const a = parseAmountToken(aTok); const b = parseAmountToken(bTok);
    if (a != null && b != null) return `${lead}${formatAmount(a*factor)}-${formatAmount(b*factor)}${tail}`;
  }
  const single = line.match(/^(\s*)(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])(.*)$/);
  if (single) {
    const [, lead, tok, tail] = single;
    const val = parseAmountToken(tok);
    if (val != null) return `${lead}${formatAmount(val*factor)}${tail}`;
  }
  return line;
};

const splitLines = (ingredients) =>
  (ingredients || '')
    .split(/\r?\n|,(?=(?:[^()]|\([^)]*\))*$)/g)
    .map(l => l.trim())
    .filter(Boolean);

const SpicePortionSimulator = ({ ingredients, baseSpice = "Medium" }) => {
  const [spice, setSpice] = useState("Medium");
  const [portionKey, setPortionKey] = useState("single");
  const [isExpanded, setIsExpanded] = useState(false);
  
  const portionFactor = useMemo(
    () => PORTION_PRESETS.find(p => p.key === portionKey)?.factor || 1,
    [portionKey]
  );
  const lines = useMemo(() => splitLines(ingredients), [ingredients]);

  const adjusted = useMemo(() => {
    const sFactor = SPICE_FACTORS[spice] ?? 1;
    return lines.map(line => {
      const isSpicy = SPICY_RE.test(line);
      const factor = portionFactor * (isSpicy ? sFactor : 1);
      return scaleLine(line, factor);
    });
  }, [lines, spice, portionFactor]);

  const showWarning = useMemo(() => {
    if (!lines.some(l => SPICY_RE.test(l))) return false;
    return spice === 'Spicy' || (spice === 'Medium' && baseSpice !== 'Mild');
  }, [lines, spice, baseSpice]);

  return (
    <div className="simulator">
      <div className="simulator-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="simulator-title">
          <FaChartPie /> Adjust Spice & Portions
        </div>
        <button className="simulator-toggle">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      {isExpanded && (
        <>
          <div className="sim-row">
            <div className="sim-col">
              <div className="label">🌶️ Spice Level</div>
              <div className="segmented">
                {['Mild','Medium','Spicy'].map(lvl => (
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
            </div>
            <div className="sim-col">
              <div className="label">👥 Portion Size</div>
              <div className="segmented">
                {PORTION_PRESETS.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    className={`seg-btn ${portionKey === p.key ? 'active' : ''}`}
                    onClick={() => setPortionKey(p.key)}
                  >
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {showWarning && (
            <div className="health-warning">
              <FaExclamationTriangle /> Spicy foods may aggravate gastritis/acid reflux. Consider choosing <strong>Mild</strong>.
            </div>
          )}

          <div className="adjusted-box">
            <div className="box-head">📝 Adjusted Ingredients</div>
            {adjusted.length ? (
              <ul className="ing-list">
                {adjusted.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            ) : <div className="muted">No ingredients found.</div>}
            <div className="muted small">
              * Scaling is heuristic; always taste and adjust.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ==================== Comments Section ====================
const Comments = ({ recipeId, token }) => {
  const headers = useMemo(() => 
    token ? { Authorization: `Bearer ${token}` } : undefined, [token]);
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await fetch(`${API}/api/recipes/${recipeId}/comments?limit=50`);
      setItems(await r.json());
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { load(); }, [recipeId]);

  const post = async (e) => {
    e.preventDefault();
    if (!token) return alert('Please login to comment');
    if (!text.trim()) return;
    
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
    if (r.ok) setItems(items.filter(i => i._id !== id));
  };

  if (loading) return <div className="muted">Loading comments...</div>;

  return (
    <div className="comments">
      <form onSubmit={post} className="comment-form">
        <input
          className="comment-input"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="comment-submit" disabled={!text.trim()}>
          Post
        </button>
      </form>

      {items.length === 0 && <div className="muted">No comments yet. Be the first to comment!</div>}

      <ul className="comment-list">
        {items.map(c => (
          <li key={c._id} className="comment-item">
            <div className="comment-avatar">
              {c.user?.name?.charAt(0) || 'U'}
            </div>
            <div className="comment-content">
              <div className="comment-meta">
                <span className="comment-author">{c.user?.name || 'User'}</span>
                <span className="comment-date">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="comment-text">{c.text}</div>
            </div>
            {token && c.user?._id === JSON.parse(localStorage.getItem('user') || '{}')?._id && (
              <button onClick={() => del(c._id)} className="comment-delete">🗑️</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ==================== Feedback Modal ====================
const FeedbackModal = ({ recipeId, token, onClose }) => {
  const headers = useMemo(() => 
    token ? { Authorization: `Bearer ${token}` } : undefined, [token]);
  const [type, setType] = useState('content');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!token) return alert('Please login to send feedback');
    if (!message.trim()) return alert('Please enter your feedback');
    
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ recipeId, type, message }),
      });
      if (!r.ok) throw new Error('Failed to send');
      onClose();
      alert('Thank you! Your feedback has been sent.');
    } catch (err) {
      alert('Could not send feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-mask" onClick={onClose}>
      <form onSubmit={submit} className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Send Feedback</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="modal-field">
          <option value="content">Content Issue</option>
          <option value="abuse">Report Abuse</option>
          <option value="bug">Bug Report</option>
          <option value="suggestion">Suggestion</option>
          <option value="other">Other</option>
        </select>
        <textarea
          className="modal-field"
          placeholder="Please describe your feedback..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
        />
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? <FaSpinner className="spinning" /> : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ==================== Share Bar ====================
const ShareBar = ({ url, title }) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const webShare = () => {
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => copy());
    } else {
      copy();
    }
  };

  return (
    <div className="sharebar">
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" title="Share on Facebook">
        <FaFacebook />
      </a>
      <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`} target="_blank" rel="noreferrer" title="Share on Twitter">
        <FaTwitter />
      </a>
      <a href={`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`} target="_blank" rel="noreferrer" title="Share on WhatsApp">
        <FaWhatsapp />
      </a>
      <a href={`mailto:?subject=${encodedText}&body=${encodedUrl}`} title="Share via Email">
        <FaEnvelope />
      </a>
      <button onClick={webShare} title="Share">
        <FaShare />
      </button>
      <button onClick={copy} title="Copy link">
        {copied ? <FaCheckCircle /> : <FaCopy />}
      </button>
    </div>
  );
};

// ==================== Main Component ====================
export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = useMemo(() => 
    token ? { Authorization: `Bearer ${token}` } : undefined, [token]);

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`${API}/api/recipes/${id}`);
        if (!r.ok) throw new Error('Recipe not found');
        const data = await r.json();
        if (mounted) setRecipe(data);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const saveToCookbook = async () => {
    if (!token) return alert('Please login to save recipes.');
    try {
      const r = await fetch(`${API}/api/visitor/cookbook/${id}`, { method: 'POST', headers });
      if (!r.ok) throw new Error('save failed');
      setSaved(true);
      alert('Saved to your cookbook!');
    } catch (e) {
      alert('Could not save to cookbook.');
    }
  };

  const downloadNutritionPdf = async () => {
    if (!token) return alert('Please login to download nutrition report.');
    try {
      const res = await fetch(`${API}/api/recipes/${id}/nutrition-report`, { headers });
      if (!res.ok) throw new Error('Download failed');
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
      alert('Could not download report');
    }
  };

  const downloadRecipePdf = async () => {
    if (!token) return alert('Please login to download recipe.');
    try {
      const res = await fetch(`${API}/api/recipes/${id}/recipe-pdf`, { headers });
      if (!res.ok) throw new Error('Download failed');
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
      alert('Could not download recipe');
    }
  };

  const printRecipe = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="page-wrap">
        <div className="error-container">
          <div className="error-icon">🍛</div>
          <h2>Recipe Not Found</h2>
          <p>{error || 'The recipe you\'re looking for doesn\'t exist.'}</p>
          <Link to="/recipes" className="btn-primary">Browse Recipes</Link>
        </div>
      </div>
    );
  }

  const n = recipe.nutrition || {};
  const chartData = {
    protein: Number(n.protein) || 0,
    carbs: Number(n.carbs) || 0,
    fat: Number(n.fat) || 0,
  };
  const flag = n.ratingFlag || 'neutral';
  const flagText = {
    'weight-loss': '🌱 Weight Loss Friendly',
    'weight-gain': '💪 Weight Gain',
    'neutral': '⚖️ Balanced'
  }[flag] || '⚖️ Balanced';

  const pageUrl = `${window.location.origin}/recipes/${recipe._id}`;

  return (
    <div className="page-wrap">
      <div className="recipe-detail-container">
        {/* Back Button */}
        <button onClick={() => navigate('/recipes')} className="back-button">
          <FaArrowLeft /> Back to Recipes
        </button>

        {/* Recipe Header */}
        <div className="recipe-header">
          {recipe.image && (
            <div className="recipe-image">
              <img src={recipe.image} alt={recipe.name} />
            </div>
          )}
          <div className="recipe-info">
            <h1>{recipe.name}</h1>
            <div className="recipe-meta-tags">
              {recipe.category && <span className="meta-tag category">{recipe.category}</span>}
              {recipe.spiceLevel && <span className="meta-tag spice">{recipe.spiceLevel} 🌶️</span>}
              {recipe.dietType && <span className="meta-tag diet">{recipe.dietType}</span>}
              {recipe.culture && <span className="meta-tag culture">{recipe.culture}</span>}
            </div>
            <div className="recipe-ratings">
              <StarRating
                recipeId={recipe._id}
                token={token}
                initialAvg={recipe.averageRating || 0}
                initialCount={recipe.ratingsCount || 0}
              />
              <span className="nutrition-flag" data-flag={flag}>
                {flagText}
              </span>
            </div>
          </div>
        </div>

        {/* Nutrition Section */}
        <Section title="Nutrition Information" icon={<FaChartPie />}>
          <div className="nutrition-grid">
            <MacroPie 
              protein={chartData.protein} 
              carbs={chartData.carbs} 
              fat={chartData.fat} 
            />
            <div className="nutrition-details">
              <div className="nutrition-item">
                <span className="nutrition-label">Calories</span>
                <span className="nutrition-value">{n.calories || 0} kcal</span>
              </div>
              <div className="nutrition-item">
                <span className="nutrition-label">Protein</span>
                <span className="nutrition-value">{n.protein || 0} g</span>
              </div>
              <div className="nutrition-item">
                <span className="nutrition-label">Carbs</span>
                <span className="nutrition-value">{n.carbs || 0} g</span>
              </div>
              <div className="nutrition-item">
                <span className="nutrition-label">Fat</span>
                <span className="nutrition-value">{n.fat || 0} g</span>
              </div>
            </div>
          </div>

          {recipe.tags && recipe.tags.length > 0 && (
            <div className="recipe-tags">
              <strong>Tags:</strong>
              {recipe.tags.map(tag => (
                <span key={tag} className="recipe-tag">#{tag}</span>
              ))}
            </div>
          )}

          <div className="nutrition-actions">
            <button onClick={downloadNutritionPdf} className="btn-outline">
              <FaDownload /> Download Nutrition Report
            </button>
          </div>
        </Section>

        {/* Spice & Portion Simulator */}
        <SpicePortionSimulator 
          ingredients={recipe.ingredients} 
          baseSpice={recipe.spiceLevel} 
        />

        {/* Ingredients Section */}
        <Section title="Ingredients" icon={<FaUtensils />}>
          <div className="ingredients-content">
            <p>{recipe.ingredients || '—'}</p>
          </div>
        </Section>

        {/* Instructions Section */}
        <Section title="Instructions" icon={<FaClock />}>
          <div className="instructions-content">
            <p style={{ whiteSpace: 'pre-wrap' }}>{recipe.instructions || '—'}</p>
          </div>
        </Section>

        {/* Story Section */}
        <Section title="Story & Culture" icon={<FaInfoCircle />}>
          <div className="story-content">
            <p>{recipe.story || recipe.cultureStory || recipe.culture || 'No story available for this recipe.'}</p>
          </div>
        </Section>

        {/* Action Buttons */}
        <Section 
          title="Actions" 
          icon={<FaHeart />}
          right={<ShareBar url={pageUrl} title={recipe.name} />}
        >
          <div className="action-buttons">
            <button onClick={saveToCookbook} className={`btn-primary ${saved ? 'saved' : ''}`}>
              <FaBookmark /> {saved ? 'Saved!' : 'Save to Cookbook'}
            </button>
            <button onClick={() => navigate(`/recipes/${id}/cook`)} className="btn-secondary">
              <FaUtensils /> Start Cook Mode
            </button>
            {token && (
              <button onClick={downloadRecipePdf} className="btn-outline">
                <FaDownload /> Download PDF
              </button>
            )}
            <button onClick={printRecipe} className="btn-outline">
              <FaPrint /> Print
            </button>
            <button onClick={() => setShowFeedback(true)} className="btn-outline">
              <FaFlag /> Send Feedback
            </button>
          </div>
        </Section>

        {/* Comments Section */}
        <Section title="Comments" icon={<FaComment />}>
          <Comments recipeId={recipe._id} token={token} />
        </Section>
      </div>

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