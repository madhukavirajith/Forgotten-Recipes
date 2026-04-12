// client/src/components/Recipes.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Recipes.css';

// Import icons
import { 
  FaSearch, 
  FaFilter, 
  FaTimes, 
  FaUtensils,
  FaClock,
  FaFire,
  FaStar,
  FaHeart,
  FaBookmark,
  FaShare,
  FaEye,
  FaArrowLeft,
  FaArrowRight,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaRegClock,
  FaChartLine,
  FaTags
} from 'react-icons/fa';

const API = process.env.REACT_APP_API_URL || '';

// Helper function to trim text
const trimText = (txt = '', len = 100) =>
  txt.length > len ? txt.slice(0, len).trim() + '…' : txt;

// Recipe Card Component (Integrated)
const RecipeCard = ({ recipe, viewMode, isSaved, isLiked, onSave, onLike }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const n = recipe.nutrition || {};
  const flag = n.ratingFlag || 'neutral';
  
  const flagConfig = {
    'weight-loss': { color: '#10b981', icon: '🌱', label: 'Weight Loss Friendly' },
    'weight-gain': { color: '#ef4444', icon: '💪', label: 'Weight Gain' },
    'neutral': { color: '#f59e0b', icon: '⚖️', label: 'Balanced' }
  };
  
  const currentFlag = flagConfig[flag] || flagConfig.neutral;
  
  const getDifficultyColor = (level) => {
    switch(level?.toLowerCase()) {
      case 'easy': return { bg: '#10b98120', color: '#10b981', icon: '😊' };
      case 'medium': return { bg: '#f59e0b20', color: '#f59e0b', icon: '🌶️' };
      case 'hard': return { bg: '#ef444420', color: '#ef4444', icon: '🔥' };
      default: return { bg: '#6b728020', color: '#6b7280', icon: '🍽️' };
    }
  };
  
  const difficulty = getDifficultyColor(recipe.spiceLevel);
  const estimatedTime = recipe.estimatedTime || '30-45 min';
  
  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSave) onSave();
  };
  
  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onLike) onLike();
  };
  
  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.name,
          text: `Check out this delicious Sri Lankan recipe: ${recipe.name}`,
          url: `${window.location.origin}/recipes/${recipe._id}`
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/recipes/${recipe._id}`);
      alert('Link copied to clipboard!');
    }
  };

  // Grid View Card
  if (viewMode === 'grid') {
    return (
      <div 
        className="recipe-card-grid"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link to={`/recipes/${recipe._id}`} className="recipe-card-link">
          <div className="recipe-card-image-wrapper">
            {recipe.image ? (
              <>
                {!imageLoaded && <div className="recipe-card-image-skeleton"></div>}
                <img 
                  src={recipe.image} 
                  alt={recipe.name}
                  className={`recipe-card-image ${imageLoaded ? 'loaded' : ''}`}
                  onLoad={() => setImageLoaded(true)}
                  loading="lazy"
                />
              </>
            ) : (
              <div className="recipe-card-image-placeholder">
                <FaUtensils />
              </div>
            )}
            
            <div className="recipe-card-badges">
              {recipe.isNew && <span className="badge new">New</span>}
              {recipe.isPopular && <span className="badge popular">🔥 Popular</span>}
              {recipe.dietType === 'Vegetarian' && <span className="badge veg">🌱 Veg</span>}
              {recipe.dietType === 'Vegan' && <span className="badge vegan">🌿 Vegan</span>}
            </div>
            
            <div className={`recipe-card-overlay ${isHovered ? 'visible' : ''}`}>
              <button 
                className={`overlay-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
                title={isLiked ? 'Unlike' : 'Like'}
              >
                <FaHeart />
              </button>
              <button 
                className={`overlay-btn ${isSaved ? 'saved' : ''}`}
                onClick={handleSave}
                title={isSaved ? 'Saved' : 'Save to Cookbook'}
              >
                <FaBookmark />
              </button>
              <button 
                className="overlay-btn"
                onClick={handleShare}
                title="Share"
              >
                <FaShare />
              </button>
            </div>
          </div>
          
          <div className="recipe-card-content">
            <div className="recipe-card-header">
              <div className="recipe-card-meta">
                <span className="meta-category">{recipe.category || 'Recipe'}</span>
                <span className="meta-time">
                  <FaRegClock /> {estimatedTime}
                </span>
              </div>
              <h3 className="recipe-card-title">{recipe.name}</h3>
            </div>
            
            <p className="recipe-card-description">
              {trimText(recipe.ingredients || 'No description available', 80)}
            </p>
            
            <div className="recipe-card-footer">
              <div className="recipe-card-stats">
                <div className="stat-item">
                  <FaStar className="star-icon" />
                  <span>{Number(recipe.averageRating || 0).toFixed(1)}</span>
                  <span className="stat-count">({recipe.ratingsCount || 0})</span>
                </div>
                <div className="stat-item">
                  <FaFire className="spice-icon" style={{ color: difficulty.color }} />
                  <span>{recipe.spiceLevel || 'Medium'}</span>
                </div>
                <div className="stat-item">
                  <FaChartLine />
                  <span>{n.calories || 0} kcal</span>
                </div>
              </div>
              
              <div className="recipe-card-flag" style={{ background: currentFlag.color + '20', color: currentFlag.color }}>
                <span>{currentFlag.icon}</span>
                <span>{currentFlag.label}</span>
              </div>
            </div>
            
            <div className="recipe-card-cta">
              <span className="view-details-btn">
                View Details <FaArrowRight />
              </span>
            </div>
          </div>
        </Link>
      </div>
    );
  }
  
  // List View Card
  return (
    <div 
      className="recipe-card-list"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/recipes/${recipe._id}`} className="recipe-card-link list-view">
        <div className="recipe-card-image-wrapper list">
          {recipe.image ? (
            <img 
              src={recipe.image} 
              alt={recipe.name}
              className="recipe-card-image-list"
              loading="lazy"
            />
          ) : (
            <div className="recipe-card-image-placeholder-list">
              <FaUtensils />
            </div>
          )}
        </div>
        
        <div className="recipe-card-content-list">
          <div className="recipe-card-header-list">
            <div className="recipe-card-meta-list">
              <span className="meta-category">{recipe.category || 'Recipe'}</span>
              <span className="meta-time">
                <FaRegClock /> {estimatedTime}
              </span>
              <span className="meta-difficulty" style={{ background: difficulty.bg, color: difficulty.color }}>
                {difficulty.icon} {recipe.spiceLevel || 'Medium'}
              </span>
            </div>
            <h3 className="recipe-card-title-list">{recipe.name}</h3>
          </div>
          
          <p className="recipe-card-description-list">
            {trimText(recipe.ingredients || 'No description available', 120)}
          </p>
          
          <div className="recipe-card-footer-list">
            <div className="recipe-card-stats-list">
              <div className="stat-item">
                <FaStar className="star-icon" />
                <span>{Number(recipe.averageRating || 0).toFixed(1)}</span>
                <span className="stat-count">({recipe.ratingsCount || 0})</span>
              </div>
              <div className="stat-item">
                <FaFire className="spice-icon" style={{ color: difficulty.color }} />
                <span>{recipe.spiceLevel || 'Medium'}</span>
              </div>
              <div className="stat-item">
                <FaChartLine />
                <span>{n.calories || 0} kcal</span>
              </div>
            </div>
            
            <div className="recipe-card-actions-list">
              <button 
                className={`action-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
                title={isLiked ? 'Unlike' : 'Like'}
              >
                <FaHeart />
              </button>
              <button 
                className={`action-btn ${isSaved ? 'saved' : ''}`}
                onClick={handleSave}
                title={isSaved ? 'Saved' : 'Save'}
              >
                <FaBookmark />
              </button>
              <button 
                className="action-btn"
                onClick={handleShare}
                title="Share"
              >
                <FaShare />
              </button>
              <span className="view-link">
                View Details <FaArrowRight />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

// Main Recipes Component
const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState(['All']);
  const [spiceLevels, setSpiceLevels] = useState(['All']);
  const [dietTypes, setDietTypes] = useState(['All']);
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSpice, setSelectedSpice] = useState('All');
  const [selectedDiet, setSelectedDiet] = useState('All');
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [savedRecipes, setSavedRecipes] = useState({});
  const [likedRecipes, setLikedRecipes] = useState({});
  
  const recipesPerPage = 9;
  const searchInputRef = useRef(null);

  // Fetch recipes
  useEffect(() => {
    fetchRecipes();
  }, []);

  // Load saved recipes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedRecipes');
    const liked = localStorage.getItem('likedRecipes');
    if (saved) setSavedRecipes(JSON.parse(saved));
    if (liked) setLikedRecipes(JSON.parse(liked));
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API}/api/recipes`);
      const data = Array.isArray(res.data) ? res.data : [];
      const approved = data.filter(r => r.status === 'approved' || r.approved === true);
      
      setRecipes(approved);
      setFiltered(approved);

      const uniq = (arr, key) =>
        ['All', ...Array.from(new Set(arr.map(i => i[key]).filter(Boolean)))];
      
      setCategories(uniq(approved, 'category'));
      setSpiceLevels(uniq(approved, 'spiceLevel'));
      setDietTypes(uniq(approved, 'dietType'));
    } catch (err) {
      console.error('Error fetching recipes:', err?.response?.data || err.message);
      setError('Failed to load recipes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort recipes
  useEffect(() => {
    let results = [...recipes];
    
    if (selectedCategory !== 'All') {
      results = results.filter(r => r.category === selectedCategory);
    }
    if (selectedSpice !== 'All') {
      results = results.filter(r => r.spiceLevel === selectedSpice);
    }
    if (selectedDiet !== 'All') {
      results = results.filter(r => r.dietType === selectedDiet);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.ingredients?.toLowerCase().includes(q) ||
        r.culture?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q)
      );
    }
    
    switch (sortBy) {
      case 'newest':
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'popular':
        results.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'name-asc':
        results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        results.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      default:
        break;
    }
    
    setFiltered(results);
    setCurrentPage(1);
  }, [search, selectedCategory, selectedSpice, selectedDiet, sortBy, recipes]);

  const indexOfLastRecipe = currentPage * recipesPerPage;
  const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage;
  const currentRecipes = filtered.slice(indexOfFirstRecipe, indexOfLastRecipe);
  const totalPages = Math.ceil(filtered.length / recipesPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedSpice('All');
    setSelectedDiet('All');
    setSortBy('newest');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  };

  const toggleSaveRecipe = (recipeId) => {
    const newSaved = { ...savedRecipes, [recipeId]: !savedRecipes[recipeId] };
    setSavedRecipes(newSaved);
    localStorage.setItem('savedRecipes', JSON.stringify(newSaved));
  };

  const toggleLikeRecipe = (recipeId) => {
    const newLiked = { ...likedRecipes, [recipeId]: !likedRecipes[recipeId] };
    setLikedRecipes(newLiked);
    localStorage.setItem('likedRecipes', JSON.stringify(newLiked));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedSpice !== 'All') count++;
    if (selectedDiet !== 'All') count++;
    if (search.trim()) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="recipes-container">
        <div className="recipes-loading">
          <FaSpinner className="loading-spinner" />
          <p>Discovering delicious recipes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recipes-container">
        <div className="recipes-error">
          <div className="error-icon">🍛</div>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={fetchRecipes} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recipes-container">
      {/* Hero Section */}
      <div className="recipes-hero">
        <h1 className="recipes-hero-title">
          <span className="hero-icon">🍛</span>
          Explore Traditional Recipes
        </h1>
        <p className="recipes-hero-subtitle">
          Discover authentic Sri Lankan dishes passed down through generations
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="recipes-controls">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by name, ingredients, or culture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>
              <FaTimes />
            </button>
          )}
        </div>

        <div className="controls-right">
          <div className="sort-wrapper">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Popular</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
          </div>

          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
            Filters
            {getActiveFiltersCount() > 0 && (
              <span className="filter-count">{getActiveFiltersCount()}</span>
            )}
          </button>

          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className={`filters-panel ${showFilters ? 'open' : ''}`}>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Category</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Spice Level</label>
            <select value={selectedSpice} onChange={(e) => setSelectedSpice(e.target.value)}>
              {spiceLevels.map(s => (
                <option key={s} value={s}>
                  {s === 'All' ? s : `${s} ${s === 'Mild' ? '🌶️' : s === 'Medium' ? '🌶️🌶️' : '🌶️🌶️🌶️'}`}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Diet Type</label>
            <select value={selectedDiet} onChange={(e) => setSelectedDiet(e.target.value)}>
              {dietTypes.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {getActiveFiltersCount() > 0 && (
          <div className="filter-actions">
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="recipes-info">
        <p>
          {filtered.length === 0 
            ? 'No recipes found' 
            : `Found ${filtered.length} ${filtered.length === 1 ? 'recipe' : 'recipes'}`}
        </p>
      </div>

      {/* Recipe Grid/List */}
      {filtered.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No recipes found</h3>
          <p>Try adjusting your search or filter criteria</p>
          <button onClick={clearFilters} className="reset-btn">
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className={`recipes-${viewMode}`}>
            {currentRecipes.map((recipe) => (
              <RecipeCard 
                key={recipe._id}
                recipe={recipe} 
                viewMode={viewMode}
                isSaved={savedRecipes[recipe._id]}
                isLiked={likedRecipes[recipe._id]}
                onSave={() => toggleSaveRecipe(recipe._id)}
                onLike={() => toggleLikeRecipe(recipe._id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
                className="page-btn"
              >
                <FaArrowLeft /> Previous
              </button>
              
              <div className="page-numbers">
                {[...Array(totalPages)].map((_, i) => {
                  if (
                    i + 1 === 1 ||
                    i + 1 === totalPages ||
                    (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={i}
                        onClick={() => paginate(i + 1)}
                        className={`page-number ${currentPage === i + 1 ? 'active' : ''}`}
                      >
                        {i + 1}
                      </button>
                    );
                  }
                  if (i + 1 === currentPage - 2 || i + 1 === currentPage + 2) {
                    return <span key={i} className="page-dots">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                Next <FaArrowRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Recipes;