// client/src/components/dashboards/DieticianDashboard.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import './DieticianDashboard.css';
import Chat from '../Chat';   // ✅ global chat component

// Icons
import { 
  FaAppleAlt, FaChartPie, FaTags, FaSave, FaPlus, FaTrash,
  FaUtensils, FaClock, FaFire, FaLeaf, FaHeartbeat,
  FaWeightHanging, FaBolt, FaDatabase, FaListUl,
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle
} from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const emptyNut = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  vitamins: [],
  ratingFlag: 'neutral',
  benefits: []
};

// Helper components
const MacroPie = ({ protein = 0, carbs = 0, fat = 0, size = 160, stroke = 18 }) => {
  const total = Math.max(0, Number(protein)) + Math.max(0, Number(carbs)) + Math.max(0, Number(fat));
  if (!total) return <div className="muted">No macro data yet</div>;

  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const pCarbs = carbs / total;
  const pProtein = protein / total;
  const pFat = fat / total;

  const sCarbs = c * pCarbs;
  const sProtein = c * pProtein;
  const sFat = c * pFat;
  const oCarbs = 0;
  const oProtein = c - sProtein;
  const oFat = c - sProtein - sFat;
  const center = size / 2;

  return (
    <div className="macro-pie-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle cx={center} cy={center} r={radius} fill="none"
          stroke="#f59e0b" strokeWidth={stroke}
          strokeDasharray={`${sCarbs} ${c - sCarbs}`} strokeDashoffset={oCarbs}
          transform={`rotate(-90 ${center} ${center})`} />
        <circle cx={center} cy={center} r={radius} fill="none"
          stroke="#3b82f6" strokeWidth={stroke}
          strokeDasharray={`${sProtein} ${c - sProtein}`} strokeDashoffset={oProtein}
          transform={`rotate(-90 ${center} ${center})`} />
        <circle cx={center} cy={center} r={radius} fill="none"
          stroke="#ef4444" strokeWidth={stroke}
          strokeDasharray={`${sFat} ${c - sFat}`} strokeDashoffset={oFat}
          transform={`rotate(-90 ${center} ${center})`} />
      </svg>
      <div className="macro-labels">
        <div><span className="color-dot carbs"></span> Carbs: {Math.round(pCarbs * 100)}%</div>
        <div><span className="color-dot protein"></span> Protein: {Math.round(pProtein * 100)}%</div>
        <div><span className="color-dot fat"></span> Fat: {Math.round(pFat * 100)}%</div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="stat-card" style={{ borderLeftColor: color }}>
    <div className="stat-icon" style={{ color }}>{icon}</div>
    <div className="stat-info">
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
    </div>
  </div>
);

export default function DieticianDashboard() {
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [nut, setNut] = useState(emptyNut);
  const [newTags, setNewTags] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('nutrition');
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch(`${API}/dietician/pending`);
      const data = await res.json();
      setQueue(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecipe = useCallback(async (id) => {
    try {
      const res = await fetch(`${API}/dietician/recipes/${id}`);
      if (!res.ok) return;
      const r = await res.json();
      setSelected(r);
      setNut({
        calories: r?.nutrition?.calories || 0,
        protein:  r?.nutrition?.protein  || 0,
        carbs:    r?.nutrition?.carbs    || 0,
        fat:      r?.nutrition?.fat      || 0,
        vitamins: r?.nutrition?.vitamins || [],
        ratingFlag: r?.nutrition?.ratingFlag || 'neutral',
        benefits: r?.nutrition?.benefits || []
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const selectFromQueue = (r) => {
    setSelected(r);
    setNut({
      calories: r?.nutrition?.calories || 0,
      protein:  r?.nutrition?.protein  || 0,
      carbs:    r?.nutrition?.carbs    || 0,
      fat:      r?.nutrition?.fat      || 0,
      vitamins: r?.nutrition?.vitamins || [],
      ratingFlag: r?.nutrition?.ratingFlag || 'neutral',
      benefits: r?.nutrition?.benefits || []
    });
    loadRecipe(r._id);
    setActiveTab('nutrition');
  };

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const saveNutrition = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`${API}/dietician/recipes/${selected._id}/nutrition`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nut)
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSelected(updated);
      setQueue(q => q.map(x => (x._id === updated._id ? updated : x)));
      showNotification('Nutrition saved successfully!', 'success');
    } catch (e) {
      showNotification('Failed to save nutrition', 'error');
    }
  };

  const addTags = async () => {
    if (!selected) return;
    const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
    if (!tags.length) return;
    try {
      const res = await fetch(`${API}/dietician/recipes/${selected._id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSelected(prev => ({ ...prev, tags: data.tags }));
      setNewTags('');
      showNotification('Tags added successfully!', 'success');
    } catch (e) {
      showNotification('Failed to add tags', 'error');
    }
  };

  const removeTag = async (tag) => {
    if (!selected) return;
    try {
      const res = await fetch(`${API}/dietician/recipes/${selected._id}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSelected(prev => ({ ...prev, tags: data.tags }));
    } catch (e) {
      showNotification('Failed to remove tag', 'error');
    }
  };

  const chartData = useMemo(() => ({
    protein: Number(nut.protein) || 0,
    carbs: Number(nut.carbs) || 0,
    fat: Number(nut.fat) || 0
  }), [nut]);

  const ratingColor = {
    'weight-loss': '#10b981',
    'weight-gain': '#ef4444',
    'neutral': '#f59e0b'
  }[nut.ratingFlag] || '#f59e0b';

  const stats = [
    { title: 'Pending Reviews', value: queue.length, icon: <FaClock />, color: '#f59e0b' },
    { title: 'Total Recipes', value: queue.length + (selected ? 1 : 0), icon: <FaDatabase />, color: '#D2691E' },
    { title: 'Tags Added', value: selected?.tags?.length || 0, icon: <FaTags />, color: '#8b5cf6' }
  ];

  return (
    <div className="dietician-dashboard">
      {notification && (
        <div className={`toast-notification ${notification.type}`}>
          {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{notification.msg}</span>
        </div>
      )}

      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <span className="title-icon">🥗</span>
          Dietician Dashboard
        </h1>
        <p className="dashboard-subtitle">Manage nutrition, health labels, and ingredient benefits</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Main Grid */}
      <div className="dashboard-main-grid">
        {/* Left Sidebar – Pending Recipes */}
        <aside className="pending-sidebar">
          <div className="sidebar-header">
            <h3><FaListUl /> Needs Nutrition Review</h3>
            <span className="badge">{queue.length}</span>
          </div>
          <div className="pending-list">
            {loading && <div className="loading-skeleton"><div className="spinner"></div> Loading...</div>}
            {!loading && queue.length === 0 && <div className="empty-state">✅ All caught up! No pending recipes.</div>}
            {queue.map(r => (
              <div
                key={r._id}
                className={`pending-item ${selected?._id === r._id ? 'active' : ''}`}
                onClick={() => selectFromQueue(r)}
              >
                <div className="pending-name">{r.name}</div>
                <div className="pending-meta">{new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Content – Editor */}
        <main className="editor-area">
          {!selected ? (
            <div className="empty-editor">
              <div className="empty-icon">📋</div>
              <h3>Select a recipe</h3>
              <p>Choose a recipe from the left to start editing nutrition details.</p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="editor-tabs">
                <button className={`tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`} onClick={() => setActiveTab('nutrition')}>
                  <FaAppleAlt /> Nutrition
                </button>
                <button className={`tab-btn ${activeTab === 'tags' ? 'active' : ''}`} onClick={() => setActiveTab('tags')}>
                  <FaTags /> Tags & Benefits
                </button>
                <button className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
                  <FaHeartbeat /> Inbox
                </button>
              </div>

              {/* Nutrition Tab */}
              {activeTab === 'nutrition' && (
                <div className="nutrition-tab">
                  <div className="recipe-header">
                    <h2>{selected.name}</h2>
                    <span className="health-flag" style={{ background: ratingColor }}>
                      {nut.ratingFlag === 'weight-loss' ? '🌱 Weight Loss' : nut.ratingFlag === 'weight-gain' ? '💪 Weight Gain' : '⚖️ Balanced'}
                    </span>
                  </div>

                  <div className="nutrition-form">
                    <div className="form-row four-col">
                      <div className="input-group">
                        <label>Calories (kcal)</label>
                        <input type="number" value={nut.calories} onChange={e => setNut({...nut, calories: Number(e.target.value)})} />
                      </div>
                      <div className="input-group">
                        <label>Protein (g)</label>
                        <input type="number" value={nut.protein} onChange={e => setNut({...nut, protein: Number(e.target.value)})} />
                      </div>
                      <div className="input-group">
                        <label>Carbs (g)</label>
                        <input type="number" value={nut.carbs} onChange={e => setNut({...nut, carbs: Number(e.target.value)})} />
                      </div>
                      <div className="input-group">
                        <label>Fat (g)</label>
                        <input type="number" value={nut.fat} onChange={e => setNut({...nut, fat: Number(e.target.value)})} />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="input-group">
                        <label>Health Label</label>
                        <select value={nut.ratingFlag} onChange={e => setNut({...nut, ratingFlag: e.target.value})}>
                          <option value="weight-loss">🌱 Weight Loss Friendly</option>
                          <option value="neutral">⚖️ Balanced</option>
                          <option value="weight-gain">💪 Weight Gain</option>
                        </select>
                      </div>
                    </div>

                    <div className="macro-section">
                      <h4>Macronutrient Distribution</h4>
                      <MacroPie protein={chartData.protein} carbs={chartData.carbs} fat={chartData.fat} />
                    </div>

                    <div className="vitamins-section">
                      <h4>Vitamins & Minerals</h4>
                      {nut.vitamins.map((v, i) => (
                        <div key={i} className="vitamin-row">
                          <input placeholder="Vitamin name" value={v.name} onChange={e => {
                            const arr = [...nut.vitamins];
                            arr[i].name = e.target.value;
                            setNut({...nut, vitamins: arr});
                          }} />
                          <input placeholder="Amount (e.g., 12 mg)" value={v.amount} onChange={e => {
                            const arr = [...nut.vitamins];
                            arr[i].amount = e.target.value;
                            setNut({...nut, vitamins: arr});
                          }} />
                          <button onClick={() => {
                            const arr = nut.vitamins.filter((_, idx) => idx !== i);
                            setNut({...nut, vitamins: arr});
                          }}><FaTrash /></button>
                        </div>
                      ))}
                      <button className="add-btn" onClick={() => setNut({...nut, vitamins: [...nut.vitamins, {name: '', amount: ''}]})}>
                        <FaPlus /> Add Vitamin
                      </button>
                    </div>

                    <div className="benefits-section">
                      <h4>Ingredient Benefits</h4>
                      <textarea
                        rows={4}
                        placeholder="One per line, e.g., Goraka – good for digestion"
                        value={nut.benefits.join('\n')}
                        onChange={e => setNut({...nut, benefits: e.target.value.split('\n').filter(Boolean)})}
                      />
                    </div>

                    <div className="form-actions">
                      <button onClick={saveNutrition} className="btn-primary"><FaSave /> Save Nutrition</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags Tab */}
              {activeTab === 'tags' && (
                <div className="tags-tab">
                  <div className="tags-section">
                    <h4>Recipe Tags</h4>
                    <div className="tags-list">
                      {selected.tags?.map(tag => (
                        <span key={tag} className="tag-pill" onClick={() => removeTag(tag)}>
                          {tag} ✕
                        </span>
                      ))}
                      {(!selected.tags || selected.tags.length === 0) && <span className="muted">No tags yet</span>}
                    </div>
                    <div className="add-tag">
                      <input
                        type="text"
                        placeholder="Add tags (comma separated, e.g., Vegan, Gluten-Free)"
                        value={newTags}
                        onChange={e => setNewTags(e.target.value)}
                      />
                      <button onClick={addTags} className="btn-secondary"><FaPlus /> Add</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat / Inbox Tab – now only the header (no Chat component inside) */}
              {activeTab === 'chat' && (
                <div className="inbox-tab">
                  <div className="inbox-header">
                    <h4><FaHeartbeat /> Messages from Visitors</h4>
                    <p>Respond to visitor inquiries about this recipe</p>
                  </div>
                  {/* The actual chat widget is rendered globally below – no need to duplicate */}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ✅ Global Chat Component – always mounted, always connected */}
      <Chat />
    </div>
  );
}