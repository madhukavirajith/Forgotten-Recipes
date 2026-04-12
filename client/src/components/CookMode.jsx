// client/src/components/CookMode.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './cookmode.css';
import { 
  FaClock, FaPlay, FaPause, FaSyncAlt, FaChevronLeft, FaChevronRight, 
  FaCheckCircle, FaRegCircle, FaTimes, FaUtensils, FaListUl 
} from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL || '';
const lsKey = (id) => `cookMode:${id || 'unknown'}`;

// Helper functions (same as before, keep them)
const cleanLine = (s) => s.replace(/^\s*[-*•]\s*/, '').replace(/^\s*\d+[.)]\s+/, '').trim();
const splitByLines = (text = '') => (text || '').split(/\r?\n+/).map(l => l.trim()).filter(Boolean);

function parseIngredients(ingredients = '') {
  const byLine = splitByLines(ingredients);
  if (byLine.length > 1) return byLine.map(cleanLine);
  const byComma = (ingredients || '').split(/,(?=(?:[^()]*\([^()]*\))*[^()]*$)/g).map(s => cleanLine(s)).filter(Boolean);
  return byComma.length ? byComma : (ingredients.trim() ? [ingredients.trim()] : []);
}

function parseSteps(instructions = '') {
  const byLine = splitByLines(instructions);
  if (byLine.some(l => /^\d+[.)]/.test(l))) return byLine.map(cleanLine);
  const steps = [];
  let buf = '';
  byLine.forEach((l, i) => {
    buf = buf ? `${buf} ${l}` : l;
    const next = byLine[i + 1];
    const endHere = !next || /[.!?]$/.test(l);
    if (endHere) {
      if (buf.trim()) steps.push(buf.trim());
      buf = '';
    }
  });
  return steps.length ? steps : (instructions ? [instructions] : []);
}

function seedSecondsFromText(stepText = '') {
  const hms = stepText.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/);
  if (hms) return (parseInt(hms[1],10)||0)*3600 + (parseInt(hms[2],10)||0)*60 + (parseInt(hms[3]||'0',10)||0);
  const m = stepText.match(/(\d+)\s*(?:min|mins|minute|minutes)\b/i);
  if (m) return parseInt(m[1],10)*60;
  const s = stepText.match(/(\d+)\s*(?:sec|secs|second|seconds)\b/i);
  return s ? parseInt(s[1],10) : 0;
}

