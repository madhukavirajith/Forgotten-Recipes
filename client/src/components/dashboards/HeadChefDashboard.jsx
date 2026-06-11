// client/src/components/dashboards/HeadChefDashboard.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';

import Chat from '../Chat';

// Import icons
import {
  FaUtensils,
  FaBook,
  FaScroll,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaTrash,
  FaPlus,
  FaEye,
  FaClock,
  FaFire,
  FaLeaf,
  FaSpinner,
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaImage,
  FaTag,
  FaStar,
  FaUsers,
  FaComments,
  FaBell,
  FaChartLine,
  FaCalendarAlt,
  FaInfoCircle,
  FaExclamationTriangle,
  FaThumbsUp,
  FaThumbsDown,
  FaArrowLeft,
  FaArrowRight,
  FaClipboardList,
  FaSyncAlt
} from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_URL || '';

// Status Badge Component
const StatusBadge = ({ status, type }) => {
  const getConfig = () => {
    if (type === 'recipe') {
      switch (status) {
        case 'approved': return { label: 'Approved', className: 'status-approved', icon: <FaCheckCircle /> };
        case 'rejected': return { label: 'Rejected', className: 'status-rejected', icon: <FaTimesCircle /> };
        default: return { label: 'Pending', className: 'status-pending', icon: <FaClock /> };
      }
    }
    return { label: status, className: 'status-info', icon: <FaInfoCircle /> };
  };

  const { label, className, icon } = getConfig();
  return <span className={`status-badge ${className}`}>{icon} {label}</span>;
};

// Stats Card Component
const StatCard = ({ title, value, icon, color, trend }) => (
  <div className="stat-card" style={{ borderBottomColor: color }}>
    <div className="stat-card-icon" style={{ color }}>{icon}</div>
    <div className="stat-card-info">
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-title">{title}</div>
      {trend && <div className="stat-card-trend">{trend}</div>}
    </div>
  </div>
);

