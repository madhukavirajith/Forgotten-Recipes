// client/src/components/Stories.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Stories.css';

// ✅ FIX: Use environment variable for API URL
const API_BASE = process.env.REACT_APP_API_URL || '';

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ✅ FIX: Use relative path or environment variable
        // This works both locally (with proxy) and in production (with Vercel rewrites)
        const res = await axios.get(`${API_BASE}/api/stories`);
        
        // Handle different response formats
        if (res.data && Array.isArray(res.data)) {
          setStories(res.data);
        } else if (res.data && res.data.stories) {
          setStories(res.data.stories);
        } else {
          setStories([]);
        }
      } catch (err) {
        console.error('Failed to load stories:', err);
        
        // More specific error messages
        if (err.code === 'ERR_CONNECTION_REFUSED') {
          setError('Cannot connect to server. Please make sure the backend is running.');
        } else if (err.response?.status === 404) {
          setError('Stories endpoint not found. Please check API configuration.');
        } else if (err.response?.status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError('Could not fetch stories. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  if (loading) {
    return (
      <div className="stories-container">
        <h2>Cultural Stories</h2>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading stories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stories-container">
        <h2>Cultural Stories</h2>
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stories-container">
      <h2>Cultural Stories</h2>
      <p className="stories-subtitle">
        Discover the rich heritage and traditions behind Sri Lankan cuisine
      </p>

      {stories.length === 0 ? (
        <div className="no-stories">
          <p>No stories found.</p>
          <p>Check back soon for traditional Sri Lankan cultural stories!</p>
        </div>
      ) : (
        <div className="story-grid">
          {stories.map((story) => (
            <div key={story._id} className="story-card">
              {story.image && (
                <div className="story-image-container">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="story-image"
                  />
                </div>
              )}
              <div className="story-content">
                <h3>{story.title}</h3>
                <p className="story-excerpt">
                  {story.content.length > 200 
                    ? `${story.content.substring(0, 200)}...` 
                    : story.content}
                </p>
                <button className="read-more-btn">Read More →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Stories;