import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './cookmode.css';

const API = process.env.REACT_APP_API_URL || '';


const lsKey = (id) => `cookMode:${id || 'unknown'}`;

const cleanLine = (s) =>
  s.replace(/^\s*[-*•]\s*/, '').replace(/^\s*\d+[.)]\s+/, '').trim();

const splitByLines = (text = '') =>
  (text || '').split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);

function parseIngredients(ingredients = '') {
  
  const byLine = splitByLines(ingredients);
  if (byLine.length > 1) return byLine.map(cleanLine);

  
  const byComma = (ingredients || '')
    .split(/,(?=(?:[^()]*\([^()]*\))*[^()]*$)/g)
    .map((s) => cleanLine(s))
    .filter(Boolean);

  if (byComma.length) return byComma;

  
  return ingredients.trim() ? [ingredients.trim()] : [];
}

function parseSteps(instructions = '') {
  const byLine = splitByLines(instructions);
  if (byLine.some((l) => /^\d+[.)]/.test(l))) return byLine.map(cleanLine);

  const steps = [];
  let buf = '';
  byLine.forEach((l, i) => {
    buf = buf ? `${buf} ${l}` : l;
    const next = byLine[i + 1];
    const endHere = !next || /[.!?]$/.test(l);
    if (endHere) {
      const t = buf.trim();
      if (t) steps.push(t);
      buf = '';
    }
  });
  return steps.length ? steps : (instructions ? [instructions] : []);
}

function seedSecondsFromText(stepText = '') {
  const hms = stepText.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/);
  if (hms) {
    const h = parseInt(hms[1], 10) || 0;
    const m = parseInt(hms[2], 10) || 0;
    const s = parseInt(hms[3] || '0', 10) || 0;
    return h * 3600 + m * 60 + s;
  }
  const m = stepText.match(/(\d+)\s*(?:min|mins|minute|minutes)\b/i);
  if (m) return parseInt(m[1], 10) * 60;
  const s = stepText.match(/(\d+)\s*(?:sec|secs|second|seconds)\b/i);
  if (s) return parseInt(s[1], 10);
  return 0;
}

function fmtTime(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/* ---------- component ---------- */
export default function CookMode({ recipe: recipeProp, onClose }) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(recipeProp || null);
  const [loading, setLoading] = useState(!recipeProp);

  // Fetch recipe 
  useEffect(() => {
    if (recipeProp || !routeId) return;
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`${API}/api/recipes/${routeId}`);
        const data = await r.json();
        if (mounted) setRecipe(data);
      } catch (e) {
        console.error('CookMode fetch error:', e);
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

  const [stepIdx, setStepIdx] = useState(0);
  const [checked, setChecked] = useState([]); 

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const stepLiveRef = useRef(null);

  // Restore progress
  useEffect(() => {
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.stepIdx === 'number') {
          const safe = Math.min(Math.max(saved.stepIdx, 0), Math.max(steps.length - 1, 0));
          setStepIdx(safe);
        }
        if (Array.isArray(saved.checked)) {
          setChecked(saved.checked.filter((i) => Number.isInteger(i)));
        }
      }
    } catch {
      
    }
    
  }, [persistKey]);

  // Persist progress
  useEffect(() => {
    try {
      localStorage.setItem(persistKey, JSON.stringify({ stepIdx, checked }));
    } catch {
      
    }
  }, [persistKey, stepIdx, checked]);

  
  useEffect(() => {
    stopTimer();
    const seed = seedSecondsFromText(steps[stepIdx] || '');
    if (seed > 0) setSeconds(seed);
    setTimeout(() => {
      if (stepLiveRef.current) {
        stepLiveRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }, 40);
    
  }, [stepIdx]);

  // Cleanup
  useEffect(() => () => stopTimer(), []);

  // Timer
  const startTimer = () => {
    if (running) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
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
  const toggleTimer = () => {
    if (running) stopTimer();
    else startTimer();
  };

  // Nav
  const nextStep = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const prevStep = () => setStepIdx((i) => Math.max(i - 1, 0));
  const progressPct = steps.length ? Math.round(((stepIdx + 1) / steps.length) * 100) : 0;

  // Checklist
  const isChecked = (idx) => checked.includes(idx);
  const toggleCheck = (idx) =>
    setChecked((arr) => (arr.includes(idx) ? arr.filter((i) => i !== idx) : [...arr, idx]));
  const checkAll = () => setChecked(ingredients.map((_, i) => i));
  const clearAll = () => setChecked([]);

  // Exit
  const handleExit = () => {
    if (onClose) onClose();
    else if (rid) navigate(`/recipes/${rid}`);
    else navigate(-1);
  };

  if (loading || !recipe) {
    return (
      <div className="cookmode-overlay">
        <div className="cookmode">
          <div className="cm-header">
            <div className="cm-title">
              <div className="title">Cook Mode</div>
              <div className="meta">Loading…</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cookmode-overlay" role="dialog" aria-modal="true" aria-label="Cook Mode">
      <div className="cookmode">
        {/* Header */}
        <div className="cm-header">
          <div className="cm-title">
            <div className="title">{recipe?.name || 'Recipe'}</div>
            <div className="meta">
              Step {Math.min(stepIdx + 1, steps.length)} / {steps.length}
            </div>
            <div className="progress">
              <div className="progress-bar" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <div className="cm-actions">
            <button className="btn ghost" onClick={toggleTimer}>
              {running ? 'Stop Timer' : 'Start Timer'}
            </button>
            <button className="btn dark" onClick={handleExit}>Exit</button>
          </div>
        </div>

        {/* Body */}
        <div className="cm-grid">
          {/* Ingredients */}
          <aside className="cm-aside">
            <div className="aside-head">
              <h3>Ingredients</h3>
              <div className="aside-tools">
                <button className="btn pill" onClick={checkAll}>Check all</button>
                <button className="btn pill" onClick={clearAll}>Clear</button>
              </div>
            </div>
            {ingredients.length === 0 ? (
              <div className="muted">No ingredients provided.</div>
            ) : (
              <ul className="ing-list">
                {ingredients.map((line, idx) => (
                  <li key={idx} className={`ing ${isChecked(idx) ? 'done' : ''}`}>
                    <label className="ing-check">
                      <input
                        type="checkbox"
                        checked={isChecked(idx)}
                        onChange={() => toggleCheck(idx)}
                        aria-label={`Ingredient ${idx + 1}`}
                      />
                      <span />
                    </label>
                    <span className="ing-text">{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Steps */}
          <section className="cm-main">
            {recipe?.image && (
              <img className="cm-hero" src={recipe.image} alt={recipe?.name || 'Recipe'} />
            )}

            <div className="step-wrap" ref={stepLiveRef}>
              <div className="step-index">Step {stepIdx + 1}</div>
              <div className="step-text">{steps[stepIdx] || ''}</div>

              <div className="timer">
                <div className="time">{fmtTime(seconds)}</div>
                <div className="timer-actions">
                  <button className="btn" onClick={toggleTimer}>
                    {running ? 'Pause' : 'Start'}
                  </button>
                  <button className="btn outline" onClick={resetTimer}>Reset</button>
                </div>
                <div className="hint muted">Use the buttons to control your step timer.</div>
              </div>

              <div className="nav">
                <button className="btn outline" onClick={prevStep} disabled={stepIdx === 0}>
                  Previous
                </button>
                <button className="btn" onClick={nextStep} disabled={stepIdx === steps.length - 1}>
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