const HeadChefDashboard = () => {
  const [recipes, setRecipes] = useState([]);
  const [pendingRecipes, setPendingRecipes] = useState([]);
  const [pendingTwists, setPendingTwists] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [expandedPendingId, setExpandedPendingId] = useState(null);

  const [story, setStory] = useState({ title: '', content: '', image: '' });
  const [editStoryId, setEditStoryId] = useState(null);
  const [showStoryForm, setShowStoryForm] = useState(false);

  const [newRecipe, setNewRecipe] = useState({
    name: '',
    ingredients: '',
    instructions: '',
    culture: '',
    category: '',
    spiceLevel: '',
    dietType: '',
  });
  const [recipeImages, setRecipeImages] = useState([]); // array of base64 strings
  const [editRecipeId, setEditRecipeId] = useState(null);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const recipeFileInputRef = useRef(null);

  const token = sessionStorage.getItem('token') || '';
  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRecipes(),
        fetchPendingRecipes(),
        fetchStories(),
        fetchPendingTwists()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecipes = async () => {
    try {
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

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Recipe CRUD - multi-image handler (up to 5)
  const handleRecipeImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 5 - recipeImages.length;
    if (remaining <= 0) {
      showNotification('Maximum 5 images allowed', 'error');
      return;
    }

    const toProcess = files.slice(0, remaining);
    const oversized = toProcess.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      showNotification('Each image must be under 5MB', 'error');
      return;
    }

    toProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRecipeImages(prev => prev.length < 5 ? [...prev, reader.result] : prev);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeChefRecipeImage = (index) => {
    setRecipeImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRecipeSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newRecipe,
        images: recipeImages,
        image: recipeImages[0] || newRecipe.image || '',
      };
      if (editRecipeId) {
        await axios.put(`${API_BASE}/api/recipes/${editRecipeId}`, payload, authHeader);
        showNotification('Recipe updated successfully!', 'success');
      } else {
        await axios.post(`${API_BASE}/api/recipes`, { ...payload, status: 'approved', approved: true }, authHeader);
        showNotification('Recipe created successfully!', 'success');
      }
      resetRecipeForm();
      fetchAllData();
      setShowRecipeForm(false);
    } catch (err) {
      console.error('Recipe save error:', err);
      showNotification('Failed to save recipe.', 'error');
    }
  };

  const handleEditRecipe = (recipe) => {
    setNewRecipe({
      name: recipe.name || '',
      ingredients: recipe.ingredients || '',
      instructions: recipe.instructions || '',
      culture: recipe.culture || '',
      category: recipe.category || '',
      spiceLevel: recipe.spiceLevel || '',
      dietType: recipe.dietType || '',
    });
    // Populate images: prefer the images array, fall back to single image
    const imgs = Array.isArray(recipe.images) && recipe.images.length > 0
      ? recipe.images
      : recipe.image ? [recipe.image] : [];
    setRecipeImages(imgs);
    setEditRecipeId(recipe._id);
    setShowRecipeForm(true);
  };

  const handleDeleteRecipe = async (id) => {
    if (!window.confirm('Delete this recipe?')) return;
    try {
      await axios.delete(`${API_BASE}/api/recipes/${id}`, authHeader);
      showNotification('Recipe deleted successfully!', 'success');
      fetchAllData();
    } catch (err) {
      console.error('Delete error:', err);
      showNotification('Failed to delete recipe.', 'error');
    }
  };

  const resetRecipeForm = () => {
    setNewRecipe({
      name: '',
      ingredients: '',
      instructions: '',
      culture: '',
      category: '',
      spiceLevel: '',
      dietType: '',
    });
    setRecipeImages([]);
    setEditRecipeId(null);
  };

  // Story CRUD
  const handleStoryImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setStory((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleStorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editStoryId) {
        await axios.put(`${API_BASE}/api/stories/${editStoryId}`, story, authHeader);
        showNotification('Story updated successfully!', 'success');
      } else {
        await axios.post(`${API_BASE}/api/stories`, story, authHeader);
        showNotification('Story created successfully!', 'success');
      }
      resetStoryForm();
      fetchStories();
      setShowStoryForm(false);
    } catch (err) {
      console.error('Story error:', err);
      showNotification('Failed to save story.', 'error');
    }
  };

  const handleEditStory = (s) => {
    setStory({
      title: s.title || '',
      content: s.content || '',
      image: s.image || '',
    });
    setEditStoryId(s._id);
    setShowStoryForm(true);
  };

  const handleDeleteStory = async (id) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await axios.delete(`${API_BASE}/api/stories/${id}`, authHeader);
      showNotification('Story deleted successfully!', 'success');
      fetchStories();
    } catch (err) {
      console.error('Delete story error:', err);
      showNotification('Failed to delete story.', 'error');
    }
  };

  const resetStoryForm = () => {
    setStory({ title: '', content: '', image: '' });
    setEditStoryId(null);
  };

  // Approve/Reject
  const approveRecipe = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/headchef/approve-recipe/${id}`, {}, authHeader);
      showNotification('Recipe approved successfully!', 'success');
      await fetchAllData();
    } catch (err) {
      console.error('Approve failed:', err);
      showNotification('Failed to approve recipe.', 'error');
    }
  };

  const rejectRecipe = async (id) => {
    if (!window.confirm('Reject this recipe?')) return;
    try {
      await axios.put(`${API_BASE}/api/headchef/reject-recipe/${id}`, {}, authHeader);
      showNotification('Recipe rejected.', 'info');
      await fetchAllData();
    } catch (err) {
      console.error('Reject failed:', err);
      showNotification('Failed to reject recipe.', 'error');
    }
  };

  const approveTwist = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/headchef/approve-twist/${id}`, {}, authHeader);
      showNotification('Twist approved successfully!', 'success');
      await fetchPendingTwists();
    } catch (err) {
      console.error('Approve twist failed:', err);
      showNotification('Failed to approve twist.', 'error');
    }
  };

  const rejectTwist = async (id) => {
    if (!window.confirm('Reject this twisted recipe?')) return;
    try {
      await axios.put(`${API_BASE}/api/headchef/reject-twist/${id}`, {}, authHeader);
      showNotification('Twist rejected.', 'info');
      await fetchPendingTwists();
    } catch (err) {
      console.error('Reject twist failed:', err);
      showNotification('Failed to reject twist.', 'error');
    }
  };

  // Stats
  const stats = [
    { title: 'Total Recipes', value: recipes.length, icon: <FaUtensils />, color: '#D2691E' },
    { title: 'Pending Approval', value: pendingRecipes.length, icon: <FaClock />, color: '#f59e0b' },
    { title: 'Pending Twists', value: pendingTwists.length, icon: <FaFire />, color: '#ef4444' },
    { title: 'Cultural Stories', value: stories.length, icon: <FaScroll />, color: '#10b981' }
  ];

  // Filter recipes by search
  const filteredRecipes = recipes.filter(recipe =>
    recipe.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.culture?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="headchef-dashboard">
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="headchef-dashboard">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`toast-notification ${notification.type}`}>
          {notification.type === 'success' ? <FaCheckCircle /> : notification.type === 'error' ? <FaExclamationTriangle /> : <FaInfoCircle />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            Head Chef Dashboard
          </h1>
          <p className="dashboard-subtitle">
            Manage recipes, approve submissions, and curate cultural stories
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <FaChartLine /> Overview
        </button>
        <button className={`tab-btn ${activeTab === 'recipes' ? 'active' : ''}`} onClick={() => setActiveTab('recipes')}>
          <FaUtensils /> All Recipes
        </button>
        <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          <FaClock /> Pending Approval
          {pendingRecipes.length > 0 && <span className="tab-badge">{pendingRecipes.length}</span>}
        </button>
        <button className={`tab-btn ${activeTab === 'twists' ? 'active' : ''}`} onClick={() => setActiveTab('twists')}>
          <FaFire /> Twist Submissions
          {pendingTwists.length > 0 && <span className="tab-badge">{pendingTwists.length}</span>}
        </button>
        <button className={`tab-btn ${activeTab === 'stories' ? 'active' : ''}`} onClick={() => setActiveTab('stories')}>
          <FaScroll /> Cultural Stories
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="overview-tab">
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button onClick={() => { setShowRecipeForm(true); setActiveTab('recipes'); }} className="quick-action-btn">
                <FaPlus /> Add New Recipe
              </button>
              <button onClick={() => { setShowStoryForm(true); setActiveTab('stories'); }} className="quick-action-btn">
                <FaPlus /> Add Cultural Story
              </button>
            </div>
          </div>

          <div className="recent-activity">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              {pendingRecipes.slice(0, 5).map(recipe => (
                <div key={recipe._id} className="activity-item">
                  <div className="activity-icon"><FaClipboardList /></div>
                  <div className="activity-content">
                    <strong>{recipe.name}</strong> submitted by {recipe.submittedBy?.name || 'Visitor'}
                    <div className="activity-time">Pending review</div>
                  </div>
                </div>
              ))}
              {pendingRecipes.length === 0 && (
                <div className="activity-empty">No recent activity</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recipes Tab */}
      {activeTab === 'recipes' && (
        <div className="recipes-tab">
          <div className="tab-header">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="add-btn" onClick={() => setShowRecipeForm(!showRecipeForm)}>
              <FaPlus /> {showRecipeForm ? 'Cancel' : 'Add Recipe'}
            </button>
          </div>

          {showRecipeForm && (
            <div className="form-card">
              <h3>{editRecipeId ? 'Edit Recipe' : 'Add New Recipe'}</h3>
              <form onSubmit={handleRecipeSubmit} className="recipe-form">
                <div className="form-row two-col">
                  <div className="form-group">
                    <label>Recipe Name *</label>
                    <input type="text" value={newRecipe.name} onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Cultural Origin</label>
                    <input type="text" value={newRecipe.culture} onChange={(e) => setNewRecipe({ ...newRecipe, culture: e.target.value })} />
                  </div>
                </div>
                <div className="form-row three-col">
                  <div className="form-group">
                    <label>Category *</label>
                    <select value={newRecipe.category} onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value })} required>
                      <option value="">Select Category</option>
                      <option>Main Course</option><option>Snack</option><option>Dessert</option><option>Beverage</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Spice Level *</label>
                    <select value={newRecipe.spiceLevel} onChange={(e) => setNewRecipe({ ...newRecipe, spiceLevel: e.target.value })} required>
                      <option value="">Select Spice Level</option>
                      <option>Mild</option><option>Medium</option><option>Spicy</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Diet Type *</label>
                    <select value={newRecipe.dietType} onChange={(e) => setNewRecipe({ ...newRecipe, dietType: e.target.value })} required>
                      <option value="">Select Diet Type</option>
                      <option>Vegan</option><option>Vegetarian</option><option>Non-Vegetarian</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Ingredients *</label>
                  <textarea rows={4} value={newRecipe.ingredients} onChange={(e) => setNewRecipe({ ...newRecipe, ingredients: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Instructions *</label>
                  <textarea rows={5} value={newRecipe.instructions} onChange={(e) => setNewRecipe({ ...newRecipe, instructions: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>
                    Recipe Images
                    <span style={{ fontWeight: 400, fontSize: '0.8rem', color: '#888', marginLeft: '0.5rem' }}>
                      ({recipeImages.length}/5) - First image is the main photo
                    </span>
                  </label>

                  {recipeImages.length > 0 && (
                    <div className="multi-image-preview-grid">
                      {recipeImages.map((src, idx) => (
                        <div key={idx} className="multi-image-thumb">
                          <img src={src} alt={`Recipe photo ${idx + 1}`} />
                          {idx === 0 && <span className="primary-badge">Primary</span>}
                          <button
                            type="button"
                            className="remove-image"
                            onClick={() => removeChefRecipeImage(idx)}
                            title="Remove image"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {recipeImages.length < 5 && (
                    <div className="image-upload" onClick={() => recipeFileInputRef.current?.click()}>
                      <input
                        ref={recipeFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleRecipeImages}
                        style={{ display: 'none' }}
                      />
                      <div className="upload-placeholder">
                        <FaImage /> Click to add {recipeImages.length === 0 ? 'images' : 'more images'}
                        <small style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem' }}>PNG, JPG up to 5MB each · Max 5 photos</small>
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => { resetRecipeForm(); setShowRecipeForm(false); }} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">{editRecipeId ? 'Update' : 'Create'} Recipe</button>
                </div>
              </form>
            </div>
          )}

          <div className="items-grid">
            {filteredRecipes.map(recipe => (
              <div key={recipe._id} className="item-card">
                <div className="item-image">
                  {recipe.image ? <img src={recipe.image} alt={recipe.name} /> : <div className="image-placeholder"><FaUtensils /></div>}
                </div>
                <div className="item-info">
                  <h4>{recipe.name}</h4>
                  <div className="item-meta">
                    <span className="meta-tag">{recipe.category}</span>
                    <span className="meta-tag spice">{recipe.spiceLevel}</span>
                    <span className="meta-tag diet">{recipe.dietType}</span>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => handleEditRecipe(recipe)} className="action-btn edit"><FaEdit /> Edit</button>
                    <button onClick={() => handleDeleteRecipe(recipe._id)} className="action-btn delete"><FaTrash /> Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Recipes Tab */}
      {activeTab === 'pending' && (
        <div className="pending-tab">
          <div className="items-list">
            {pendingRecipes.map(recipe => (
              <div key={recipe._id} className="pending-item">
                <div className="pending-item-header">
                  <div className="pending-info">
                    <h4>{recipe.name}</h4>
                    <p>Submitted by <strong>{recipe.submittedBy?.name || recipe.createdBy?.name || 'Visitor'}</strong></p>
                    <div className="item-meta">
                      <span className="meta-tag">{recipe.category}</span>
                      <span className="meta-tag spice">{recipe.spiceLevel}</span>
                      <span className="meta-tag diet">{recipe.dietType}</span>
                    </div>
                  </div>
                  <div className="pending-actions">
                    <button
                      onClick={() => setExpandedPendingId(expandedPendingId === recipe._id ? null : recipe._id)}
                      className="action-btn details-btn"
                      title={expandedPendingId === recipe._id ? 'Hide details' : 'View details'}
                    >
                      {expandedPendingId === recipe._id ? <FaChevronUp /> : <FaChevronDown />}
                      {expandedPendingId === recipe._id ? 'Hide' : 'Details'}
                    </button>
                    <button onClick={() => approveRecipe(recipe._id)} className="approve-btn"><FaCheckCircle /> Approve</button>
                    <button onClick={() => rejectRecipe(recipe._id)} className="reject-btn"><FaTimesCircle /> Reject</button>
                  </div>
                </div>

                {/* Expandable details panel */}
                {expandedPendingId === recipe._id && (
                  <div className="pending-details-panel">
                    {/* Image(s) */}
                    {(recipe.images?.length > 0 || recipe.image) && (
                      <div className="pending-images">
                        {(recipe.images?.length > 0 ? recipe.images : [recipe.image]).map((src, i) => (
                          <img key={i} src={src} alt={`${recipe.name} ${i + 1}`} className="pending-preview-img" />
                        ))}
                      </div>
                    )}

                    <div className="pending-details-grid">
                      <div className="pending-detail-section">
                        <h5><FaClipboardList /> Ingredients</h5>
                        <pre className="pending-pre">{recipe.ingredients || 'No ingredients provided.'}</pre>
                      </div>
                      <div className="pending-detail-section">
                        <h5><FaUtensils /> Instructions</h5>
                        <pre className="pending-pre">{recipe.instructions || 'No instructions provided.'}</pre>
                      </div>
                    </div>

                    {recipe.culture && (
                      <p className="pending-culture">
                        <strong>Cultural Origin:</strong> {recipe.culture}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {pendingRecipes.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon"><FaCheckCircle /></div>
                <p>No pending recipes to review</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Twists Tab */}
      {activeTab === 'twists' && (
        <div className="twists-tab">
          <div className="items-list">
            {pendingTwists.map(twist => (
              <div key={twist._id} className="twist-item">
                <div className="twist-info">
                  <h4>{twist.name}</h4>
                  <p>Based on: <strong>{twist.parentRecipe?.name}</strong></p>
                  <div className="substitutions">
                    <strong>Substitutions:</strong>
                    {twist.substitutions?.map((s, i) => (
                      <span key={i} className="sub-badge">{s.from} <FaArrowRight /> {s.to}</span>
                    ))}
                  </div>
                </div>
                <div className="twist-actions">
                  <button onClick={() => approveTwist(twist._id)} className="approve-btn"><FaCheckCircle /> Approve</button>
                  <button onClick={() => rejectTwist(twist._id)} className="reject-btn"><FaTimesCircle /> Reject</button>
                </div>
              </div>
            ))}
            {pendingTwists.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon"><FaSyncAlt /></div>
                <p>No pending twist submissions</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stories Tab */}
      {activeTab === 'stories' && (
        <div className="stories-tab">
          <div className="tab-header">
            <button className="add-btn" onClick={() => setShowStoryForm(!showStoryForm)}>
              <FaPlus /> {showStoryForm ? 'Cancel' : 'Add Story'}
            </button>
          </div>

          {showStoryForm && (
            <div className="form-card">
              <h3>{editStoryId ? 'Edit Story' : 'Add New Story'}</h3>
              <form onSubmit={handleStorySubmit} className="story-form">
                <div className="form-group">
                  <label>Story Title *</label>
                  <input type="text" value={story.title} onChange={(e) => setStory({ ...story, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Story Content *</label>
                  <textarea rows={6} value={story.content} onChange={(e) => setStory({ ...story, content: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Story Image</label>
                  <div className="image-upload" onClick={() => document.getElementById('storyImageInput').click()}>
                    <input id="storyImageInput" type="file" accept="image/*" onChange={handleStoryImage} style={{ display: 'none' }} />
                    {story.image ? (
                      <img src={story.image} alt="Preview" />
                    ) : (
                      <div className="upload-placeholder"><FaImage /> Click to upload image</div>
                    )}
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => { resetStoryForm(); setShowStoryForm(false); }} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">{editStoryId ? 'Update' : 'Create'} Story</button>
                </div>
              </form>
            </div>
          )}

          <div className="items-grid">
            {stories.map(story => (
              <div key={story._id} className="item-card story-card">
                <div className="item-image">
                  {story.image ? <img src={story.image} alt={story.title} /> : <div className="image-placeholder"><FaScroll /></div>}
                </div>
                <div className="item-info">
                  <h4>{story.title}</h4>
                  <p className="story-preview">{story.content?.substring(0, 80)}...</p>
                  <div className="item-actions">
                    <button onClick={() => handleEditStory(story)} className="action-btn edit"><FaEdit /> Edit</button>
                    <button onClick={() => handleDeleteStory(story._id)} className="action-btn delete"><FaTrash /> Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Widget */}
      <Chat />
    </div>
  );
};

export default HeadChefDashboard;