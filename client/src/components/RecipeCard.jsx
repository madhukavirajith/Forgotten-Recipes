
import React from 'react';
import { Link } from 'react-router-dom';
import './Recipes.css';

const trim = (txt = '', len = 140) =>
  txt.length > len ? txt.slice(0, len).trim() + '…' : txt;

export default function RecipeCard({ recipe }) {
  const n = recipe.nutrition || {};
  const flag = n.ratingFlag || 'neutral';
  const flagColor =
    flag === 'weight-loss' ? 'green' :
    flag === 'weight-gain' ? 'red' : 'goldenrod';

  return (
    <Link to={`/recipes/${recipe._id}`} className="recipe-card card-hover block no-underline">
      {/* Title */}
      <h3 className="card-title">{recipe.name}</h3>

      {/* Meta */}
      <div className="recipe-meta">
        <span><strong>Category:</strong> {recipe.category || 'N/A'}</span>
        <span><strong>Spice:</strong> {recipe.spiceLevel || 'N/A'}</span>
        <span><strong>Diet:</strong> {recipe.dietType || 'N/A'}</span>
      </div>

      {/* Image */}
      {recipe.image && (
        <img src={recipe.image} alt={recipe.name} loading="lazy" className="card-img" />
      )}

      {/* Tiny summary */}
      <p className="recipe-section">
        <strong>Ingredients:</strong><br />
        {trim(recipe.ingredients || '')}
      </p>

      {/* Footer row */}
      <div className="card-footer">
        <div className="rating-chip" title="Average rating">
          <span className="star">★</span>
          {Number(recipe.averageRating || 0).toFixed(1)}
          <span className="count">({recipe.ratingsCount || 0})</span>
        </div>

        <span
          className="badge-flag"
          style={{ background: flagColor }}
          title="Nutrition tendency"
        >
          {flag}
        </span>
      </div>

      <div className="card-cta">
        <span className="btn-brown-outline">View details →</span>
      </div>
    </Link>
  );
}
