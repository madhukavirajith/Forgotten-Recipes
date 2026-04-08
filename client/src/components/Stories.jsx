import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Stories.css';

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/stories');

        setStories(res.data);
      } catch (err) {
        console.error('Failed to load stories:', err);
        setError('Could not fetch stories. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  return (
    <div className="stories-container">
      <h2>Cultural Stories</h2>

      {loading && <p>Loading stories...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && stories.length === 0 && (
        <p>No stories found.</p>
      )}

      {!loading && !error && stories.length > 0 && (
        <div className="story-grid">
          {stories.map((story) => (
            <div key={story._id} className="story-card">
              <h3>{story.title}</h3>
              {story.image && (
                <img
                  src={story.image}
                  alt={story.title}
                  className="story-image"
                />
              )}
              <p>{story.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Stories;


