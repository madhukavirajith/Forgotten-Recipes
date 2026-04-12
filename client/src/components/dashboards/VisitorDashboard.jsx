// client/src/components/dashboards/VisitorDashboard.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './VisitorDashboard.css';
import Chat from '../Chat';
import CookbookPanel from '../CookbookPanel';

// Import icons
import { 
  FaUtensils, 
  FaBook, 
  FaMagic, 
  FaHeart, 
  FaStar, 
  FaClock, 
  FaFire, 
  FaLeaf, 
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaArrowRight,
  FaPlus,
  FaTrash,
  FaEdit,
  FaEye,
  FaThumbsUp,
  FaShare,
  FaBookmark,
  FaChartLine,
  FaCalendarAlt,
  FaTag,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaUpload,
  FaImage
} from 'react-icons/fa';

// Constants
const API_BASE = process.env.REACT_APP_API_URL || '';
const CATEGORIES = ['Main Course', 'Snack', 'Dessert', 'Beverage', 'Soup', 'Salad', 'Bread'];
const SPICE_LEVELS = ['Mild', 'Medium', 'Spicy', 'Extra Spicy'];
const DIET_TYPES = ['Vegan', 'Vegetarian', 'Non-Vegetarian', 'Gluten-Free', 'Keto'];

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusLower = (status || '').toLowerCase();
  const getStatusConfig = () => {
    switch (statusLower) {
      case 'approved':
        return { label: 'Approved', className: 'status-approved', icon: <FaCheckCircle /> };
      case 'rejected':
        return { label: 'Rejected', className: 'status-rejected', icon: <FaExclamationCircle /> };
      default:
        return { label: 'Pending', className: 'status-pending', icon: <FaClock /> };
    }
  };
  
  const { label, className, icon } = getStatusConfig();
  
  return (
    <span className={`status-badge ${className}`} title={`Status: ${label}`}>
      {icon} {label}
    </span>
  );
};

