// client/src/components/dashboards/VisitorDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './VisitorDashboard.css';
import Chat from '../Chat';
import CookbookPanel from '../CookbookPanel';

// Constants
const API_BASE = process.env.REACT_APP_API_URL || '';
const CATEGORIES = ['Main Course', 'Snack', 'Dessert', 'Beverage'];
const SPICE_LEVELS = ['Mild', 'Medium', 'Spicy'];
const DIET_TYPES = ['Vegan', 'Vegetarian', 'Non-Vegetarian'];

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusLower = (status || '').toLowerCase();
  const getStatusConfig = () => {
    switch (statusLower) {
      case 'approved':
        return { label: 'Approved', className: 'status-approved' };
      case 'rejected':
        return { label: 'Rejected', className: 'status-rejected' };
      default:
        return { label: 'Pending', className: 'status-pending' };
    }
  };
  
  const { label, className } = getStatusConfig();
  
  return (
    <span className={`status-badge ${className}`} title={`Status: ${label}`}>
      {label}
    </span>
  );
};

// Main Component
const VisitorDashboard = () => {
  const [myRecipes, setMyRecipes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
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

  // Fetch user's submitted recipes
  const fetchMyRecipes = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/api/visitor/my-recipes`, authHeader);
      setMyRecipes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch recipes:', err?.response?.data || err.message);
      showNotification('Failed to load your recipes', 'error');
    }
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // Handle recipe image upload
  const handleRecipeImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Image size should be less than 5MB', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => setNewRecipe((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  // Submit new recipe
  const submitRecipe = async (e) => {
    e.preventDefault();
    
    if (!token) {
      showNotification('Please log in to submit a recipe', 'error');
      return;
    }
    
    if (!newRecipe.category || !newRecipe.spiceLevel || !newRecipe.dietType) {
      showNotification('Please select Category, Spice Level, and Diet Type', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      await axios.post(`${API_BASE}/api/visitor/submit-recipe`, newRecipe, authHeader);
      
      showNotification('Recipe submitted for approval!', 'success');
      
      // Reset form
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
      showNotification(err?.response?.data?.error || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRecipe(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchMyRecipes();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`toast-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <h2>Welcome, Visitor</h2>

      {/* My Cookbook Section */}
      <section className="cookbook-section">
        <h3>My Cookbook</h3>
        <CookbookPanel />
      </section>

      {/* Submit Recipe Section */}
      <section>
        <h3>Share Your Recipe</h3>
        <p className="section-subtitle">
          Share your culinary creations with our community. Your recipe will be reviewed by our head chef.
        </p>
        
        <form onSubmit={submitRecipe} className="form-block">
          <div className="form-group">
            <label htmlFor="recipeName">Recipe Name *</label>
            <input
              id="recipeName"
              name="name"
              type="text"
              placeholder="e.g., Grandma's Special Curry"
              required
              value={newRecipe.name}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={newRecipe.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="spiceLevel">Spice Level *</label>
              <select
                id="spiceLevel"
                name="spiceLevel"
                value={newRecipe.spiceLevel}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Spice Level</option>
                {SPICE_LEVELS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dietType">Diet Type *</label>
              <select
                id="dietType"
                name="dietType"
                value={newRecipe.dietType}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Diet Type</option>
                {DIET_TYPES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ingredients">Ingredients *</label>
            <textarea
              id="ingredients"
              name="ingredients"
              placeholder="List all ingredients with quantities..."
              rows={4}
              required
              value={newRecipe.ingredients}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="instructions">Instructions *</label>
            <textarea
              id="instructions"
              name="instructions"
              placeholder="Step by step cooking instructions..."
              rows={5}
              required
              value={newRecipe.instructions}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="culture">Cultural Origin (Optional)</label>
            <input
              id="culture"
              name="culture"
              type="text"
              placeholder="e.g., Sri Lankan, Italian, Thai"
              value={newRecipe.culture}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="recipeImage">Recipe Image (Optional)</label>
            <input
              id="recipeImage"
              type="file"
              accept="image/*"
              onChange={handleRecipeImage}
              className="file-input"
            />
            {newRecipe.image && (
              <div className="image-preview">
                <img src={newRecipe.image} alt="Recipe preview" />
                <button
                  type="button"
                  className="remove-image"
                  onClick={() => setNewRecipe(prev => ({ ...prev, image: '' }))}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} className="submit-btn">
            {submitting ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </form>
      </section>

      {/* My Submitted Recipes Section */}
      <section>
        <h3>My Submitted Recipes</h3>
        {myRecipes.length === 0 ? (
          <div className="empty-state">
            <p>You haven't submitted any recipes yet.</p>
            <p className="empty-state-hint">Share your first recipe using the form above!</p>
          </div>
        ) : (
          <div className="recipes-grid">
            {myRecipes.map((recipe) => {
              const status = recipe.status || 
                (typeof recipe.approved === 'boolean' ? (recipe.approved ? 'approved' : 'pending') : 'pending');
              
              return (
                <div key={recipe._id} className="recipe-card">
                  <div className="recipe-card-content">
                    <div className="recipe-header">
                      <Link to={`/recipes/${recipe._id}`} className="recipe-title">
                        {recipe.name}
                      </Link>
                      <StatusBadge status={status} />
                    </div>
                    
                    <div className="recipe-meta">
                      {recipe.category && <span className="meta-tag">{recipe.category}</span>}
                      {recipe.spiceLevel && <span className="meta-tag">{recipe.spiceLevel}</span>}
                      {recipe.dietType && <span className="meta-tag">{recipe.dietType}</span>}
                      {recipe.culture && <span className="meta-tag culture">{recipe.culture}</span>}
                    </div>
                    
                    {recipe.ingredients && (
                      <div className="recipe-preview">
                        {recipe.ingredients.split('\n').slice(0, 2).map((line, idx) => (
                          <p key={idx} className="preview-text">{line}</p>
                        ))}
                        {recipe.ingredients.split('\n').length > 2 && (
                          <span className="more-indicator">...</span>
                        )}
                      </div>
                    )}
                    
                    <Link to={`/recipes/${recipe._id}`} className="view-link">
                      View Recipe →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Western Twist Tool Section */}
      <section className="twist-section">
        <h3>Feeling Creative?</h3>
        <p className="section-subtitle">
          Try our Western Twist Tool to transform traditional recipes with a modern twist!
        </p>
        <Link to="/twist-tool" className="twist-tool-link">
          <button className="btn-primary">🎨 Try Western Twist Tool</button>
        </Link>
      </section>

      {/* Chat Widget */}
      <Chat />
    </div>
  );
};

export default VisitorDashboard;