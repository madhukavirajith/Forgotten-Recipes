// client/src/components/Blog.jsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Import icons
import { 
  FaSearch, 
  FaUser, 
  FaCalendar, 
  FaHeart, 
  FaComment, 
  FaShare,
  FaBookmark,
  FaArrowRight,
  FaTimes,
  FaFilter,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaNewspaper,
  FaClock,
  FaTh,
  FaBars,
  FaReply,
  FaCheck,
  FaTrash,
  FaEdit,
  FaThumbsUp,
  FaSmile,
  FaLaugh,
  FaSadTear,
  FaAngry,
  FaUserCircle
} from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_URL || '';

// ==================== Sub-Component: Blog Comments Section ====================
const BlogComments = ({ blogId, token }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showReactions, setShowReactions] = useState(null);

  const currentUser = token ? JSON.parse(sessionStorage.getItem('user') || '{}') : null;
  const textareaRef = useRef(null);

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/blogs/${blogId}/comments?limit=100`);
      const rawComments = res.data.comments || [];
      
      const sortComments = (list) => {
        if (sortBy === 'newest') {
          list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'oldest') {
          list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        list.forEach(comment => {
          if (comment.replies?.length) sortComments(comment.replies);
        });
        return list;
      };
      
      // Clone rawComments to avoid mutating state directly
      const commentsCloned = JSON.parse(JSON.stringify(rawComments));
      setComments(sortComments(commentsCloned));
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  }, [blogId, sortBy]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!token) return alert('Please login to comment');
    if (!text.trim()) return;
    
    setSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_BASE}/api/blogs/${blogId}/comments`, {
        text: text.trim(),
        parentId: replyTo?._id || null
      }, { headers });
      
      await loadComments();
      setText('');
      setReplyTo(null);
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_BASE}/api/blogs/${blogId}/comments/${commentId}`, { headers });
      await loadComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const editComment = async (commentId) => {
    if (!editText.trim()) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API_BASE}/api/blogs/${blogId}/comments/${commentId}`, {
        text: editText.trim()
      }, { headers });
      await loadComments();
      setEditingId(null);
      setEditText('');
    } catch (err) {
      console.error('Error editing comment:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getAvatarColor = (name) => {
    const colors = ['#D2691E', '#5A2E17', '#e6a817', '#10b981', '#3b82f6', '#8b5cf6'];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const getTotalComments = () => {
    const countReplies = (commentsList) => {
      return commentsList.reduce((acc, comment) => acc + 1 + (comment.replies?.length || 0), 0);
    };
    return countReplies(comments);
  };

  const renderComment = (comment, isReply = false) => {
    const isOwner = currentUser?.id === comment.user?._id || currentUser?._id === comment.user?._id;
    
    return (
      <div key={comment._id} className={`comment-item ${isReply ? 'comment-reply' : ''}`} style={{ borderLeft: isReply ? '2px solid var(--border-color)' : 'none', paddingLeft: isReply ? '1rem' : '0', marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="comment-avatar" style={{ 
            background: getAvatarColor(comment.user?.name),
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.85rem'
          }}>
            {comment.user?.name?.charAt(0).toUpperCase() || <FaUserCircle />}
          </div>
          <div className="comment-content" style={{ flex: 1 }}>
            <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="comment-author" style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{comment.user?.name || 'Anonymous'}</span>
              <span className="comment-date" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(comment.createdAt)}</span>
            </div>
            
            {editingId === comment._id ? (
              <div className="comment-edit-form" style={{ marginTop: '0.5rem' }}>
                <textarea 
                  value={editText} 
                  onChange={(e) => setEditText(e.target.value)} 
                  rows={2}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                />
                <div className="comment-edit-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button onClick={() => editComment(comment._id)} style={{ padding: '0.2rem 0.5rem', background: 'var(--brand-brown)', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}><FaCheck /> Save</button>
                  <button onClick={() => { setEditingId(null); setEditText(''); }} style={{ padding: '0.2rem 0.5rem', background: 'none', border: '1px solid var(--border-color)', borderRadius: '3px', cursor: 'pointer' }}><FaTimes /> Cancel</button>
                </div>
              </div>
            ) : (
              <div className="comment-text" style={{ fontSize: '0.95rem', margin: '0.25rem 0', lineHeight: '1.4' }}>{comment.text}</div>
            )}
            
            <div className="comment-actions" style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>
              <button 
                className="comment-reply-btn" 
                onClick={() => setReplyTo(replyTo === comment ? null : comment)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
              >
                <FaReply /> Reply
              </button>
              
              {isOwner && (
                <>
                  <button 
                    className="comment-edit-btn" 
                    onClick={() => { setEditingId(comment._id); setEditText(comment.text); }}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button 
                    className="comment-delete-btn" 
                    onClick={() => deleteComment(comment._id)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                  >
                    <FaTrash /> Delete
                  </button>
                </>
              )}
            </div>
            
            {replyTo === comment && (
              <div className="reply-form" style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea 
                  ref={textareaRef} 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  placeholder={`Reply to ${comment.user?.name || 'user'}...`} 
                  rows={2} 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                />
                <div className="reply-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: '1px solid var(--border-color)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
                  <button 
                    onClick={submitComment} 
                    disabled={!text.trim() || submitting}
                    style={{ background: 'var(--brand-brown)', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                  >
                    {submitting ? <FaSpinner className="spinning" /> : 'Reply'}
                  </button>
                </div>
              </div>
            )}
            
            {comment.replies?.length > 0 && (
              <div className="replies-container">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="comments-section" style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
      <div className="comments-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <FaComment /> Comments <span className="comment-count" style={{ background: 'var(--bg-secondary)', padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.85rem' }}>{getTotalComments()}</span>
        </h3>
        <div className="comments-sort" style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
          <button className={sortBy === 'newest' ? 'active' : ''} onClick={() => setSortBy('newest')} style={{ background: sortBy === 'newest' ? 'var(--brand-brown)' : 'none', color: sortBy === 'newest' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '3px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>Newest</button>
          <button className={sortBy === 'oldest' ? 'active' : ''} onClick={() => setSortBy('oldest')} style={{ background: sortBy === 'oldest' ? 'var(--brand-brown)' : 'none', color: sortBy === 'oldest' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '3px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>Oldest</button>
        </div>
      </div>
      
      <div className="add-comment" style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <div className="add-comment-avatar" style={{ 
          background: getAvatarColor(currentUser?.name || 'A'),
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {currentUser?.name?.charAt(0).toUpperCase() || <FaUserCircle />}
        </div>
        <form onSubmit={submitComment} className="add-comment-form" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <textarea 
            placeholder={token ? "Share your thoughts about this article..." : "Please log in to leave a comment"} 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            disabled={!token} 
            rows={3} 
            style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: token ? 'var(--bg-primary)' : 'var(--bg-secondary)', resize: 'vertical' }}
          />
          {token && (
            <button 
              type="submit" 
              disabled={!text.trim() || submitting}
              style={{ alignSelf: 'flex-end', background: 'var(--brand-brown)', color: 'white', border: 'none', padding: '0.4rem 1.2rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {submitting ? <FaSpinner className="spinning" /> : 'Post Comment'}
            </button>
          )}
        </form>
      </div>
      
      <div className="comments-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}><FaSpinner className="spinning" /> Loading comments...</div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>No comments yet</p>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
};

// ==================== Main Component ====================
const Blog = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const postsPerPage = 6;
  const blogRef = useRef(null);
  const searchInputRef = useRef(null);

  const token = sessionStorage.getItem('token');
  const currentUser = token ? JSON.parse(sessionStorage.getItem('user') || '{}') : null;
  const authHeader = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

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

  // Dynamic SEO implementation
  useEffect(() => {
    if (selectedBlog) {
      document.title = `${selectedBlog.title} | Food Blog | Forgotten Recipes`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        const plainTextContent = selectedBlog.content?.replace(/[#*`[\]]/g, '').substring(0, 150) || '';
        metaDesc.setAttribute('content', plainTextContent);
      }
    } else {
      document.title = 'Food Blog | Forgotten Recipes';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', 'Explore authentic Sri Lankan food recipes, cooking tips, techniques, and cultural heritage.');
      }
    }
  }, [selectedBlog]);

  // Fetch blogs paginated and filtered from the server
  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: postsPerPage,
        category: selectedCategory,
        search: searchTerm
      };

      const response = await axios.get(`${API_BASE}/api/blogs`, { params });
      
      setBlogs(response.data.blogs || []);
      setTotalBlogs(response.data.total || 0);
      setTotalPages(response.data.pages || 1);
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('Failed to load blog posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, searchTerm]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLike = async (blogId) => {
    if (!token) {
      alert('Please log in to like this post.');
      return;
    }
    
    // Optimistic UI updates
    const userId = currentUser._id || currentUser.id;
    setBlogs(prevBlogs => prevBlogs.map(b => {
      if (b._id === blogId) {
        const alreadyLiked = b.likes?.includes(userId);
        const newLikes = alreadyLiked
          ? (b.likes || []).filter(id => id !== userId)
          : [...(b.likes || []), userId];
        return { ...b, likes: newLikes };
      }
      return b;
    }));

    if (selectedBlog && selectedBlog._id === blogId) {
      const alreadyLiked = selectedBlog.likes?.includes(userId);
      const newLikes = alreadyLiked
        ? (selectedBlog.likes || []).filter(id => id !== userId)
        : [...(selectedBlog.likes || []), userId];
      setSelectedBlog(prev => ({ ...prev, likes: newLikes }));
    }

    try {
      const response = await axios.post(`${API_BASE}/api/blogs/${blogId}/like`, {}, authHeader);
      
      setBlogs(prevBlogs => prevBlogs.map(b => b._id === blogId ? { ...b, likes: response.data.likes } : b));
      if (selectedBlog && selectedBlog._id === blogId) {
        setSelectedBlog(prev => ({ ...prev, likes: response.data.likes }));
      }
    } catch (err) {
      console.error('Error liking post:', err);
      fetchBlogs();
    }
  };

  const handleBookmark = async (blogId) => {
    if (!token) {
      alert('Please log in to bookmark this post.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/blogs/${blogId}/bookmark`, {}, authHeader);
      
      if (currentUser) {
        const savedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        const bookmarkedBlogs = savedUser.bookmarkedBlogs || [];
        const index = bookmarkedBlogs.indexOf(blogId);
        if (response.data.bookmarked) {
          if (index === -1) bookmarkedBlogs.push(blogId);
        } else {
          if (index > -1) bookmarkedBlogs.splice(index, 1);
        }
        savedUser.bookmarkedBlogs = bookmarkedBlogs;
        sessionStorage.setItem('user', JSON.stringify(savedUser));
      }
      
      // Update bookmarks counts in list
      setBlogs(prevBlogs => prevBlogs.map(b => 
        b._id === blogId ? { ...b, bookmarksCount: response.data.bookmarksCount } : b
      ));

      if (selectedBlog && selectedBlog._id === blogId) {
        setSelectedBlog(prev => ({ ...prev, bookmarksCount: response.data.bookmarksCount }));
      }
    } catch (err) {
      console.error('Error bookmarking post:', err);
    }
  };

  const handleShare = async (blog) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.content?.substring(0, 100),
          url: `${window.location.origin}/blog`
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/blog`);
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
    // Strip markdown characters for display excerpt
    const plainText = text.replace(/[#*`[\]]/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('newest');
    setCurrentPage(1);
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  };

  // Safe custom parsing of simplified Markdown formats
  const formatContent = (text) => {
    if (!text) return '';
    
    return text.split('\n').map((paragraph, index) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return <div key={index} style={{ height: '0.8rem' }} />;

      if (trimmed.startsWith('### ')) {
        return <h3 key={index} style={{ margin: '1.25rem 0 0.5rem 0', color: 'var(--brand-brown)', fontSize: '1.15rem', fontWeight: 'bold' }}>{trimmed.slice(4)}</h3>;
      }

      if (trimmed.startsWith('- ')) {
        return <li key={index} style={{ marginLeft: '1.5rem', marginBottom: '0.25rem', listStyleType: 'disc' }}>{parseInlineMarkdown(trimmed.slice(2))}</li>;
      }

      return <p key={index} style={{ marginBottom: '0.75rem', lineHeight: '1.6', fontSize: '1rem', color: 'var(--text-primary)' }}>{parseInlineMarkdown(trimmed)}</p>;
    });
  };

  const parseInlineMarkdown = (text) => {
    const elements = [];
    let lastIndex = 0;
    const regex = /(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0];
      const matchIndex = match.index;
      
      if (matchIndex > lastIndex) {
        elements.push(text.substring(lastIndex, matchIndex));
      }
      
      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        elements.push(<strong key={matchIndex}>{matchText.slice(2, -2)}</strong>);
      } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
        elements.push(<em key={matchIndex}>{matchText.slice(1, -1)}</em>);
      } else if (matchText.startsWith('[') && matchText.includes('](')) {
        const closeBracket = matchText.indexOf(']');
        const linkText = matchText.slice(1, closeBracket);
        const linkUrl = matchText.slice(closeBracket + 2, -1);
        elements.push(<a key={matchIndex} href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-brown)', textDecoration: 'underline', fontWeight: 'bold' }}>{linkText}</a>);
      }
      
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }
    
    return elements.length > 0 ? elements : text;
  };

  const getSortedBlogs = () => {
    let sorted = [...blogs];
    if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'popular') {
      sorted.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    } else {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return sorted;
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="blog-container">
        <div className="blog-loading">
          <div className="loading-spinner"></div>
          <p>Loading articles...</p>
        </div>
      </div>
    );
  }

  if (error && blogs.length === 0) {
    return (
      <div className="blog-container">
        <div className="blog-error">
          <div className="error-icon"><FaNewspaper /></div>
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
      {/* Hero Section */}
      <div className="blog-hero" style={{ backgroundImage: "linear-gradient(135deg, rgba(44, 24, 16, 0.85), rgba(74, 42, 27, 0.85)), url('/blog.png')" }}>
        <div className="blog-hero-content">
          <h1 className="blog-hero-title">
            <span className="hero-icon"><FaNewspaper /></span>
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
            defaultValue={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => { setSearchTerm(''); setCurrentPage(1); searchInputRef.current.value = ''; }}>
              <FaTimes />
            </button>
          )}
        </div>

        <div className="controls-right">
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
              title="Grid View"
            >
              <FaTh />
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <FaBars />
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
            <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}>
              <option value="all">All Categories</option>
              {blogCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {(searchTerm || selectedCategory !== 'all') && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="blog-results">
        <p>
          {blogs.length === 0 
            ? 'No articles found' 
            : `Showing ${totalBlogs} ${totalBlogs === 1 ? 'article' : 'articles'}`}
        </p>
      </div>

      {/* Blog Grid/List */}
      {blogs.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon"><FaSearch /></div>
          <h3>No articles found</h3>
          <p>Try adjusting your search or filter criteria</p>
          <button onClick={clearFilters} className="reset-btn">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className={`article-grid blog-${viewMode}`}>
          {getSortedBlogs().map((blog, index) => (
            <article 
              key={blog._id} 
              className={`article-card ${viewMode === 'list' ? 'list-view' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="article-card-image">
                {blog.image ? (
                  <img src={blog.image} alt={blog.title} loading="lazy" />
                ) : (
                  <div className="image-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-secondary)', fontSize: '3rem' }}><FaNewspaper /></div>
                )}
                <div className="article-card-overlay">
                  <button className="quick-view-btn" onClick={() => openBlogModal(blog)}>
                    Quick Read
                  </button>
                </div>
              </div>
              
              <div className="article-card-content">
                <div className="article-meta">
                  <span className="article-date">
                    <FaCalendar /> {formatDate(blog.createdAt)}
                  </span>
                  {blog.authorName && (
                    <span className="article-author" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <FaUser /> {blog.authorName}
                    </span>
                  )}
                  {blog.category && (
                    <span className="article-category">{blog.category}</span>
                  )}
                  <span className="article-read-time">
                    <FaClock /> {Math.ceil((blog.content || '').length / 1000)} min read
                  </span>
                </div>
                
                <h3 className="article-title">{blog.title}</h3>
                
                <p className="article-excerpt">
                  {truncateText(blog.content || 'No content available', 150)}
                </p>
                
                <div className="article-footer">
                  <div className="story-tags" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {blog.tags?.slice(0, 2).map((tag, i) => (
                      <span key={i} className="story-tag" style={{ background: 'var(--bg-secondary)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>#{tag}</span>
                    ))}
                  </div>
                  <button className="article-read-more" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--brand-brown)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => openBlogModal(blog)}>
                    Read More <FaArrowRight />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
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
                <span><FaClock /> {Math.ceil((selectedBlog.content || '').length / 1000)} min read</span>
              </div>
              
              <h2 className="modal-title">{selectedBlog.title}</h2>
              {selectedBlog.authorName && (
                <p className="modal-author" style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: '-0.5rem 0 1.25rem 0', fontWeight: 'bold' }}>
                  By {selectedBlog.authorName}
                </p>
              )}
              
              <div className="modal-content" style={{ marginTop: '1.25rem' }}>
                {formatContent(selectedBlog.content)}
              </div>

              {/* Dynamic Comments System embedded inside modal */}
              <BlogComments blogId={selectedBlog._id} token={token} />
            </div>
            
            <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className={`like-btn ${selectedBlog.likes?.includes(currentUser?.id || currentUser?._id) ? 'active' : ''}`}
                  onClick={() => handleLike(selectedBlog._id)}
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    background: selectedBlog.likes?.includes(currentUser?.id || currentUser?._id) ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)', 
                    padding: '0.4rem 0.8rem', 
                    borderRadius: 'var(--radius-sm)', 
                    cursor: 'pointer',
                    color: selectedBlog.likes?.includes(currentUser?.id || currentUser?._id) ? '#ef4444' : 'var(--text-primary)',
                    fontWeight: 'bold',
                    fontSize: '0.85rem'
                  }}
                >
                  <FaHeart /> {selectedBlog.likes?.length || 0} Likes
                </button>
                <button 
                  className={`bookmark-btn ${JSON.parse(sessionStorage.getItem('user') || '{}').bookmarkedBlogs?.includes(selectedBlog._id) ? 'active' : ''}`}
                  onClick={() => handleBookmark(selectedBlog._id)}
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    background: JSON.parse(sessionStorage.getItem('user') || '{}').bookmarkedBlogs?.includes(selectedBlog._id) ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)', 
                    padding: '0.4rem 0.8rem', 
                    borderRadius: 'var(--radius-sm)', 
                    cursor: 'pointer',
                    color: JSON.parse(sessionStorage.getItem('user') || '{}').bookmarkedBlogs?.includes(selectedBlog._id) ? '#f59e0b' : 'var(--text-primary)',
                    fontWeight: 'bold',
                    fontSize: '0.85rem'
                  }}
                >
                  <FaBookmark /> Bookmark
                </button>
              </div>
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