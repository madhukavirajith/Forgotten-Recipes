// client/src/components/TwistTool.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import './TwistTool.css';

// Icons (install react-icons if not already)
import { 
  FaSearch, FaUtensils, FaMagic, FaSpinner, FaCheckCircle, 
  FaExclamationTriangle, FaInfoCircle, FaArrowRight, 
  FaChartPie, FaTags, FaBookmark, FaShare, FaStar
} from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL || '';

// Helper Macro Pie Component
const MacroPie = ({ protein = 0, carbs = 0, fat = 0, size = 140, stroke = 16 }) => {
  const total = Math.max(0, Number(protein)) + Math.max(0, Number(carbs)) + Math.max(0, Number(fat));
  if (!total) return <div className="macro-empty">No macro data available</div>;

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
    <div className="macro-pie">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
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
      <div className="macro-labels">
        <div><span className="macro-dot carbs"></span> Carbs: {Math.round(pCarbs * 100)}%</div>
        <div><span className="macro-dot protein"></span> Protein: {Math.round(pProtein * 100)}%</div>
        <div><span className="macro-dot fat"></span> Fat: {Math.round(pFat * 100)}%</div>
      </div>
    </div>
  );
};

export default function TwistTool() {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [suggestMap, setSuggestMap] = useState({});
  const [selections, setSelections] = useState({});
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  // Load approved recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${API}/api/recipes`);
        const data = await res.json();
        setRecipes(Array.isArray(data) ? data.filter(r => r.status === 'approved' || r.approved === true) : []);
      } catch (err) {
        console.error('Error fetching recipes:', err);
        setNotification({ msg: 'Failed to load recipes', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, [API]);

  // Load server suggestion dictionary
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`${API}/api/visitor/twist-suggestions`);
        const data = await res.json();
        setSuggestMap(data?.map || {});
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSuggestMap({});
      }
    };
    fetchSuggestions();
  }, [API]);

  // Show notification
  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter recipes with debounce
  const filteredRecipes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return recipes;
    return recipes.filter(r =>
      r.name?.toLowerCase().includes(query) ||
      r.ingredients?.toLowerCase().includes(query) ||
      r.culture?.toLowerCase().includes(query)
    );
  }, [searchTerm, recipes]);

  const ingredientLines = useMemo(() => {
    return (selected?.ingredients || '')
      .split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }, [selected]);

  // Find suggestion hits
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

  // Live preview
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

  const submitTwist = async () => {
    if (!selected) return;

    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Please log in to submit a twist', 'error');
      return;
    }

    const choices = Object.entries(selections)
      .filter(([, to]) => !!to)
      .map(([from, to]) => ({ from, to }));

    if (choices.length === 0) {
      showNotification('Please select at least one substitution', 'error');
      return;
    }

    setSubmitting(true);
    try {
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
        throw new Error(err?.error || 'Failed to submit twist');
      }

      await res.json();
      showNotification('Twisted recipe submitted successfully! Head chef will review it.', 'success');
      setSelections({});
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecipeSelect = (recipe) => {
    setSelected(recipe);
    setSelections({});
    setSearchTerm('');
    if (searchInputRef.current) searchInputRef.current.value = '';
  };

  const clearSelection = () => {
    setSelected(null);
    setSelections({});
  };

  if (loading) {
    return (
      <div className="twist-container">
        <div className="loading-state">
          <FaSpinner className="spinning" />
          <p>Loading recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="twist-container">
      {/* Header */}
      <div className="twist-header">
        <h1 className="twist-title">
          <span className="title-icon">🔄</span>
          Western Twist Tool
        </h1>
        <p className="twist-subtitle">
          Transform traditional Sri Lankan recipes with western ingredients. 
          Submit your creation for head chef approval!
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`toast-notification ${notification.type}`}>
          {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Search Section */}
      <div className="twist-search-section">
        <div className={`search-wrapper ${searchFocused ? 'focused' : ''}`}>
          <FaSearch className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for a traditional recipe to twist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>

        {/* Recipe Results */}
        {searchTerm && filteredRecipes.length > 0 && (
          <div className="search-results">
            {filteredRecipes.slice(0, 6).map(recipe => (
              <button
                key={recipe._id}
                className={`result-item ${selected?._id === recipe._id ? 'selected' : ''}`}
                onClick={() => handleRecipeSelect(recipe)}
              >
                <div className="result-name">{recipe.name}</div>
                <div className="result-meta">
                  {recipe.culture && <span className="result-culture">{recipe.culture}</span>}
                  {recipe.category && <span className="result-category">{recipe.category}</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        {searchTerm && filteredRecipes.length === 0 && (
          <div className="no-results">
            <FaInfoCircle />
            <p>No recipes found. Try a different search term.</p>
          </div>
        )}
      </div>

      {/* Selected Recipe */}
      {!selected ? (
        <div className="empty-state">
          <div className="empty-icon">✨</div>
          <h3>Select a recipe to start twisting</h3>
          <p>Search above and click on any traditional recipe to begin creating your western twist version.</p>
        </div>
      ) : (
        <div className="twist-editor">
          {/* Recipe Header */}
          <div className="editor-header">
            <div className="recipe-info">
              <h2>{selected.name}</h2>
              <div className="recipe-badges">
                {selected.category && <span className="badge">{selected.category}</span>}
                {selected.spiceLevel && <span className="badge spice">{selected.spiceLevel}</span>}
                {selected.dietType && <span className="badge diet">{selected.dietType}</span>}
                {selected.culture && <span className="badge culture">{selected.culture}</span>}
              </div>
            </div>
            <button className="clear-btn" onClick={clearSelection}>
              Change Recipe
            </button>
          </div>

          {/* Main Grid */}
          <div className="editor-grid">
            {/* Original Ingredients */}
            <div className="editor-card">
              <h3>
                <FaUtensils /> Original Ingredients
              </h3>
              <div className="ingredients-box">
                {ingredientLines.map((line, idx) => (
                  <div key={idx} className="ingredient-line">{line}</div>
                ))}
              </div>
            </div>

            {/* Substitutions */}
            <div className="editor-card">
              <h3>
                <FaMagic /> Western Substitutes
              </h3>
              {hits.length === 0 ? (
                <div className="no-suggestions">
                  <FaInfoCircle />
                  <p>No specific substitutions detected for this recipe.</p>
                  <small>You can still submit a twist – our head chef will review it.</small>
                </div>
              ) : (
                <div className="substitutions-list">
                  {hits.map(hit => (
                    <div key={hit.key} className="substitution-item">
                      <div className="substitution-label">{hit.key}</div>
                      <select
                        value={selections[hit.key] || ''}
                        onChange={e => setSelections(prev => ({ ...prev, [hit.key]: e.target.value }))}
                        className="substitution-select"
                      >
                        <option value="">— Skip —</option>
                        {hit.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="editor-card">
              <h3>
                <FaArrowRight /> Twisted Preview
              </h3>
              <div className="preview-box">
                {preview ? preview.split('\n').map((line, idx) => (
                  <div key={idx} className="preview-line">{line}</div>
                )) : ingredientLines.map((line, idx) => (
                  <div key={idx} className="preview-line original">{line}</div>
                ))}
              </div>
            </div>

            {/* Nutrition Reference */}
            <div className="editor-card">
              <h3>
                <FaChartPie /> Nutrition Reference
              </h3>
              <MacroPie
                protein={selected?.nutrition?.protein || 0}
                carbs={selected?.nutrition?.carbs || 0}
                fat={selected?.nutrition?.fat || 0}
              />
              <div className="nutrition-note">
                <small>Twisted recipe nutrition will be calculated by our dietician after approval.</small>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="submit-section">
            <button 
              className="submit-btn" 
              onClick={submitTwist} 
              disabled={submitting}
            >
              {submitting ? <FaSpinner className="spinning" /> : <FaCheckCircle />}
              {submitting ? 'Submitting...' : 'Submit for Head Chef Approval'}
            </button>
            <p className="submit-note">
              Your twisted recipe will be reviewed by our head chef. Once approved, a dietician will add nutritional information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}