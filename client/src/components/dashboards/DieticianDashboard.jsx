
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import './DieticianDashboard.css';

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

export default function DieticianDashboard() {
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [nut, setNut] = useState(emptyNut);
  const [newTags, setNewTags] = useState('');
  const [loading, setLoading] = useState(true);

  // load pending recipes
  const loadQueue = async () => {
    try {
      const res = await fetch(`${API}/dietician/pending`);
      const data = await res.json();
      setQueue(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // refresh a selected recipe from API (in case tags/nut changed elsewhere)
  const loadRecipe = async (id) => {
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
  };

  // instant select from queue, then background refresh
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
  };

  useEffect(() => { loadQueue(); }, []);

  const saveNutrition = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`${API}/dietician/recipes/${selected._id || selected.id}/nutrition`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nut)
      });
      if (!res.ok) return alert('Failed to save');
      const updated = await res.json();
      setSelected(updated);
      setQueue(q => q.map(x => (x._id === updated._id ? updated : x)));
      alert('Nutrition saved');
    } catch (e) {
      console.error(e);
    }
  };

  const addTags = async () => {
    if (!selected) return;
    const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
    if (!tags.length) return;
    try {
      const res = await fetch(`${API}/dietician/recipes/${selected._id || selected.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags })
      });
      if (!res.ok) return;
      const data = await res.json();
      setSelected(prev => ({ ...prev, tags: data.tags }));
      setNewTags('');
    } catch (e) {
      console.error(e);
    }
  };

  const removeTag = async (tag) => {
    if (!selected) return;
    try {
      const res = await fetch(`${API}/dietician/recipes/${selected._id || selected.id}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag })
      });
      if (!res.ok) return;
      const data = await res.json();
      setSelected(prev => ({ ...prev, tags: data.tags }));
    } catch (e) {
      console.error(e);
    }
  };

  const chartData = useMemo(() => ({
    protein: Number(nut.protein) || 0,
    carbs: Number(nut.carbs) || 0,
    fat: Number(nut.fat) || 0
  }), [nut]);

  const ratingColor =
    nut.ratingFlag === 'weight-loss' ? 'green'
      : nut.ratingFlag === 'weight-gain' ? 'red'
      : 'goldenrod';

  return (
    <div className="dietician p-4">
      <h1 className="title">Dietician Dashboard</h1>

      <div className="grid">
        <aside className="list">
          <h3>Needs Nutrition Review</h3>
          {loading && <p className="muted">Loading…</p>}
          <ul>
            {queue.map(r => (
              <li
                key={r._id}
                className={selected && (selected._id === r._id) ? 'selected' : ''}
                onClick={() => selectFromQueue(r)}
              >
                <div className="name">{r.name}</div>
                <div className="meta">{new Date(r.createdAt).toLocaleDateString()}</div>
              </li>
            ))}
            {!loading && !queue.length && <li className="muted">No pending items</li>}
          </ul>
        </aside>

        <main className="editor">
          {!selected ? (
            <p className="muted">Select a recipe from the left to begin.</p>
          ) : (
            <>
              <header className="editor-head">
                <h2>{selected.name}</h2>
                <span className="flag" style={{ background: ratingColor }}>
                  {nut.ratingFlag}
                </span>
              </header>

              <section className="nutrition">
                <div className="fields">
                  <label>Calories
                    <input type="number" value={nut.calories}
                      onChange={e => setNut({ ...nut, calories: Number(e.target.value) })}/>
                  </label>
                  <label>Protein (g)
                    <input type="number" value={nut.protein}
                      onChange={e => setNut({ ...nut, protein: Number(e.target.value) })}/>
                  </label>
                  <label>Carbs (g)
                    <input type="number" value={nut.carbs}
                      onChange={e => setNut({ ...nut, carbs: Number(e.target.value) })}/>
                  </label>
                  <label>Fat (g)
                    <input type="number" value={nut.fat}
                      onChange={e => setNut({ ...nut, fat: Number(e.target.value) })}/>
                  </label>

                  <label>Health label
                    <select value={nut.ratingFlag}
                      onChange={e => setNut({ ...nut, ratingFlag: e.target.value })}>
                      <option value="weight-loss">Green — Weight loss friendly</option>
                      <option value="neutral">Yellow — Neutral</option>
                      <option value="weight-gain">Red — Weight gain tendency</option>
                    </select>
                  </label>
                </div>

                <div className="chart">
                  <MacroPie protein={chartData.protein} carbs={chartData.carbs} fat={chartData.fat} />
                  <small>Pie shows Carbs / Protein / Fat. Calories per portion: {nut.calories}</small>
                </div>

                <div className="vitamins">
                  <h4>Vitamins & Minerals</h4>
                  {(nut.vitamins || []).map((v, i) => (
                    <div key={i} className="row">
                      <input placeholder="Name" value={v.name || ''}
                        onChange={e => {
                          const arr = [...(nut.vitamins || [])];
                          arr[i] = { ...arr[i], name: e.target.value };
                          setNut({ ...nut, vitamins: arr });
                        }}/>
                      <input placeholder="Amount (e.g., 12 mg)" value={v.amount || ''}
                        onChange={e => {
                          const arr = [...(nut.vitamins || [])];
                          arr[i] = { ...arr[i], amount: e.target.value };
                          setNut({ ...nut, vitamins: arr });
                        }}/>
                      <button onClick={() => {
                        const arr = [...(nut.vitamins || [])];
                        arr.splice(i, 1);
                        setNut({ ...nut, vitamins: arr });
                      }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() =>
                    setNut({ ...nut, vitamins: [ ...(nut.vitamins || []), { name: '', amount: '' } ] })
                  }>
                    + Add vitamin
                  </button>
                </div>

                <div className="benefits">
                  <h4>Ingredient Benefits</h4>
                  <textarea
                    rows={4}
                    placeholder="One per line, e.g., Goraka – good for digestion"
                    value={(nut.benefits || []).join('\n')}
                    onChange={e =>
                      setNut({ ...nut, benefits: e.target.value.split('\n').filter(Boolean) })
                    }
                  />
                </div>

                <div className="actions">
                  <button onClick={saveNutrition}>Save Nutrition</button>
                </div>
              </section>

              <section className="tags">
                <h4>Tags</h4>
                <div className="pill-row">
                  {(selected.tags || []).map(t => (
                    <span className="pill" key={t} onClick={() => removeTag(t)} title="Click to remove">
                      {t} ×
                    </span>
                  ))}
                  {!selected.tags?.length && <span className="muted">No tags</span>}
                </div>
                <div className="add">
                  <input
                    placeholder="Comma separated (Vegan, Low Carb, Diabetic Friendly)"
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                  />
                  <button onClick={addTags}>Add</button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {/* Dietician Inbox (reply to visitors) */}
      <StaffChat role="dietician" />
    </div>
  );
}

/* ---------- Inline donut chart  ---------- */
function MacroPie({ protein = 0, carbs = 0, fat = 0, size = 160, stroke = 18 }) {
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Macro pie chart">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#f0f0f0" strokeWidth={stroke} />
        <circle cx={center} cy={center} r={radius} fill="none"
          stroke="#f59e0b" strokeWidth={stroke}
          strokeDasharray={`${sCarbs} ${c - sCarbs}`} strokeDashoffset={oCarbs}
          transform={`rotate(-90 ${center} ${center})`}
        />
        <circle cx={center} cy={center} r={radius} fill="none"
          stroke="#3b82f6" strokeWidth={stroke}
          strokeDasharray={`${sProtein} ${c - sProtein}`} strokeDashoffset={oProtein}
          transform={`rotate(-90 ${center} ${center})`}
        />
        <circle cx={center} cy={center} r={radius} fill="none"
          stroke="#ef4444" strokeWidth={stroke}
          strokeDasharray={`${sFat} ${c - sFat}`} strokeDashoffset={oFat}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>

      <div>
        <div><b>Carbs:</b> {Math.round(pCarbs * 100)}%</div>
        <div><b>Protein:</b> {Math.round(pProtein * 100)}%</div>
        <div><b>Fat:</b> {Math.round(pFat * 100)}%</div>
      </div>
    </div>
  );
}

/* ----------------------staff inbox component ---------------------- */
function StaffChat({ role }) { 
  const API_BASE = process.env.REACT_APP_API_URL || '';
  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socketRef = useRef(null);
  const scroller = useRef(null);
  
const REST_BASE  = process.env.REACT_APP_API_URL || '';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';


if (!socketRef.current) {
  socketRef.current = io(SOCKET_URL, {
    transports: ['websocket'],
    withCredentials: true
  });
}


  const loadConvos = async () => {
    const res = await fetch(`${API_BASE}/api/chat/conversations?role=${role}`);
    const data = await res.json();
    setConvos(Array.isArray(data) ? data : []);
  };

  const loadHistory = async (conversationId) => {
    const res = await fetch(`${API_BASE}/api/chat/history/${conversationId}`);
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
    setTimeout(() => scroller.current?.scrollTo(0, 999999), 50);
  };

  useEffect(() => { loadConvos(); }, []);

  useEffect(() => {
    if (!active) return;
    (async () => {
      await loadHistory(active);
      if (!socketRef.current) {
        socketRef.current = io(API_BASE || '/', { transports: ['websocket'] });
      }
      socketRef.current.emit('join', { conversationId: active });
      socketRef.current.off('message');
      socketRef.current.on('message', (msg) => {
        if (msg.conversation === active) {
          setMessages((m) => [...m, msg]);
          setTimeout(() => scroller.current?.scrollTo(0, 999999), 50);
        }
      });
    })();
  }, [active]); 

  const send = () => {
    if (!text.trim() || !active) return;
    socketRef.current?.emit('message', {
      conversationId: active,
      text,
      senderRole: role,
    });
    setText('');
  };

  return (
    <div style={{ marginTop: '1rem', border: '1px solid #eee', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '.6rem .8rem', fontWeight: 800, background: '#fff7ee', borderBottom: '1px solid #f2e3d5' }}>
        {role === 'dietician' ? 'Dietician Inbox' : 'Head Chef Inbox'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr' }}>
        <aside style={{ borderRight: '1px solid #eee', maxHeight: 320, overflow: 'auto' }}>
          {convos.map(c => (
            <div key={c._id}
                 style={{ padding: '.5rem .7rem', cursor: 'pointer', background: active === c._id ? '#eef6ff' : '#fff' }}
                 onClick={() => setActive(c._id)}>
              <div style={{ fontWeight: 600 }}>{c?.visitor?.name || 'Visitor'}</div>
              <div style={{ color: '#666', fontSize: 12 }}>{new Date(c.updatedAt).toLocaleString()}</div>
            </div>
          ))}
          {!convos.length && <div style={{ padding: '.6rem', color: '#666' }}>No conversations yet.</div>}
        </aside>

        <main style={{ display: 'flex', flexDirection: 'column' }}>
          <div ref={scroller} style={{ height: 260, overflow: 'auto', padding: '.6rem', background: '#fbfbfb' }}>
            {messages.map(m => (
              <div key={m._id}
                   style={{
                     maxWidth: '75%', margin: '.35rem 0', padding: '.45rem .6rem',
                     borderRadius: 12,
                     background: m.senderRole === role ? '#111' : '#fff',
                     color: m.senderRole === role ? '#fff' : '#111',
                     border: m.senderRole === role ? '1px solid #111' : '1px solid #eee',
                     marginLeft: m.senderRole === role ? 'auto' : 0
                   }}>
                <div>{m.text}</div>
                <div style={{ fontSize: 11, opacity: .7, marginTop: 2 }}>
                  {new Date(m.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {!messages.length && <div style={{ color: '#666' }}>Pick a conversation on the left.</div>}
          </div>

          <div style={{ display: 'flex', gap: 8, padding: 8, borderTop: '1px solid #eee' }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Type a message…"
              style={{ flex: 1, border: '1px solid #ddd', borderRadius: 10, padding: '.5rem .6rem' }}
            />
            <button onClick={send} style={{ border: 'none', background: '#111', color: '#fff', borderRadius: 10, padding: '.5rem .8rem' }}>
              Send
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
