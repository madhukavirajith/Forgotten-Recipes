// client/src/components/Stories.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import './Stories.css';

// API Configuration
const API_BASE = process.env.REACT_APP_API_URL || '';

// Mock Stories (Fallback when backend is unavailable)
const FALLBACK_STORIES = [
  {
    _id: '1',
    title: 'The Sacred Promise: How Kiri Bath Became Sri Lanka\'s Most Treasured Dish',
    content: 'In the ancient kingdom of Anuradhapura, over 2,500 years ago, there lived a young princess named Devi. She was known throughout the land for her compassionate heart and her deep connection to the earth\'s bounty. One year, a terrible drought struck the island. The people suffered, and the king grew desperate. On the night of the full moon, Devi gathered the village women. They took the precious remaining rice and began to cook it in large clay pots over open flames. As the rice softened, Devi added rich coconut milk—a symbol of purity and abundance. As the clock struck midnight, Devi raised her offering to the sky. Suddenly, rain began to fall. From that day forward, Kiri Bath became Sri Lanka\'s most sacred dish, prepared on every auspicious occasion.',
    image: '/stories/kiribath.jpg',
    category: 'Festival Foods',
    region: 'Nationwide',
    author: 'Traditional Lore',
    readTime: 5,
    date: '2024-01-15',
    tags: ['Kiri Bath', 'New Year', 'Sacred Food', 'Milk Rice']
  },
  {
    _id: '2',
    title: 'The Spice That Changed the World: Ceylon Cinnamon',
    content: 'Hidden within the emerald hills of Sri Lanka grows a spice so precious that ancient explorers risked their lives to find it. They called it "Ceylon Cinnamon" – the true cinnamon, the "king of spices." For over 5,000 years, the island\'s master cinnamon peelers have passed down their art from father to son. These skilled craftsmen can transform a rough tree branch into paper-thin quills using nothing but a simple brass rod. It takes 20 years of practice to become a true master. Ancient Egyptians used cinnamon in their embalming rituals – it was more valuable than gold. Today, Sri Lanka still produces 90% of the world\'s true cinnamon, preserving a tradition that has shaped world history.',
    image: '/stories/cinnamon.jpg',
    category: 'Spices & Traditions',
    region: 'Southern Province',
    author: 'Culinary Historian',
    readTime: 7,
    date: '2024-02-10',
    tags: ['Cinnamon', 'Spices', 'Trade', 'Ancient History']
  },
  {
    _id: '3',
    title: 'The Grand Feast of Avurudu: Sri Lankan New Year',
    content: 'The Sinhala and Tamil New Year, known as "Avurudu," is the most important traditional festival in Sri Lanka. Celebrated in mid-April when the sun moves from Pisces to Aries, it marks the end of harvest and the beginning of a new agricultural cycle. The preparation of traditional sweets is an essential part of the celebration. Kokis, a crispy, flower-shaped deep-fried snack made from rice flour and coconut milk, represents prosperity. Kavum, oil cakes made from rice flour and treacle, symbolize the sweetness of life. Athirasa, a sweet flat cake, represents unity. Families gather to prepare these delicacies together, following auspicious times determined by astrologers.',
    image: '/stories/avurudu.jpg',
    category: 'Festival Foods',
    region: 'Nationwide',
    author: 'Cultural Anthropologist',
    readTime: 8,
    date: '2024-03-20',
    tags: ['Avurudu', 'New Year', 'Traditional Sweets', 'Kokis', 'Kavum']
  },
  {
    _id: '4',
    title: 'The Fishermen\'s Curry: Ambul Thiyal of the South',
    content: 'Along the sun-drenched shores of the southern coast, from Galle to Hambantota, a unique sour fish curry known as Ambul Thiyal has been prepared for generations. Unlike other Sri Lankan curries, this dish contains no coconut milk. Instead, it relies on goraka (Garcinia cambogia) – a small, sour fruit – to preserve the fish and create its distinctive tangy flavor. Traditional fishermen would prepare this curry before long journeys, as the goraka acted as a natural preservative, keeping the fish edible for days. The method of dry-roasting the spices before cooking creates a deep, complex flavor profile that has made this dish famous worldwide.',
    image: '/stories/ambul-thiyal.jpg',
    category: 'Regional Specialties',
    region: 'Southern Province',
    author: 'Food Historian',
    readTime: 6,
    date: '2024-04-05',
    tags: ['Ambul Thiyal', 'Fish Curry', 'Southern Cuisine', 'Goraka']
  }
];

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStory, setSelectedStory] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const storiesRef = useRef(null);

  // Extract unique categories from stories
  const categories = ['all', ...new Set(FALLBACK_STORIES.map(s => s.category), ...stories.map(s => s.category))];

  // Fetch stories from API
  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.get(`${API_BASE}/api/stories`, { timeout: 8000 });
      
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setStories(res.data);
        setFilteredStories(res.data);
        setUsingFallback(false);
      } else {
        // Use fallback stories if API returns empty
        setStories(FALLBACK_STORIES);
        setFilteredStories(FALLBACK_STORIES);
        setUsingFallback(true);
      }
    } catch (err) {
      console.error('Failed to load stories:', err);
      // Use fallback stories on error
      setStories(FALLBACK_STORIES);
      setFilteredStories(FALLBACK_STORIES);
      setUsingFallback(true);
      setError('Using sample stories. Connect to backend for full experience.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter stories based on category and search query
  useEffect(() => {
    let filtered = [...stories];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(story => story.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(story => 
        story.title.toLowerCase().includes(query) ||
        story.content.toLowerCase().includes(query) ||
        story.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredStories(filtered);
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, stories]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStories = filteredStories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStories.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    if (storiesRef.current) {
      storiesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Open story modal
  const openStoryModal = (story) => {
    setSelectedStory(story);
    document.body.style.overflow = 'hidden';
  };

  // Close story modal
  const closeStoryModal = () => {
    setSelectedStory(null);
    document.body.style.overflow = 'unset';
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="stories-container">
        <div className="stories-header">
          <h1 className="stories-title">Cultural Stories</h1>
          <p className="stories-subtitle">Discover the rich heritage behind Sri Lankan cuisine</p>
        </div>
        <div className="story-grid-skeleton">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="story-card-skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="stories-container" ref={storiesRef}>
      {/* Hero Section */}
      <div className="stories-hero">
        <div className="stories-hero-content">
          <h1 className="stories-hero-title">
            <span className="hero-icon">📖</span>
            Cultural Stories
          </h1>
          <p className="stories-hero-subtitle">
            Preserving Sri Lanka's culinary heritage, one story at a time
          </p>
          {usingFallback && (
            <div className="demo-banner">
              <span>📚 Demo Mode</span>
              <p>Showing sample stories. Connect to backend for full experience.</p>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="stories-controls">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search stories by title, content, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>

        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All Stories' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="results-count">
        <p>
          {filteredStories.length === 0 
            ? 'No stories found' 
            : `Found ${filteredStories.length} cultural ${filteredStories.length === 1 ? 'story' : 'stories'}`}
        </p>
      </div>

      {/* Stories Grid */}
      {filteredStories.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">📚</div>
          <h3>No Stories Found</h3>
          <p>Try adjusting your search or filter criteria</p>
          <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="reset-btn">
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="story-grid">
            {currentStories.map((story, index) => (
              <div 
                key={story._id} 
                className="story-card"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => openStoryModal(story)}
              >
                {story.image ? (
                  <div className="story-card-image">
                    <img src={story.image} alt={story.title} loading="lazy" />
                    <div className="story-card-overlay">
                      <span className="read-more-hint">Click to read →</span>
                    </div>
                  </div>
                ) : (
                  <div className="story-card-image-placeholder">
                    <span>📖</span>
                  </div>
                )}
                <div className="story-card-content">
                  <div className="story-meta">
                    {story.category && <span className="story-category">{story.category}</span>}
                    {story.readTime && <span className="story-read-time">⏱️ {story.readTime} min read</span>}
                  </div>
                  <h3 className="story-card-title">{story.title}</h3>
                  <p className="story-card-excerpt">
                    {story.content.substring(0, 120)}...
                  </p>
                  <div className="story-footer">
                    <div className="story-tags">
                      {story.tags?.slice(0, 2).map((tag, i) => (
                        <span key={i} className="story-tag">#{tag}</span>
                      ))}
                    </div>
                    <button className="story-read-more">Read Full Story →</button>
                  </div>
                </div>
              </div>
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
                ← Previous
              </button>
              <div className="page-numbers">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => paginate(i + 1)}
                    className={`page-number ${currentPage === i + 1 ? 'active' : ''}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Story Modal */}
      {selectedStory && (
        <div className="story-modal" onClick={closeStoryModal}>
          <div className="story-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeStoryModal}>✕</button>
            
            {selectedStory.image && (
              <div className="modal-image">
                <img src={selectedStory.image} alt={selectedStory.title} />
              </div>
            )}
            
            <div className="modal-body">
              <div className="modal-meta">
                {selectedStory.category && <span className="modal-category">{selectedStory.category}</span>}
                {selectedStory.region && <span className="modal-region">📍 {selectedStory.region}</span>}
                {selectedStory.readTime && <span className="modal-read-time">⏱️ {selectedStory.readTime} min read</span>}
                {selectedStory.date && <span className="modal-date">📅 {formatDate(selectedStory.date)}</span>}
              </div>
              
              <h2 className="modal-title">{selectedStory.title}</h2>
              
              {selectedStory.author && (
                <p className="modal-author">By {selectedStory.author}</p>
              )}
              
              <div className="modal-content">
                <p>{selectedStory.content}</p>
              </div>
              
              {selectedStory.tags && selectedStory.tags.length > 0 && (
                <div className="modal-tags">
                  <strong>Tags:</strong>
                  {selectedStory.tags.map((tag, i) => (
                    <span key={i} className="modal-tag">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="share-btn" onClick={() => navigator.share?.({ title: selectedStory.title, text: selectedStory.content.substring(0, 100) })}>
                📤 Share this story
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Newsletter Section */}
      <div className="newsletter-section">
        <div className="newsletter-content">
          <h3>Love Sri Lankan Stories?</h3>
          <p>Subscribe to get new cultural stories delivered to your inbox</p>
          <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert('Thank you for subscribing!'); }}>
            <input type="email" placeholder="Enter your email" required />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Stories;