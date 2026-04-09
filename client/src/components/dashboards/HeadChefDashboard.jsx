import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './HeadChefDashboard.css';

// ✅ FIX 1: Define base URL once at the top
const API_BASE = process.env.REACT_APP_API_URL || '';

const HeadChefDashboard = () => {
  const [recipes, setRecipes] = useState([]);
  const [pendingRecipes, setPendingRecipes] = useState([]);
  const [pendingTwists, setPendingTwists] = useState([]);
  const [stories, setStories] = useState([]);

  const [story, setStory] = useState({ title: '', content: '', image: '' });
  const [editStoryId, setEditStoryId] = useState(null);

  const [newRecipe, setNewRecipe] = useState({
    name: '',
    ingredients: '',
    instructions: '',
    culture: '',
    image: '',
    category: '',
    spiceLevel: '',
    dietType: '',
  });
  const [editRecipeId, setEditRecipeId] = useState(null);

  const token = localStorage.getItem('token') || '';
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  /* ---------------- Fetchers ---------------- */
  const fetchRecipes = async () => {
    try {
      // ✅ FIX 2: Use API_BASE prefix on all axios calls
      const res = await axios.get(`${API_BASE}/api/recipes/all`, authHeader);
      setRecipes(res.data || []);
    } catch (err) {
      console.error('Error fetching recipes:', err);
    }
  };

  const fetchPendingRecipes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/headchef/pending-recipes`, authHeader);
      setPendingRecipes(res.data || []);
    } catch (err) {
      console.error('Error fetching pending recipes:', err);
    }
  };

  const fetchStories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/stories`);
      setStories(res.data || []);
    } catch (err) {
      console.error('Error fetching stories:', err);
    }
  };

  const fetchPendingTwists = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/headchef/pending-twists`, authHeader);
      setPendingTwists(res.data || []);
    } catch (err) {
      console.error('Error fetching pending twists:', err);
    }
  };

  /* ---------------- File inputs ---------------- */
  const handleRecipeImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setNewRecipe((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleStoryImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setStory((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  /* ---------------- Recipe CRUD ---------------- */
  const handleRecipeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editRecipeId) {
        await axios.put(`${API_BASE}/api/recipes/${editRecipeId}`, newRecipe, authHeader);
      } else {
        await axios.post(
          `${API_BASE}/api/recipes`,
          { ...newRecipe, status: 'approved', approved: true },
          authHeader
        );
      }

      setNewRecipe({
        name: '',
        ingredients: '',
        instructions: '',
        culture: '',
        image: '',
        category: '',
        spiceLevel: '',
        dietType: '',
      });
      setEditRecipeId(null);
      fetchRecipes();
    } catch (err) {
      console.error('Recipe save error:', err);
      alert('Failed to save recipe.');
    }
  };

  const handleEditRecipe = (recipe) => {
    setNewRecipe({
      name: recipe.name || '',
      ingredients: recipe.ingredients || '',
      instructions: recipe.instructions || '',
      culture: recipe.culture || '',
      image: recipe.image || '',
      category: recipe.category || '',
      spiceLevel: recipe.spiceLevel || '',
      dietType: recipe.dietType || '',
    });
    setEditRecipeId(recipe._id);
  };

  const handleDeleteRecipe = async (id) => {
    if (!window.confirm('Delete this recipe?')) return;
    try {
      await axios.delete(`${API_BASE}/api/recipes/${id}`, authHeader);
      fetchRecipes();
      fetchPendingRecipes();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete recipe.');
    }
  };

  /* ---------------- Story CRUD ---------------- */
  const handleStorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editStoryId) {
        await axios.put(`${API_BASE}/api/stories/${editStoryId}`, story, authHeader);
      } else {
        await axios.post(`${API_BASE}/api/stories`, story, authHeader);
      }
      setStory({ title: '', content: '', image: '' });
      setEditStoryId(null);
      fetchStories();
    } catch (err) {
      console.error('Story error:', err);
      alert('Failed to save story.');
    }
  };

  const handleEditStory = (s) => {
    setStory({
      title: s.title || '',
      content: s.content || '',
      image: s.image || '',
    });
    setEditStoryId(s._id);
  };

  const handleDeleteStory = async (id) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await axios.delete(`${API_BASE}/api/stories/${id}`, authHeader);
      fetchStories();
    } catch (err) {
      console.error('Delete story error:', err);
      alert('Failed to delete story.');
    }
  };

  /* ---------------- Pending visitor recipes ---------------- */
  const approveRecipe = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/headchef/approve-recipe/${id}`, {}, authHeader);
      await Promise.all([fetchPendingRecipes(), fetchRecipes()]);
    } catch (err) {
      console.error('Approve failed:', err);
      alert('Failed to approve recipe.');
    }
  };

  const rejectRecipe = async (id) => {
    if (!window.confirm('Reject this recipe?')) return;
    try {
      await axios.put(`${API_BASE}/api/headchef/reject-recipe/${id}`, {}, authHeader);
      fetchPendingRecipes();
      fetchRecipes();
    } catch (err) {
      console.error('Reject failed:', err);
      alert('Failed to reject recipe.');
    }
  };

  /* ---------------- Twists moderation ---------------- */
  const approveTwist = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/headchef/approve-twist/${id}`, {}, authHeader);
      fetchPendingTwists();
    } catch (err) {
      console.error('Approve twist failed:', err);
      alert('Failed to approve twist.');
    }
  };

  const rejectTwist = async (id) => {
    if (!window.confirm('Reject this twisted recipe?')) return;
    try {
      await axios.put(`${API_BASE}/api/headchef/reject-twist/${id}`, {}, authHeader);
      fetchPendingTwists();
    } catch (err) {
      console.error('Reject twist failed:', err);
      alert('Failed to reject twist.');
    }
  };

  useEffect(() => {
    fetchRecipes();
    fetchPendingRecipes();
    fetchStories();
    fetchPendingTwists();
  }, []);

  return (
    <div className="dashboard-container">
      <h2>Head Chef Dashboard</h2>

      {/* Add / Edit Recipe */}
      <section>
        <h3>{editRecipeId ? 'Edit Recipe' : 'Add New Recipe'}</h3>
        <form onSubmit={handleRecipeSubmit} className="form-block">
          <input
            type="text"
            placeholder="Recipe Name"
            value={newRecipe.name}
            onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
            required
          />
          <textarea
            placeholder="Ingredients"
            value={newRecipe.ingredients}
            onChange={(e) => setNewRecipe({ ...newRecipe, ingredients: e.target.value })}
            required
          />
          <textarea
            placeholder="Instructions"
            value={newRecipe.instructions}
            onChange={(e) => setNewRecipe({ ...newRecipe, instructions: e.target.value })}
            required
          />
          <select
            value={newRecipe.category}
            onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value })}
            required
          >
            <option value="">Select Category</option>
            <option>Main Course</option>
            <option>Snack</option>
            <option>Dessert</option>
            <option>Beverage</option>
          </select>
          <select
            value={newRecipe.spiceLevel}
            onChange={(e) => setNewRecipe({ ...newRecipe, spiceLevel: e.target.value })}
            required
          >
            <option value="">Select Spice Level</option>
            <option>Mild</option>
            <option>Medium</option>
            <option>Spicy</option>
          </select>
          <select
            value={newRecipe.dietType}
            onChange={(e) => setNewRecipe({ ...newRecipe, dietType: e.target.value })}
            required
          >
            <option value="">Select Diet Type</option>
            <option>Vegan</option>
            <option>Vegetarian</option>
            <option>Non-Vegetarian</option>
          </select>
          <input
            type="text"
            placeholder="Cultural Origin"
            value={newRecipe.culture}
            onChange={(e) => setNewRecipe({ ...newRecipe, culture: e.target.value })}
          />
          <input type="file" accept="image/*" onChange={handleRecipeImage} />
          {newRecipe.image && <img src={newRecipe.image} alt="Preview" width="150" />}
          <button type="submit">{editRecipeId ? 'Update Recipe' : 'Create Recipe'}</button>
        </form>
      </section>

      {/* Recipe List */}
      <section>
        <h3>Recipe List</h3>
        {recipes.length === 0 ? (
          <p>No recipes added yet.</p>
        ) : (
          <ul>
            {recipes.map((recipe) => (
              <li key={recipe._id}>
                <strong>{recipe.name}</strong> ({recipe.culture || 'Unknown'})
                {recipe.isTwist && <span className="pill" style={{ marginLeft: 6 }}>Twisted</span>}
                {!recipe.approved && ' • Pending'}
                <br />
                <button onClick={() => handleEditRecipe(recipe)}>Edit</button>
                <button onClick={() => handleDeleteRecipe(recipe._id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pending Visitor Recipes */}
      <section>
        <h3>Pending Visitor Recipes</h3>
        {pendingRecipes.length === 0 ? (
          <p>No pending recipes to review.</p>
        ) : (
          <ul>
            {pendingRecipes.map((r) => (
              <li key={r._id}>
                <strong>{r.name}</strong>{' '}
                — submitted by {r.submittedBy?.name || r.createdBy?.name || 'Visitor'}
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => approveRecipe(r._id)}>Approve</button>
                  <button onClick={() => rejectRecipe(r._id)} style={{ marginLeft: 8 }}>
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Western Twist Submissions */}
      <section>
        <h3>Western Twist Submissions</h3>
        {pendingTwists.length === 0 ? (
          <p>No pending twists to review.</p>
        ) : (
          <ul>
            {pendingTwists.map((t) => (
              <li key={t._id} style={{ marginBottom: 10 }}>
                <strong>{t.name}</strong>
                {t.parentRecipe?.name && (
                  <span style={{ marginLeft: 8, color: '#666' }}>
                    (from: {t.parentRecipe.name})
                  </span>
                )}
                <div style={{ marginTop: 6, fontSize: 13, color: '#555' }}>
                  {Array.isArray(t.substitutions) && t.substitutions.length > 0 ? (
                    <span>
                      Subs:&nbsp;
                      {t.substitutions.map((s, i) => (
                        <span key={i}>
                          {s.from} → <b>{s.to}</b>{i < t.substitutions.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <em>No substitutions listed</em>
                  )}
                </div>
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => approveTwist(t._id)}>Approve</button>
                  <button onClick={() => rejectTwist(t._id)} style={{ marginLeft: 8 }}>
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Cultural Stories CRUD */}
      <section>
        <h3>{editStoryId ? 'Edit Cultural Story' : 'Submit Cultural Story'}</h3>
        <form onSubmit={handleStorySubmit} className="form-block">
          <input
            type="text"
            placeholder="Story Title"
            value={story.title}
            onChange={(e) => setStory({ ...story, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Story Content"
            value={story.content}
            onChange={(e) => setStory({ ...story, content: e.target.value })}
            required
          />
          <input type="file" accept="image/*" onChange={handleStoryImage} />
          {story.image && <img src={story.image} alt="Story" width="150" />}
          <button type="submit">{editStoryId ? 'Update Story' : 'Submit Story'}</button>
        </form>

        <h4>Story List</h4>
        {stories.length === 0 ? (
          <p>No stories yet.</p>
        ) : (
          <ul>
            {stories.map((s) => (
              <li key={s._id}>
                <strong>{s.title}</strong>
                <button onClick={() => handleEditStory(s)}>Edit</button>
                <button onClick={() => handleDeleteStory(s._id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Head Chef Inbox (reply to visitors) */}
      <StaffChat role="headchef" />
    </div>
  );
};

export default HeadChefDashboard;

/* ----------------------- Minimal staff inbox component ---------------------- */
function StaffChat({ role }) {
  // ✅ FIX 3: Use API_BASE for REST, and correctly read env var for socket (not a string literal)
  const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socketRef = useRef(null);
  const scroller = useRef(null);

  const loadConvos = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/conversations?role=${role}`);
      const data = await res.json();
      setConvos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadHistory = async (conversationId) => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/history/${conversationId}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
      setTimeout(() => scroller.current?.scrollTo(0, 999999), 50);
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  useEffect(() => { loadConvos(); }, []);

  // ✅ FIX 4: Socket now connects to correct Render URL, not localhost
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket'],
        withCredentials: true
      });
    }
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [SOCKET_URL]);

  useEffect(() => {
    if (!active || !socketRef.current) return;
    (async () => {
      await loadHistory(active);
      socketRef.current.emit('join', { conversationId: active });

      const onMsg = (msg) => {
        if (msg.conversation === active) {
          setMessages((m) => [...m, msg]);
          setTimeout(() => scroller.current?.scrollTo(0, 999999), 50);
        }
      };

      socketRef.current.off('message');
      socketRef.current.on('message', onMsg);
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