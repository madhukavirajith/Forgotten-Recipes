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
  FaChartBar,
  FaChartLine,
  FaTag,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaUserCircle,
  FaReply,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaSmile,
  FaSadTear,
  FaLaugh,
  FaAngry,
  FaThumbsUp,
  FaThumbsDown
} from 'react-icons/fa';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const API = process.env.REACT_APP_API_URL || '';

// ==================== Section Component ====================
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

// ==================== Advanced Nutrition Chart ====================
const AdvancedNutritionChart = ({ nutrition }) => {
  const [activeTab, setActiveTab] = useState('macro');
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(400);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const macroData = [
    { name: 'Protein', value: Number(nutrition.protein) || 0, color: '#3b82f6' },
    { name: 'Carbs', value: Number(nutrition.carbs) || 0, color: '#f59e0b' },
    { name: 'Fat', value: Number(nutrition.fat) || 0, color: '#ef4444' }
  ];

  const microData = (nutrition.vitamins || []).map(v => ({
    name: v.name,
    value: parseFloat(v.amount) || 0,
    unit: v.amount?.match(/[a-zA-Z]+/)?.[0] || 'mg'
  }));

  const radarData = [
    { subject: 'Protein', value: Math.min(100, (Number(nutrition.protein) / 50) * 100), fullMark: 100 },
    { subject: 'Carbs', value: Math.min(100, (Number(nutrition.carbs) / 200) * 100), fullMark: 100 },
    { subject: 'Fat', value: Math.min(100, (Number(nutrition.fat) / 70) * 100), fullMark: 100 },
    { subject: 'Fiber', value: Math.min(100, (Number(nutrition.fiber) || 0) / 30 * 100), fullMark: 100 },
    { subject: 'Vitamins', value: Math.min(100, (nutrition.vitamins?.length || 0) * 20), fullMark: 100 }
  ];

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

  const totalCalories = nutrition.calories || 0;
  const proteinCalories = (Number(nutrition.protein) || 0) * 4;
  const carbsCalories = (Number(nutrition.carbs) || 0) * 4;
  const fatCalories = (Number(nutrition.fat) || 0) * 9;
  
  const calorieBreakdown = [
    { name: 'Protein', value: proteinCalories, percentage: totalCalories ? (proteinCalories / totalCalories) * 100 : 0, color: '#3b82f6' },
    { name: 'Carbs', value: carbsCalories, percentage: totalCalories ? (carbsCalories / totalCalories) * 100 : 0, color: '#f59e0b' },
    { name: 'Fat', value: fatCalories, percentage: totalCalories ? (fatCalories / totalCalories) * 100 : 0, color: '#ef4444' }
  ];

  // Simple Pie Chart without ResponsiveContainer to avoid errors
  const renderSimplePieChart = () => {
    const size = Math.min(containerWidth * 0.4, 200);
    const radius = size / 2;
    const innerRadius = radius * 0.6;
    const outerRadius = radius * 0.9;
    
    let startAngle = -90;
    let endAngle = 270;
    
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {macroData.map((item, index) => {
          const percentage = totalCalories ? (item.value / totalCalories) * 100 : 0;
          const angle = (percentage / 100) * 360;
          const start = startAngle;
          const end = start + angle;
          
          const startRad = (start * Math.PI) / 180;
          const endRad = (end * Math.PI) / 180;
          
          const x1 = radius + radius * Math.cos(startRad);
          const y1 = radius + radius * Math.sin(startRad);
          const x2 = radius + radius * Math.cos(endRad);
          const y2 = radius + radius * Math.sin(endRad);
          
          const largeArc = angle > 180 ? 1 : 0;
          
          const pathData = `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          
          const result = (
            <path
              key={item.name}
              d={pathData}
              fill={item.color}
              stroke="white"
              strokeWidth="2"
            />
          );
          
          startAngle = end;
          return result;
        })}
        <circle cx={radius} cy={radius} r={innerRadius} fill="white" />
      </svg>
    );
  };

  return (
    <div className="advanced-nutrition" ref={containerRef}>
      <div className="nutrition-tabs">
        <button className={`nutri-tab ${activeTab === 'macro' ? 'active' : ''}`} onClick={() => setActiveTab('macro')}>
          <FaChartPie /> Macronutrients
        </button>
        <button className={`nutri-tab ${activeTab === 'micro' ? 'active' : ''}`} onClick={() => setActiveTab('micro')}>
          <FaChartBar /> Micronutrients
        </button>
        <button className={`nutri-tab ${activeTab === 'radar' ? 'active' : ''}`} onClick={() => setActiveTab('radar')}>
          <FaChartLine /> Nutrition Score
        </button>
      </div>

      <div className="nutrition-content">
        {activeTab === 'macro' && (
          <div className="macro-section">
            <div className="macro-pie-container">
              {renderSimplePieChart()}
            </div>
            <div className="macro-stats">
              <div className="macro-stat-item">
                <div className="macro-stat-value">{totalCalories}</div>
                <div className="macro-stat-label">Total Calories</div>
              </div>
              {calorieBreakdown.map(item => (
                <div key={item.name} className="macro-stat-item">
                  <div className="macro-stat-value" style={{ color: item.color }}>{item.value} kcal</div>
                  <div className="macro-stat-label">{item.name} ({item.percentage.toFixed(0)}%)</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'micro' && (
          <div className="micro-section">
            {microData.length > 0 ? (
              <div className="micro-bars">
                {microData.map((item, idx) => (
                  <div key={idx} className="micro-bar-item">
                    <div className="micro-bar-label">{item.name}</div>
                    <div className="micro-bar-bg">
                      <div 
                        className="micro-bar-fill" 
                        style={{ width: `${Math.min(100, (item.value / 100) * 100)}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                    </div>
                    <div className="micro-bar-value">{item.value} {item.unit}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-micro-data">No micronutrient data available for this recipe.</div>
            )}
          </div>
        )}

        {activeTab === 'radar' && (
          <div className="radar-section">
            <div className="radar-chart-container">
              {radarData.map((item, idx) => (
                <div key={idx} className="radar-item">
                  <div className="radar-label">{item.subject}</div>
                  <div className="radar-bar-bg">
                    <div className="radar-bar-fill" style={{ width: `${item.value}%`, backgroundColor: '#D2691E' }} />
                  </div>
                  <div className="radar-value">{Math.round(item.value)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== Star Rating (Integrated) ====================
const StarRating = ({ recipeId, token, initialAvg = 0, initialCount = 0 }) => {
  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : undefined, [token]);
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

// ==================== Spice & Portion Simulator (Integrated) ====================
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

// ==================== Enhanced Comments Section ====================
const Comments = ({ recipeId, token }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showReactions, setShowReactions] = useState(null);

  const currentUser = token ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const textareaRef = useRef(null);

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/recipes/${recipeId}/comments?limit=100`);
      const data = await res.json();
      
      const commentMap = new Map();
      const rootComments = [];
      
      data.forEach(comment => {
        commentMap.set(comment._id, { ...comment, replies: [], userReaction: null });
      });
      
      data.forEach(comment => {
        if (comment.parentId && commentMap.has(comment.parentId)) {
          commentMap.get(comment.parentId).replies.push(commentMap.get(comment._id));
        } else {
          rootComments.push(commentMap.get(comment._id));
        }
      });
      
      const sortComments = (list) => {
        if (sortBy === 'newest') {
          list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'oldest') {
          list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortBy === 'popular') {
          list.sort((a, b) => (b.reactions?.length || 0) - (a.reactions?.length || 0));
        }
        list.forEach(comment => {
          if (comment.replies?.length) sortComments(comment.replies);
        });
        return list;
      };
      
      setComments(sortComments(rootComments));
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  }, [recipeId, sortBy]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!token) return alert('Please login to comment');
    if (!text.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/recipes/${recipeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: text.trim(), parentId: replyTo?._id || null })
      });
      
      if (!res.ok) throw new Error('Failed to post comment');
      await loadComments();
      setText('');
      setReplyTo(null);
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await fetch(`${API}/api/recipes/${recipeId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const editComment = async (commentId) => {
    if (!editText.trim()) return;
    try {
      await fetch(`${API}/api/recipes/${recipeId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: editText.trim() })
      });
      await loadComments();
      setEditingId(null);
      setEditText('');
    } catch (err) {
      console.error('Error editing comment:', err);
    }
  };

  const addReaction = async (commentId, reaction) => {
    if (!token) return alert('Please login to react');
    try {
      await fetch(`${API}/api/recipes/${recipeId}/comments/${commentId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reaction })
      });
      await loadComments();
      setShowReactions(null);
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getAvatarColor = (name) => {
    const colors = ['#D2691E', '#5A2E17', '#e6a817', '#10b981', '#3b82f6', '#8b5cf6'];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const reactions = [
    { emoji: '👍', label: 'Like', icon: <FaThumbsUp /> },
    { emoji: '❤️', label: 'Love', icon: <FaHeart /> },
    { emoji: '😊', label: 'Smile', icon: <FaSmile /> },
    { emoji: '😂', label: 'Laugh', icon: <FaLaugh /> },
    { emoji: '😢', label: 'Sad', icon: <FaSadTear /> },
    { emoji: '😡', label: 'Angry', icon: <FaAngry /> }
  ];

  const getTotalComments = () => {
    const countReplies = (commentsList) => {
      return commentsList.reduce((acc, comment) => acc + 1 + (comment.replies?.length || 0), 0);
    };
    return countReplies(comments);
  };

  const renderComment = (comment, isReply = false) => {
    const isOwner = currentUser?.id === comment.user?._id;
    const reactionCounts = comment.reactions || {};
    
    return (
      <div key={comment._id} className={`comment-item ${isReply ? 'comment-reply' : ''}`}>
        <div className="comment-avatar" style={{ background: getAvatarColor(comment.user?.name) }}>
          {comment.user?.name?.charAt(0).toUpperCase() || <FaUserCircle />}
        </div>
        <div className="comment-content">
          <div className="comment-header">
            <span className="comment-author">{comment.user?.name || 'Anonymous'}</span>
            <span className="comment-date">{formatDate(comment.createdAt)}</span>
          </div>
          
          {editingId === comment._id ? (
            <div className="comment-edit-form">
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} />
              <div className="comment-edit-actions">
                <button onClick={() => editComment(comment._id)}><FaCheck /> Save</button>
                <button onClick={() => { setEditingId(null); setEditText(''); }}><FaTimes /> Cancel</button>
              </div>
            </div>
          ) : (
            <div className="comment-text">{comment.text}</div>
          )}
          
          <div className="comment-actions">
            <button className="comment-reply-btn" onClick={() => setReplyTo(replyTo === comment ? null : comment)}>
              <FaReply /> Reply
            </button>
            
            <div className="comment-reactions">
              {Object.entries(reactionCounts).slice(0, 3).map(([reaction, count]) => (
                <button key={reaction} className="reaction-badge" onClick={() => addReaction(comment._id, reaction)}>
                  {reactions.find(r => r.label === reaction)?.emoji || reaction} {count}
                </button>
              ))}
              <div className="reaction-picker-container">
                <button className="comment-action-btn" onClick={() => setShowReactions(showReactions === comment._id ? null : comment._id)}>😊</button>
                {showReactions === comment._id && (
                  <div className="reaction-picker">
                    {reactions.map(react => (
                      <button key={react.label} className="reaction-option" onClick={() => addReaction(comment._id, react.label)}>
                        {react.emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {isOwner && (
              <>
                <button className="comment-edit-btn" onClick={() => { setEditingId(comment._id); setEditText(comment.text); }}>
                  <FaEdit /> Edit
                </button>
                <button className="comment-delete-btn" onClick={() => deleteComment(comment._id)}>
                  <FaTrash /> Delete
                </button>
              </>
            )}
          </div>
          
          {replyTo === comment && (
            <div className="reply-form">
              <textarea ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Reply to ${comment.user?.name}...`} rows={2} />
              <div className="reply-actions">
                <button onClick={() => setReplyTo(null)}>Cancel</button>
                <button onClick={submitComment} disabled={!text.trim() || submitting}>
                  {submitting ? <FaSpinner className="spinning" /> : 'Reply'}
                </button>
              </div>
            </div>
          )}
          
          {comment.replies?.length > 0 && (
            <div className="replies-container">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="comments-section">
      <div className="comments-header">
        <h3><FaComment /> Comments <span className="comment-count">{getTotalComments()}</span></h3>
        <div className="comments-sort">
          <button className={sortBy === 'newest' ? 'active' : ''} onClick={() => setSortBy('newest')}>Newest</button>
          <button className={sortBy === 'oldest' ? 'active' : ''} onClick={() => setSortBy('oldest')}>Oldest</button>
          <button className={sortBy === 'popular' ? 'active' : ''} onClick={() => setSortBy('popular')}>Most Liked</button>
        </div>
      </div>
      
      <div className="add-comment">
        <div className="add-comment-avatar" style={{ background: getAvatarColor(currentUser?.name) }}>
          {currentUser?.name?.charAt(0).toUpperCase() || <FaUserCircle />}
        </div>
        <form onSubmit={submitComment} className="add-comment-form">
          <textarea placeholder={token ? "Share your thoughts about this recipe..." : "Please login to comment"} value={text} onChange={(e) => setText(e.target.value)} disabled={!token} rows={3} />
          {token && <button type="submit" disabled={!text.trim() || submitting}>{submitting ? <FaSpinner className="spinning" /> : 'Post Comment'}</button>}
        </form>
      </div>
      
      <div className="comments-list">
        {loading ? (
          <div className="comments-loading"><FaSpinner className="spinning" /> Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="no-comments"><div className="no-comments-icon">💬</div><p>No comments yet</p><p className="no-comments-sub">Be the first to share your thoughts!</p></div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
};

// ==================== Feedback Modal ====================
const FeedbackModal = ({ recipeId, token, onClose }) => {
  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : undefined, [token]);
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
        <div className="modal-header"><h3>Send Feedback</h3><button type="button" className="modal-close" onClick={onClose}>✕</button></div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="modal-field">
          <option value="content">Content Issue</option><option value="abuse">Report Abuse</option>
          <option value="bug">Bug Report</option><option value="suggestion">Suggestion</option><option value="other">Other</option>
        </select>
        <textarea className="modal-field" placeholder="Please describe your feedback..." value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
        <div className="modal-actions"><button type="button" onClick={onClose} className="btn-outline">Cancel</button><button type="submit" className="btn-primary" disabled={submitting}>{submitting ? <FaSpinner className="spinning" /> : 'Send'}</button></div>
      </form>
    </div>
  );
};

// ==================== Share Bar ====================
const ShareBar = ({ url, title }) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);
  const [copied, setCopied] = useState(false);

  const copy = async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const webShare = () => { if (navigator.share) { navigator.share({ title, url }).catch(() => copy()); } else { copy(); } };

  return (
    <div className="sharebar">
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer"><FaFacebook /></a>
      <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`} target="_blank" rel="noreferrer"><FaTwitter /></a>
      <a href={`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`} target="_blank" rel="noreferrer"><FaWhatsapp /></a>
      <a href={`mailto:?subject=${encodedText}&body=${encodedUrl}`}><FaEnvelope /></a>
      <button onClick={webShare}><FaShare /></button>
      <button onClick={copy}>{copied ? <FaCheckCircle /> : <FaCopy />}</button>
    </div>
  );
};

// ==================== Main Component ====================
export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : undefined, [token]);

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
      } catch (e) { setError(e.message); } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [id]);

  const saveToCookbook = async () => {
    if (!token) return alert('Please login to save recipes.');
    try { const r = await fetch(`${API}/api/visitor/cookbook/${id}`, { method: 'POST', headers }); if (!r.ok) throw new Error(); setSaved(true); alert('Saved to your cookbook!'); } catch (e) { alert('Could not save to cookbook.'); }
  };

  const downloadNutritionPdf = async () => {
    if (!token) return alert('Please login to download nutrition report.');
    try {
      const res = await fetch(`${API}/api/recipes/${id}/nutrition-report`, { headers });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nutrition-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert('Could not download report'); }
  };

  const downloadRecipePdf = async () => {
    if (!token) return alert('Please login to download recipe.');
    try {
      const res = await fetch(`${API}/api/recipes/${id}/recipe-pdf`, { headers });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recipe?.name || 'recipe'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert('Could not download recipe'); }
  };

  const printRecipe = () => window.print();

  if (loading) return <div className="page-wrap"><div className="loading-container"><FaSpinner className="loading-spinner" /><p>Loading recipe...</p></div></div>;
  if (error || !recipe) return <div className="page-wrap"><div className="error-container"><div className="error-icon">🍛</div><h2>Recipe Not Found</h2><p>{error || 'The recipe you\'re looking for doesn\'t exist.'}</p><Link to="/recipes" className="btn-primary">Browse Recipes</Link></div></div>;

  const n = recipe.nutrition || {};
  const flag = n.ratingFlag || 'neutral';
  const flagText = { 'weight-loss': '🌱 Weight Loss Friendly', 'weight-gain': '💪 Weight Gain', 'neutral': '⚖️ Balanced' }[flag] || '⚖️ Balanced';
  const pageUrl = `${window.location.origin}/recipes/${recipe._id}`;

  return (
    <div className="page-wrap">
      <div className="recipe-detail-container">
        <button onClick={() => navigate('/recipes')} className="back-button"><FaArrowLeft /> Back to Recipes</button>

        <div className="recipe-header">
          {recipe.image && <div className="recipe-image"><img src={recipe.image} alt={recipe.name} /></div>}
          <div className="recipe-info">
            <h1>{recipe.name}</h1>
            <div className="recipe-meta-tags">
              {recipe.category && <span className="meta-tag category">{recipe.category}</span>}
              {recipe.spiceLevel && <span className="meta-tag spice">{recipe.spiceLevel} 🌶️</span>}
              {recipe.dietType && <span className="meta-tag diet">{recipe.dietType}</span>}
              {recipe.culture && <span className="meta-tag culture">{recipe.culture}</span>}
            </div>
            <div className="recipe-ratings">
              <StarRating recipeId={recipe._id} token={token} initialAvg={recipe.averageRating || 0} initialCount={recipe.ratingsCount || 0} />
              <span className="nutrition-flag" data-flag={flag}>{flagText}</span>
            </div>
          </div>
        </div>

        <Section title="Nutrition Information" icon={<FaChartPie />}>
          <AdvancedNutritionChart nutrition={n} />
          {recipe.tags && recipe.tags.length > 0 && <div className="recipe-tags"><strong>Tags:</strong>{recipe.tags.map(tag => <span key={tag} className="recipe-tag">#{tag}</span>)}</div>}
          <div className="nutrition-actions"><button onClick={downloadNutritionPdf} className="btn-outline"><FaDownload /> Download Nutrition Report</button></div>
        </Section>

        <SpicePortionSimulator ingredients={recipe.ingredients} baseSpice={recipe.spiceLevel} />

        <Section title="Ingredients" icon={<FaUtensils />}><div className="ingredients-content"><p>{recipe.ingredients || '—'}</p></div></Section>
        <Section title="Instructions" icon={<FaClock />}><div className="instructions-content"><p style={{ whiteSpace: 'pre-wrap' }}>{recipe.instructions || '—'}</p></div></Section>
        <Section title="Story & Culture" icon={<FaInfoCircle />}><div className="story-content"><p>{recipe.story || recipe.cultureStory || recipe.culture || 'No story available for this recipe.'}</p></div></Section>

        <Section title="Actions" icon={<FaHeart />} right={<ShareBar url={pageUrl} title={recipe.name} />}>
          <div className="action-buttons">
            <button onClick={saveToCookbook} className={`btn-primary ${saved ? 'saved' : ''}`}><FaBookmark /> {saved ? 'Saved!' : 'Save to Cookbook'}</button>
            <button onClick={() => navigate(`/recipes/${id}/cook`)} className="btn-secondary"><FaUtensils /> Start Cook Mode</button>
            {token && <button onClick={downloadRecipePdf} className="btn-outline"><FaDownload /> Download PDF</button>}
            <button onClick={printRecipe} className="btn-outline"><FaPrint /> Print</button>
            <button onClick={() => setShowFeedback(true)} className="btn-outline"><FaFlag /> Send Feedback</button>
          </div>
        </Section>

        <Section title="Comments" icon={<FaComment />}><Comments recipeId={recipe._id} token={token} /></Section>
      </div>
      {showFeedback && <FeedbackModal recipeId={recipe._id} token={token} onClose={() => setShowFeedback(false)} />}
    </div>
  );
}