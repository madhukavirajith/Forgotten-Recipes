// client/src/components/RecipeCard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Recipes.css';
import './RecipeCard.css';

// Import icons
import { 
  FaStar, 
  FaClock, 
  FaFire, 
  FaLeaf, 
  FaHeart, 
  FaBookmark,
  FaShare,
  FaEye,
  FaUtensils,
  FaRegClock,
  FaChartLine,
  FaTags,
  FaChevronRight
} from 'react-icons/fa';

const trim = (txt = '', len = 100) =>
  txt.length > len ? txt.slice(0, len).trim() + '…' : txt;

export default function RecipeCard({ recipe, viewMode = 'grid', onSave, onLike, isSaved, isLiked }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const n = recipe.nutrition || {};
  const flag = n.ratingFlag || 'neutral';
  
  const flagConfig = {
    'weight-loss': { color: '#10b981', icon: '🌱', label: 'Weight Loss Friendly' },
    'weight-gain': { color: '#ef4444', icon: '💪', label: 'Weight Gain' },
    'neutral': { color: '#f59e0b', icon: '⚖️', label: 'Balanced' }
  };
  
  const currentFlag = flagConfig[flag] || flagConfig.neutral;
  
  // Get difficulty color
  const getDifficultyColor = (level) => {
    switch(level?.toLowerCase()) {
      case 'easy': return { bg: '#10b98120', color: '#10b981', icon: '😊' };
      case 'medium': return { bg: '#f59e0b20', color: '#f59e0b', icon: '🌶️' };
      case 'hard': return { bg: '#ef444420', color: '#ef4444', icon: '🔥' };
      default: return { bg: '#6b728020', color: '#6b7280', icon: '🍽️' };
    }
  };
  
  const difficulty = getDifficultyColor(recipe.spiceLevel);
  
  // Estimated cook time (mock - can be enhanced with actual data)
  const estimatedTime = recipe.estimatedTime || '30-45 min';
  
  // Handle save click
  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSave) onSave();
  };
  
  // Handle like click
  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onLike) onLike();
  };
  
  // Handle share click
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
        ref={cardRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link to={`/recipes/${recipe._id}`} className="recipe-card-link">
          {/* Image Section */}
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
            
            {/* Badges */}
            <div className="recipe-card-badges">
              {recipe.isNew && <span className="badge new">New</span>}
              {recipe.isPopular && <span className="badge popular">🔥 Popular</span>}
              {recipe.dietType === 'Vegetarian' && <span className="badge veg">🌱 Veg</span>}
              {recipe.dietType === 'Vegan' && <span className="badge vegan">🌿 Vegan</span>}
            </div>
            
            {/* Overlay Actions */}
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
          
          {/* Content Section */}
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
            
            {/* Description / Ingredients Preview */}
            <p className="recipe-card-description">
              {trim(recipe.ingredients || 'No description available', 80)}
            </p>
            
            {/* Footer */}
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
            
            {/* View Details Button */}
            <div className="recipe-card-cta">
              <span className="view-details-btn">
                View Details <FaChevronRight />
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
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/recipes/${recipe._id}`} className="recipe-card-link list-view">
        {/* Image Section */}
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
        
        {/* Content Section */}
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
            {trim(recipe.ingredients || 'No description available', 120)}
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
                View Details <FaChevronRight />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}