
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

import Chat from '../Chat';
import CookbookPanel from '../CookbookPanel'; 

const CATEGORIES = ['Main Course', 'Snack', 'Dessert', 'Beverage'];
const SPICE_LEVELS = ['Mild', 'Medium', 'Spicy'];
const DIET_TYPES = ['Vegan', 'Vegetarian', 'Non-Vegetarian'];

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  const color =
    s === 'approved' ? '#16a34a' :
    s === 'rejected' ? '#dc2626' :
    '#f59e0b';
  const label = s || 'pending';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '.15rem .5rem',
        borderRadius: '999px',
        fontSize: '.85rem',
        fontWeight: 700,
        color: '#fff',
        background: color,
        marginLeft: 6
      }}
      title={`Status: ${label}`}
    >
      {label}
    </span>
  );
}

export default function VisitorDashboard() {
  const [myRecipes, setMyRecipes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    ingredients: '',
    instructions: '',
    image: '',
    culture: '',
    category: '',
    spiceLevel: '',
    dietType: '',
  });

  const token = localStorage.getItem('token');
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;

  /* ----------------------------- Load submitted ----------------------------- */
  const fetchMyRecipes = async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/visitor/my-recipes', authHeader);
      setMyRecipes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch submitted recipes:', err?.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchMyRecipes();
    
  }, []);

  /* ------------------------------ Submit recipe ----------------------------- */
  const handleRecipeImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setNewRecipe((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const submitRecipe = async (e) => {
    e.preventDefault();
    if (!token) return alert('Please log in to submit a recipe.');
    if (!newRecipe.category || !newRecipe.spiceLevel || !newRecipe.dietType) {
      alert('Please choose Category, Spice Level, and Diet Type.');
      return;
    }
    try {
      setSubmitting(true);
      await axios.post('/api/visitor/submit-recipe', newRecipe, authHeader);
      alert('Recipe submitted for approval!');
      setNewRecipe({
        name: '',
        ingredients: '',
        instructions: '',
        image: '',
        culture: '',
        category: '',
        spiceLevel: '',
        dietType: '',
      });
      fetchMyRecipes();
    } catch (err) {
      console.error('Failed to submit recipe:', err?.response?.data || err.message);
      alert(err?.response?.data?.error || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------- UI ----------------------------------- */
  return (
    <div className="dashboard-container" style={{ maxWidth: 1100, margin: '0 auto', padding: '1rem' }}>
      <h2 style={{ fontWeight: 800, margin: '0.25rem 0 1rem' }}>Visitor Dashboard</h2>

      {/* ========== My Cookbook  ========== */}
      <section style={{ marginBottom: '1rem' }}>
        <CookbookPanel />
      </section>

      {/* ========== Submit Recipe ========== */}
      <section style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 800, margin: '0 0 .5rem' }}>Submit Your Recipe</h3>
        <form onSubmit={submitRecipe} className="form-block" style={{ display: 'grid', gap: '.6rem' }}>
          <input
            type="text"
            placeholder="Recipe Name"
            required
            value={newRecipe.name}
            onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
          />

          <textarea
            placeholder="Ingredients"
            rows={4}
            required
            value={newRecipe.ingredients}
            onChange={(e) => setNewRecipe({ ...newRecipe, ingredients: e.target.value })}
          />
          <textarea
            placeholder="Instructions"
            rows={5}
            required
            value={newRecipe.instructions}
            onChange={(e) => setNewRecipe({ ...newRecipe, instructions: e.target.value })}
          />

          {/* Required selects for approval flow */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.5rem' }}>
            <select
              value={newRecipe.category}
              onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={newRecipe.spiceLevel}
              onChange={(e) => setNewRecipe({ ...newRecipe, spiceLevel: e.target.value })}
              required
            >
              <option value="">Select Spice Level</option>
              {SPICE_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={newRecipe.dietType}
              onChange={(e) => setNewRecipe({ ...newRecipe, dietType: e.target.value })}
              required
            >
              <option value="">Select Diet Type</option>
              {DIET_TYPES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Cultural Origin (optional)"
            value={newRecipe.culture}
            onChange={(e) => setNewRecipe({ ...newRecipe, culture: e.target.value })}
          />

          <div>
            <input type="file" accept="image/*" onChange={handleRecipeImage} />
            {newRecipe.image && (
              <img
                src={newRecipe.image}
                alt="preview"
                width="140"
                style={{ display: 'block', marginTop: 8, borderRadius: 10, border: '1px solid #eee' }}
              />
            )}
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit for Approval'}
          </button>
        </form>
      </section>

      {/* ========== My Submitted Recipes ========== */}
      <section style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontWeight: 800, margin: '0 0 .5rem' }}>My Submitted Recipes</h3>
        {myRecipes.length === 0 ? (
          <p className="muted">No recipes submitted.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '.5rem' }}>
            {myRecipes.map((r) => {
              const status =
                r.status ||
                (typeof r.approved === 'boolean' ? (r.approved ? 'approved' : 'pending') : 'pending');
              return (
                <li
                  key={r._id}
                  style={{
                    border: '1px solid #ece7e1',
                    borderRadius: 12,
                    padding: '.65rem .75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '.5rem',
                    background: '#fff',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      <Link to={`/recipes/${r._id}`} style={{ color: '#222', textDecoration: 'none' }}>
                        {r.name}
                      </Link>
                      <StatusBadge status={status} />
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '.9rem' }}>
                      {[r.category, r.spiceLevel, r.dietType].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                  <Link to={`/recipes/${r._id}`}>
                    <button className="btn-outline" style={{ padding: '.45rem .7rem' }}>Open</button>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ========== Western Twist Tool Link ========== */}
      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 800, margin: '0 0 .5rem' }}>Try Our Western Twist Tool</h3>
        <Link to="/twist-tool">
          <button>Go to Tool</button>
        </Link>
      </section>

      {/* Floating chat widget for registered visitors */}
      <Chat />
    </div>
  );
}
