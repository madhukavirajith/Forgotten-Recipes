// client/src/components/Blog.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Blog.css';

// Import icons
import { 
  FaSearch, 
  FaUser, 
  FaCalendar, 
  FaTag, 
  FaHeart, 
  FaComment, 
  FaShare,
  FaBookmark,
  FaEye,
  FaArrowRight,
  FaTimes,
  FaFilter,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaQuoteLeft,
  FaNewspaper,
  FaClock,
  FaUtensils,
  FaLightbulb,
  FaStar,
  FaVideo
} from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_URL || '';

const Blog = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const postsPerPage = 6;
  const blogRef = useRef(null);
  const searchInputRef = useRef(null);

  // Blog categories (different from cultural stories)
  const blogCategories = [
    'Cooking Tips',
    'Chef Interviews',
    'Restaurant Reviews',
    'Ingredient Guides',
    'Kitchen Techniques',
    'Food Trends',
    'Recipe Tutorials',
    'Kitchen Tools',
    'Health & Nutrition',
    'Travel & Food'
  ];

  // Fetch blogs
  useEffect(() => {
    fetchBlogs();
  }, []);

  // Load saved likes/bookmarks from localStorage
  useEffect(() => {
    const savedLikes = localStorage.getItem('blogLikes');
    const savedBookmarks = localStorage.getItem('blogBookmarks');
    if (savedLikes) setLikedPosts(JSON.parse(savedLikes));
    if (savedBookmarks) setBookmarkedPosts(JSON.parse(savedBookmarks));
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE}/api/blogs`);
      setBlogs(response.data);
      setFilteredBlogs(response.data);
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('Failed to load blog posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories and tags from blogs
  const categories = ['all', ...new Set(blogs.map(blog => blog.category).filter(Boolean))];
  const tags = ['all', ...new Set(blogs.flatMap(blog => blog.tags || []).filter(Boolean))];

  // Filter and sort blogs
  useEffect(() => {
    let filtered = [...blogs];

    if (searchTerm) {
      filtered = filtered.filter(blog =>
        blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(blog => blog.category === selectedCategory);
    }

    if (selectedTag !== 'all') {
      filtered = filtered.filter(blog => blog.tags?.includes(selectedTag));
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      default:
        break;
    }

    setFilteredBlogs(filtered);
    setCurrentPage(1);
  }, [blogs, searchTerm, selectedCategory, selectedTag, sortBy]);

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredBlogs.length / postsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLike = async (blogId) => {
    const newLikedState = !likedPosts[blogId];
    setLikedPosts(prev => ({ ...prev, [blogId]: newLikedState }));
    localStorage.setItem('blogLikes', JSON.stringify({ ...likedPosts, [blogId]: newLikedState }));
    
    try {
      await axios.post(`${API_BASE}/api/blogs/${blogId}/like`);
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleBookmark = (blogId) => {
    const newBookmarkState = !bookmarkedPosts[blogId];
    setBookmarkedPosts(prev => ({ ...prev, [blogId]: newBookmarkState }));
    localStorage.setItem('blogBookmarks', JSON.stringify({ ...bookmarkedPosts, [blogId]: newBookmarkState }));
  };

  const handleShare = async (blog) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt || blog.content?.substring(0, 100),
          url: `${window.location.origin}/blog/${blog._id}`
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/blog/${blog._id}`);
      alert('Link copied to clipboard!');
    }
  };

  const openBlogModal = (blog) => {
    setSelectedBlog(blog);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeBlogModal = () => {
    setShowModal(false);
    setSelectedBlog(null);
    document.body.style.overflow = 'unset';
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedTag('all');
    setSortBy('newest');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="blog-container">
        <div className="blog-loading">
          <div className="loading-spinner"></div>
          <p>Loading articles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-container">
        <div className="blog-error">
          <div className="error-icon">📝</div>
          <h2>Unable to Load Articles</h2>
          <p>{error}</p>
          <button onClick={fetchBlogs} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-container" ref={blogRef}>
      {/* Hero Section - Blog Focused */}
      <div className="blog-hero">
        <div className="blog-hero-content">
          <h1 className="blog-hero-title">
            <span className="hero-icon">📝</span>
            Food Blog
          </h1>
          <p className="blog-hero-subtitle">
            Cooking tips, chef interviews, kitchen techniques, restaurant reviews, 
            and everything about Sri Lankan food culture
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="blog-controls">
        <div className="blog-search">
          <FaSearch className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <FaTimes />
            </button>
          )}
        </div>

        <div className="blog-actions">
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> Filters
          </button>
          
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⊞
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className={`filters-panel ${showFilters ? 'open' : ''}`}>
        <div className="filters-row">
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {blogCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {(searchTerm || selectedCategory !== 'all' || selectedTag !== 'all') && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="blog-results">
        <p>
          {filteredBlogs.length === 0 
            ? 'No articles found' 
            : `Showing ${filteredBlogs.length} ${filteredBlogs.length === 1 ? 'article' : 'articles'}`}
        </p>
      </div>

      {/* Blog Grid/List */}
      {filteredBlogs.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No articles found</h3>
          <p>Try adjusting your search or filter criteria</p>
          <button onClick={clearFilters} className="reset-btn">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className={`blog-${viewMode}`}>
          {currentBlogs.map((blog, index) => (
            <article 
              key={blog._id} 
              className={`blog-card ${viewMode === 'list' ? 'list-view' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {blog.image && (
                <div className="blog-card-image">
                  <img src={blog.image} alt={blog.title} loading="lazy" />
                  <div className="blog-card-overlay">
                    <button className="quick-view-btn" onClick={() => openBlogModal(blog)}>
                      Quick Read
                    </button>
                  </div>
                </div>
              )}
              
              <div className="blog-card-content">
                <div className="blog-meta">
                  <span className="blog-date">
                    <FaCalendar /> {formatDate(blog.createdAt)}
                  </span>
                  {blog.category && (
                    <span className="blog-category">{blog.category}</span>
                  )}
                  <span className="blog-read-time">
                    <FaClock /> {Math.ceil(blog.content?.length / 1000)} min read
                  </span>
                </div>
                
                <h3 className="blog-title">{blog.title}</h3>
                
                <p className="blog-excerpt">
                  {truncateText(blog.content || 'No content available', 150)}
                </p>
                
                <div className="blog-footer">
                  <div className="blog-stats">
                    <button 
                      className={`stat-btn ${likedPosts[blog._id] ? 'liked' : ''}`}
                      onClick={() => handleLike(blog._id)}
                    >
                      <FaHeart /> {blog.likes || 0}
                    </button>
                    <button className="stat-btn">
                      <FaComment /> {blog.comments || 0}
                    </button>
                    <button className="stat-btn">
                      <FaEye /> {blog.views || 0}
                    </button>
                  </div>
                  
                  <div className="blog-actions-footer">
                    <button 
                      className={`bookmark-btn ${bookmarkedPosts[blog._id] ? 'bookmarked' : ''}`}
                      onClick={() => handleBookmark(blog._id)}
                    >
                      <FaBookmark />
                    </button>
                    <button className="share-btn" onClick={() => handleShare(blog)}>
                      <FaShare />
                    </button>
                    <Link to={`/blog/${blog._id}`} className="read-more-btn">
                      Read More <FaArrowRight />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="blog-pagination">
          <button 
            onClick={() => paginate(currentPage - 1)} 
            disabled={currentPage === 1}
            className="page-btn"
          >
            <FaChevronLeft /> Previous
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
            Next <FaChevronRight />
          </button>
        </div>
      )}

      {/* Blog Modal */}
      {showModal && selectedBlog && (
        <div className="blog-modal" onClick={closeBlogModal}>
          <div className="blog-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeBlogModal}>
              <FaTimes />
            </button>
            
            {selectedBlog.image && (
              <div className="modal-image">
                <img src={selectedBlog.image} alt={selectedBlog.title} />
              </div>
            )}
            
            <div className="modal-body">
              <div className="modal-meta">
                <span><FaCalendar /> {formatDate(selectedBlog.createdAt)}</span>
                {selectedBlog.category && <span className="modal-category">{selectedBlog.category}</span>}
                <span><FaClock /> {Math.ceil(selectedBlog.content?.length / 1000)} min read</span>
              </div>
              
              <h2 className="modal-title">{selectedBlog.title}</h2>
              
              <div className="modal-content">
                <p>{selectedBlog.content}</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="share-modal-btn" onClick={() => handleShare(selectedBlog)}>
                <FaShare /> Share this article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Newsletter Section */}
      <div className="blog-newsletter">
        <div className="newsletter-content">
          <FaNewspaper className="newsletter-icon" />
          <h3>Subscribe to Our Food Blog</h3>
          <p>Get the latest recipes, cooking tips, and food stories delivered weekly</p>
          <form className="newsletter-form" onSubmit={(e) => {
            e.preventDefault();
            alert('Thank you for subscribing to our food blog!');
          }}>
            <input type="email" placeholder="Your email address" required />
            <button type="submit">Subscribe</button>
          </form>
          <p className="newsletter-note">No spam. Unsubscribe anytime.</p>
        </div>
      </div>
    </div>
  );
};

export default Blog;