function fmtTime(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// Main Component
export default function CookMode({ recipe: recipeProp, onClose }) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(recipeProp || null);
  const [loading, setLoading] = useState(!recipeProp);
  const [error, setError] = useState(null);

  const [stepIdx, setStepIdx] = useState(0);
  const [checked, setChecked] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const intervalRef = useRef(null);
  const stepLiveRef = useRef(null);
  const timerAudioRef = useRef(null);

  // Fetch recipe if not passed as prop
  useEffect(() => {
    if (recipeProp || !routeId) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API}/api/recipes/${routeId}`);
        if (!res.ok) throw new Error('Recipe not found');
        const data = await res.json();
        if (mounted) setRecipe(data);
      } catch (err) {
        setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [recipeProp, routeId]);

  const rid = recipe?._id || recipe?.id || routeId || 'unknown';
  const persistKey = useMemo(() => lsKey(rid), [rid]);

  const ingredients = useMemo(() => parseIngredients(recipe?.ingredients || ''), [recipe]);
  const steps = useMemo(() => parseSteps(recipe?.instructions || ''), [recipe]);

  // Load progress
  useEffect(() => {
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.stepIdx === 'number') {
          const safe = Math.min(Math.max(saved.stepIdx, 0), Math.max(steps.length - 1, 0));
          setStepIdx(safe);
        }
        if (Array.isArray(saved.checked)) setChecked(saved.checked.filter(i => Number.isInteger(i)));
      }
    } catch (e) {}
  }, [persistKey, steps.length]);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(persistKey, JSON.stringify({ stepIdx, checked }));
    } catch (e) {}
  }, [persistKey, stepIdx, checked]);

  // Timer functions
  const startTimer = () => {
    if (running) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds(s => (s > 0 ? s - 1 : 0));
    }, 1000);
  };

  const stopTimer = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const resetTimer = () => {
    stopTimer();
    const seed = seedSecondsFromText(steps[stepIdx] || '');
    setSeconds(seed);
  };

  const toggleTimer = () => (running ? stopTimer() : startTimer());

  // When step changes
  useEffect(() => {
    stopTimer();
    const seed = seedSecondsFromText(steps[stepIdx] || '');
    setSeconds(seed);
    setTimeout(() => {
      stepLiveRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 50);
  }, [stepIdx]);

  useEffect(() => () => stopTimer(), []);

  // Timer end beep (optional)
  useEffect(() => {
    if (seconds === 0 && running) {
      stopTimer();
      // Optional: play sound if audio element exists
    }
  }, [seconds, running]);

  const nextStep = () => setStepIdx(i => Math.min(i + 1, steps.length - 1));
  const prevStep = () => setStepIdx(i => Math.max(i - 1, 0));
  const progressPct = steps.length ? Math.round(((stepIdx + 1) / steps.length) * 100) : 0;

  const isChecked = (idx) => checked.includes(idx);
  const toggleCheck = (idx) => setChecked(arr => arr.includes(idx) ? arr.filter(i => i !== idx) : [...arr, idx]);
  const checkAll = () => setChecked(ingredients.map((_, i) => i));
  const clearAll = () => setChecked([]);
  const checkedCount = checked.length;
  const totalIngredients = ingredients.length;

  const handleExit = () => {
    if (onClose) onClose();
    else if (rid) navigate(`/recipes/${rid}`);
    else navigate(-1);
  };

  const confirmExit = () => setShowExitConfirm(true);
  const cancelExit = () => setShowExitConfirm(false);

  if (loading) {
    return (
      <div className="cookmode-overlay">
        <div className="cookmode cookmode-loading">
          <div className="loading-spinner"></div>
          <p>Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="cookmode-overlay">
        <div className="cookmode cookmode-error">
          <div className="error-icon">⚠️</div>
          <h3>Recipe not found</h3>
          <p>{error || 'Unable to load the recipe. Please try again.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/recipes')}>Browse Recipes</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cookmode-overlay" role="dialog" aria-modal="true" aria-label="Cook Mode">
      <div className="cookmode">
        <div className="cm-header">
          <div className="cm-header-left">
            <button className="cm-back-btn" onClick={confirmExit} aria-label="Exit Cook Mode">←</button>
            <div className="cm-title">
              <h1>{recipe.name}</h1>
              <div className="cm-meta">
                <span className="step-indicator">Step {stepIdx + 1} of {steps.length}</span>
                <span className="progress-value">{progressPct}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>
          <div className="cm-header-right">
            <button className="btn-exit" onClick={confirmExit}>✕</button>
          </div>
        </div>

        <div className="cm-grid">
          <aside className="cm-aside">
            <div className="aside-header">
              <h3><FaListUl className="aside-icon" /> Ingredients</h3>
              <div className="aside-stats">{checkedCount}/{totalIngredients} checked</div>
            </div>
            <div className="aside-tools">
              <button className="btn-pill" onClick={checkAll}>✓ Check All</button>
              <button className="btn-pill" onClick={clearAll}>✗ Clear</button>
            </div>
            <div className="ingredients-list">
              {ingredients.length === 0 ? (
                <p className="muted">No ingredients listed.</p>
              ) : (
                <ul>
                  {ingredients.map((line, idx) => (
                    <li key={idx} className={`ingredient-item ${isChecked(idx) ? 'checked' : ''}`}>
                      <label className="ingredient-checkbox">
                        <input type="checkbox" checked={isChecked(idx)} onChange={() => toggleCheck(idx)} />
                        <span className="checkbox-custom"></span>
                        <span className="ingredient-text">{line}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <main className="cm-main">
            {recipe.image && (
              <div className="cm-hero">
                <img src={recipe.image} alt={recipe.name} />
              </div>
            )}

            <div className="step-container" ref={stepLiveRef}>
              <div className="step-number">Step {stepIdx + 1}</div>
              <div className="step-text">{steps[stepIdx] || 'No instructions provided.'}</div>

              <div className="timer-section">
                <div className="timer-display">
                  <FaClock className="timer-icon" />
                  <span className="timer-value">{fmtTime(seconds)}</span>
                </div>
                <div className="timer-controls">
                  <button className="timer-btn" onClick={toggleTimer}>
                    {running ? <FaPause /> : <FaPlay />} {running ? 'Pause' : 'Start'}
                  </button>
                  <button className="timer-btn outline" onClick={resetTimer}>
                    <FaSyncAlt /> Reset
                  </button>
                </div>
                <p className="timer-hint">Set your own pace – timer is optional.</p>
              </div>

              <div className="step-nav">
                <button className="nav-btn prev" onClick={prevStep} disabled={stepIdx === 0}>
                  <FaChevronLeft /> Previous
                </button>
                <button className="nav-btn next" onClick={nextStep} disabled={stepIdx === steps.length - 1}>
                  Next <FaChevronRight />
                </button>
              </div>
            </div>
          </main>
        </div>

        {showExitConfirm && (
          <div className="exit-modal-overlay" onClick={cancelExit}>
            <div className="exit-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Exit Cook Mode?</h3>
              <p>Your progress will be saved. You can resume later.</p>
              <div className="exit-modal-buttons">
                <button className="btn-secondary" onClick={cancelExit}>Cancel</button>
                <button className="btn-primary" onClick={handleExit}>Exit</button>
              </div>
            </div>
          </div>
        )}

        <audio ref={timerAudioRef} src="/beep.mp3" preload="none" />
      </div>
    </div>
  );
}