// Main Component
const VisitorDashboard = () => {
  const [myRecipes, setMyRecipes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [activeTab, setActiveTab] = useState('submit'); // submit, myrecipes, stats
  const [stats, setStats] = useState({
    totalSubmitted: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    ingredients: '',
    instructions: '',
    image: '',
    culture: '',
    category: '',
    spiceLevel: '',
    dietType: '',
    prepTime: '',
    cookTime: '',
    servings: ''
  });

  const token = localStorage.getItem('token');
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
  const fileInputRef = useRef(null);

  // Fetch user's submitted recipes
  const fetchMyRecipes = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/visitor/my-recipes`, authHeader);
      const recipes = Array.isArray(res.data) ? res.data : [];
      setMyRecipes(recipes);
      
      // Calculate stats
      const approved = recipes.filter(r => r.status === 'approved' || r.approved === true).length;
      const pending = recipes.filter(r => r.status === 'pending' || (!r.status && r.approved !== true)).length;
      const rejected = recipes.filter(r => r.status === 'rejected').length;
      
      setStats({
        totalSubmitted: recipes.length,
        approved,
        pending,
        rejected
      });
    } catch (err) {
      console.error('Failed to fetch recipes:', err?.response?.data || err.message);
      showNotification('Failed to load your recipes', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, authHeader]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // Handle recipe image upload
  const handleRecipeImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
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
      
      setNewRecipe({
        name: '',
        ingredients: '',
        instructions: '',
        image: '',
        culture: '',
        category: '',
        spiceLevel: '',
        dietType: '',
        prepTime: '',
        cookTime: '',
        servings: ''
      });
      
      fetchMyRecipes();
      setActiveTab('myrecipes');
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

  // Delete recipe
  const deleteRecipe = async (recipeId) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;
    try {
      await axios.delete(`${API_BASE}/api/visitor/recipes/${recipeId}`, authHeader);
      showNotification('Recipe deleted successfully', 'success');
      fetchMyRecipes();
    } catch (err) {
      showNotification('Failed to delete recipe', 'error');
    }
  };

  useEffect(() => {
    fetchMyRecipes();
  }, [fetchMyRecipes]);

  // Stats cards data
  const statCards = [
    { label: 'Total Submitted', value: stats.totalSubmitted, icon: <FaUtensils />, color: '#5A2E17' },
    { label: 'Approved', value: stats.approved, icon: <FaCheckCircle />, color: '#10b981' },
    { label: 'Pending', value: stats.pending, icon: <FaClock />, color: '#f59e0b' },
    { label: 'Rejected', value: stats.rejected, icon: <FaExclamationCircle />, color: '#ef4444' }
  ];

  return (
    <div className="visitor-dashboard">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`toast-notification ${notification.type}`}>
          {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <span className="title-icon">👋</span>
            Welcome, Visitor
          </h1>
          <p className="dashboard-subtitle">
            Share your culinary creations and explore the rich heritage of Sri Lankan cuisine
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        {statCards.map((card, index) => (
          <div key={index} className="stat-card" style={{ borderBottomColor: card.color }}>
            <div className="stat-icon" style={{ color: card.color }}>{card.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
          onClick={() => setActiveTab('submit')}
        >
          <FaPlus /> Submit Recipe
        </button>
        <button 
          className={`tab-btn ${activeTab === 'myrecipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('myrecipes')}
        >
          <FaBook /> My Recipes
          {myRecipes.length > 0 && <span className="tab-badge">{myRecipes.length}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'cookbook' ? 'active' : ''}`}
          onClick={() => setActiveTab('cookbook')}
        >
          <FaBookmark /> My Cookbook
        </button>
      </div>

      {/* Submit Recipe Tab */}
      {activeTab === 'submit' && (
        <div className="submit-recipe-tab">
          <div className="section-card">
            <div className="section-header">
              <h3>
                <FaUtensils className="section-icon" />
                Share Your Recipe
              </h3>
              <p className="section-description">
                Share your culinary creations with our community. Your recipe will be reviewed by our head chef.
              </p>
            </div>
            
            <form onSubmit={submitRecipe} className="recipe-form">
              <div className="form-row two-col">
                <div className="form-group">
                  <label>Recipe Name <span className="required">*</span></label>
                  <input
                    name="name"
                    type="text"
                    placeholder="e.g., Grandma's Special Curry"
                    required
                    value={newRecipe.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Cultural Origin</label>
                  <input
                    name="culture"
                    type="text"
                    placeholder="e.g., Sri Lankan, Italian, Thai"
                    value={newRecipe.culture}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row three-col">
                <div className="form-group">
                  <label>Category <span className="required">*</span></label>
                  <select
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
                  <label>Spice Level <span className="required">*</span></label>
                  <select
                    name="spiceLevel"
                    value={newRecipe.spiceLevel}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Spice Level</option>
                    {SPICE_LEVELS.map((s) => (
                      <option key={s} value={s}>
                        {s} {s === 'Mild' ? '🌶️' : s === 'Medium' ? '🌶️🌶️' : s === 'Spicy' ? '🌶️🌶️🌶️' : '🌶️🌶️🌶️🌶️'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Diet Type <span className="required">*</span></label>
                  <select
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

              <div className="form-row three-col">
                <div className="form-group">
                  <label>Prep Time (minutes)</label>
                  <input
                    name="prepTime"
                    type="number"
                    placeholder="e.g., 15"
                    value={newRecipe.prepTime}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Cook Time (minutes)</label>
                  <input
                    name="cookTime"
                    type="number"
                    placeholder="e.g., 30"
                    value={newRecipe.cookTime}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Servings</label>
                  <input
                    name="servings"
                    type="number"
                    placeholder="e.g., 4"
                    value={newRecipe.servings}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Ingredients <span className="required">*</span></label>
                <textarea
                  name="ingredients"
                  placeholder="List all ingredients with quantities..."
                  rows={5}
                  required
                  value={newRecipe.ingredients}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Instructions <span className="required">*</span></label>
                <textarea
                  name="instructions"
                  placeholder="Step by step cooking instructions..."
                  rows={6}
                  required
                  value={newRecipe.instructions}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Recipe Image</label>
                <div className="image-upload-area" onClick={() => fileInputRef.current?.click()}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleRecipeImage}
                    style={{ display: 'none' }}
                  />
                  {newRecipe.image ? (
                    <div className="image-preview">
                      <img src={newRecipe.image} alt="Recipe preview" />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewRecipe(prev => ({ ...prev, image: '' }));
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FaImage />
                      <span>Click to upload image</span>
                      <small>PNG, JPG up to 5MB</small>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" disabled={submitting} className="submit-btn">
                {submitting ? <FaSpinner className="spinning" /> : <FaArrowRight />}
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* My Recipes Tab */}
      {activeTab === 'myrecipes' && (
        <div className="my-recipes-tab">
          <div className="section-card">
            <div className="section-header">
              <h3>
                <FaBook className="section-icon" />
                My Submitted Recipes
              </h3>
              <p className="section-description">
                Track the status of your recipe submissions
              </p>
            </div>

            {loading ? (
              <div className="loading-state">
                <FaSpinner className="spinning" />
                <p>Loading your recipes...</p>
              </div>
            ) : myRecipes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h4>No recipes submitted yet</h4>
                <p>Share your first recipe using the submission form!</p>
                <button onClick={() => setActiveTab('submit')} className="empty-action-btn">
                  Submit a Recipe <FaArrowRight />
                </button>
              </div>
            ) : (
              <div className="recipes-list">
                {myRecipes.map((recipe, index) => {
                  const status = recipe.status || 
                    (typeof recipe.approved === 'boolean' ? (recipe.approved ? 'approved' : 'pending') : 'pending');
                  
                  return (
                    <div key={recipe._id} className="recipe-item" style={{ animationDelay: `${index * 0.05}s` }}>
                      <div className="recipe-item-image">
                        {recipe.image ? (
                          <img src={recipe.image} alt={recipe.name} />
                        ) : (
                          <div className="image-placeholder"><FaUtensils /></div>
                        )}
                      </div>
                      <div className="recipe-item-info">
                        <div className="recipe-item-header">
                          <Link to={`/recipes/${recipe._id}`} className="recipe-item-title">
                            {recipe.name}
                          </Link>
                          <StatusBadge status={status} />
                        </div>
                        
                        <div className="recipe-item-meta">
                          {recipe.category && <span className="meta-badge">{recipe.category}</span>}
                          {recipe.spiceLevel && <span className="meta-badge spice">{recipe.spiceLevel}</span>}
                          {recipe.dietType && <span className="meta-badge diet">{recipe.dietType}</span>}
                          {recipe.culture && <span className="meta-badge culture">{recipe.culture}</span>}
                        </div>
                        
                        <div className="recipe-item-actions">
                          <Link to={`/recipes/${recipe._id}`} className="action-link view">
                            <FaEye /> View Recipe
                          </Link>
                          <button onClick={() => deleteRecipe(recipe._id)} className="action-link delete">
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cookbook Tab */}
      {activeTab === 'cookbook' && (
        <div className="cookbook-tab">
          <div className="section-card">
            <div className="section-header">
              <h3>
                <FaBookmark className="section-icon" />
                My Cookbook
              </h3>
              <p className="section-description">
                Your saved favorite recipes
              </p>
            </div>
            <CookbookPanel />
          </div>
        </div>
      )}

      {/* Western Twist Tool Section */}
      <div className="twist-tool-card">
        <div className="twist-tool-content">
          <div className="twist-tool-icon">🎨</div>
          <div className="twist-tool-info">
            <h3>Feeling Creative?</h3>
            <p>Try our Western Twist Tool to transform traditional recipes with a modern twist!</p>
          </div>
          <Link to="/twist-tool" className="twist-tool-btn">
            Try Western Twist Tool <FaArrowRight />
          </Link>
        </div>
      </div>

      {/* Tips Section */}
      <div className="tips-section">
        <h4>
          <FaInfoCircle /> Pro Tips for Getting Your Recipe Approved
        </h4>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">📸</div>
            <p>Add a clear, high-quality image of your finished dish</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">📝</div>
            <p>Include exact measurements and detailed instructions</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🏷️</div>
            <p>Select the most accurate category and diet type</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">📖</div>
            <p>Share the cultural story behind your recipe</p>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <Chat />
    </div>
  );
};

export default VisitorDashboard;