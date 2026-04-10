// client/src/components/Home.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Carousel } from 'react-responsive-carousel';
import { Link, useNavigate } from 'react-router-dom';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import './Home.css';

// Import icons
import { 
  FaArrowRight, 
  FaUtensils, 
  FaChartLine, 
  FaCalendarAlt,
  FaLeaf,
  FaUsers,
  FaHeart,
  FaStar,
  FaChevronRight,
  FaPlay,
  FaPause,
  FaQuoteLeft,
  FaSearch,
  FaClock,
  FaFire,
  FaAward,
  FaRegBookmark,
  FaShareAlt,
  FaThumbsUp
} from 'react-icons/fa';

const Home = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVisible, setIsVisible] = useState({});
  const [hoveredRecipe, setHoveredRecipe] = useState(null);
  const [stats, setStats] = useState({
    recipes: 0,
    stories: 0,
    users: 0,
    festivals: 0
  });
  
  const carouselRef = useRef(null);
  const statsRef = useRef(null);
  const observerRef = useRef(null);

  // Stats animation with Intersection Observer
  useEffect(() => {
    const targetStats = {
      recipes: 250,
      stories: 45,
      users: 12500,
      festivals: 12
    };

    const animateStats = () => {
      const duration = 2000;
      const stepTime = 20;
      const steps = duration / stepTime;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        if (currentStep <= steps) {
          setStats({
            recipes: Math.floor((targetStats.recipes * currentStep) / steps),
            stories: Math.floor((targetStats.stories * currentStep) / steps),
            users: Math.floor((targetStats.users * currentStep) / steps),
            festivals: Math.floor((targetStats.festivals * currentStep) / steps)
          });
        } else {
          clearInterval(interval);
        }
      }, stepTime);
    };

    // Intersection Observer to trigger animation when stats come into view
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateStats();
          observerRef.current?.disconnect();
        }
      });
    }, { threshold: 0.3 });

    if (statsRef.current) {
      observerRef.current.observe(statsRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, []);

  // Scroll reveal animation
  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.reveal-on-scroll');
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight - 100;
        if (isVisible) {
          el.classList.add('revealed');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-play carousel control
  const toggleAutoPlay = useCallback(() => {
    setIsPlaying(!isPlaying);
    if (isPlaying) {
      carouselRef.current?.pause();
    } else {
      carouselRef.current?.play();
    }
  }, [isPlaying]);

  // Carousel items data
  const carouselItems = [
    {
      image: "/carousel1.jpg",
      title: "Ambul Thiyal",
      subtitle: "Traditional Sour Fish Curry",
      description: "A beloved Sri Lankan classic from the southern coast, slow-cooked with goraka for that perfect tangy flavor.",
      color: "#D2691E",
      prepTime: "45 mins",
      difficulty: "Medium",
      category: "Seafood"
    },
    {
      image: "/carousel2.jpg",
      title: "Kiri Bath",
      subtitle: "Sacred Milk Rice",
      description: "The heart of Sri Lankan celebrations, this creamy rice dish symbolizes prosperity and unity.",
      color: "#F5E6D3",
      prepTime: "30 mins",
      difficulty: "Easy",
      category: "Traditional"
    },
    {
      image: "/carousel3.jpg",
      title: "Egg Hoppers",
      subtitle: "Appa with a Sunny Side Up",
      description: "Crispy edges, soft center, and a perfectly runny egg - a breakfast favorite across the island.",
      color: "#FFD700",
      prepTime: "25 mins",
      difficulty: "Medium",
      category: "Breakfast"
    }
  ];

  // Featured recipes data
  const featuredRecipes = [
    {
      id: 1,
      name: "Chicken Curry",
      culture: "Sri Lankan",
      difficulty: "Medium",
      time: "45 min",
      image: "/chicken.jpg",
      rating: 4.8,
      reviews: 234,
      calories: "420 kcal",
      isNew: false,
      isPopular: true
    },
    {
      id: 2,
      name: "Pol Sambol",
      culture: "Sri Lankan",
      difficulty: "Easy",
      time: "10 min",
      image: "/Polsambol.jpg",
      rating: 4.9,
      reviews: 567,
      calories: "180 kcal",
      isNew: true,
      isPopular: true
    },
    {
      id: 3,
      name: "Watalappan",
      culture: "Sri Lankan",
      difficulty: "Medium",
      time: "60 min",
      image: "/watalappan.jpg",
      rating: 4.7,
      reviews: 189,
      calories: "350 kcal",
      isNew: false,
      isPopular: false
    }
  ];

  // Tools data
  const tools = [
    {
      id: 1,
      title: "Western Twist Tool",
      description: "Modernize traditional recipes with western alternatives and updated nutrition info.",
      icon: <FaUtensils />,
      link: "/twist-tool",
      color: "#D2691E"
    },
    {
      id: 2,
      title: "Nutrition Visualizer",
      description: "See calories, macros, and ingredient health highlights instantly.",
      icon: <FaChartLine />,
      link: "/recipes",
      color: "#e6a817"
    },
    {
      id: 3,
      title: "Festive Food Calendar",
      description: "Browse recipes by Avurudu, Thai Pongal, and seasonal festivals.",
      icon: <FaCalendarAlt />,
      link: "/calendar",
      color: "#5A2E17"
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      id: 1,
      name: "Amara Silva",
      role: "Home Cook",
      text: "Finally found a place that celebrates our authentic Sri Lankan recipes! My grandmother's dishes live on through this platform.",
      avatar: "/amara.png",
      rating: 5,
      location: "Colombo, Sri Lanka"
    },
    {
      id: 2,
      name: "Chef Ruwan",
      role: "Professional Chef",
      text: "The Western Twist Tool is brilliant! It helps me adapt traditional recipes for modern kitchens while preserving authenticity.",
      avatar: "/chef.png",
      rating: 5,
      location: "Melbourne, Australia"
    },
    {
      id: 3,
      name: "Nimal Perera",
      role: "Food Blogger",
      text: "An incredible resource for anyone wanting to explore Sri Lankan cuisine. The cultural stories add so much depth.",
      avatar: "/blogger.png",
      rating: 5,
      location: "London, UK"
    }
  ];

  // Stats data
  const statsData = [
    { value: stats.recipes, label: "Recipes", icon: <FaUtensils />, suffix: "+" },
    { value: stats.stories, label: "Stories", icon: <FaQuoteLeft />, suffix: "+" },
    { value: stats.users.toLocaleString(), label: "Members", icon: <FaUsers />, suffix: "+" },
    { value: stats.festivals, label: "Festivals", icon: <FaCalendarAlt />, suffix: "" }
  ];

  // Handle recipe click
  const handleRecipeClick = (recipeId) => {
    navigate(`/recipes/${recipeId}`);
  };

  // Share recipe
  const handleShare = (recipeName, event) => {
    event.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: recipeName,
        text: `Check out this delicious Sri Lankan recipe: ${recipeName}`,
        url: window.location.href
      });
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{ animationDelay: `${i * 0.5}s` }} />
          ))}
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badge animate-badge">
            <span className="badge-icon">🇱🇰</span>
            <span className="badge-text">Sri Lankan Cuisine</span>
          </div>
          <h1 className="hero-title">
            <span className="title-line">Welcome to</span>
            <span className="title-brand">Forgotten Recipes</span>
          </h1>
          <p className="hero-subtitle">
            Preserving Sri Lanka's ancient flavors with a modern twist
          </p>
          <div className="hero-buttons">
            <Link to="/recipes" className="btn btn-primary">
              <FaUtensils /> Explore Recipes
              <FaArrowRight className="btn-icon" />
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Join Now
            </Link>
          </div>
          <div className="hero-stats" ref={statsRef}>
            {statsData.map((stat, index) => (
              <React.Fragment key={index}>
                <div className="stat-item">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-number">{stat.value}{stat.suffix}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
                {index < statsData.length - 1 && <div className="stat-divider"></div>}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 64L60 69.3C120 75 240 85 360 80C480 75 600 53 720 48C840 43 960 53 1080 58.7C1200 64 1320 64 1380 64L1440 64L1440 120L1380 120C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120L0 120Z" fill="#FFF9F2"/>
          </svg>
        </div>
      </section>

      {/* Converter Tool Section */}
      <section className="converter-section reveal-on-scroll">
        <div className="converter-card">
          <div className="converter-icon-wrapper">
            <div className="converter-icon">🔄</div>
          </div>
          <div className="converter-content">
            <h3>Need to convert measurements?</h3>
            <p>Quickly convert between metric and imperial units for perfect results every time.</p>
          </div>
          <Link to="/convert" className="converter-btn">
            Use Measurement Converter
            <FaArrowRight className="btn-icon" />
          </Link>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="carousel-section reveal-on-scroll">
        <div className="section-header">
          <div className="section-badge-wrapper">
            <span className="section-badge-small">Featured Dishes</span>
          </div>
          <h2>Discover Sri Lankan<br />Culinary Treasures</h2>
          <p className="section-subtitle">Explore authentic dishes passed down through generations</p>
          <div className="carousel-controls">
            <button className="carousel-play-btn" onClick={toggleAutoPlay} aria-label={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
          </div>
        </div>
        <div className="carousel-wrapper">
          <Carousel
            ref={carouselRef}
            autoPlay={isPlaying}
            infiniteLoop
            showThumbs={false}
            showStatus={false}
            interval={5000}
            onChange={(index) => setCurrentSlide(index)}
            renderIndicator={(onClickHandler, isSelected, index, label) => (
              <button
                key={index}
                className={`carousel-dot ${isSelected ? 'active' : ''}`}
                onClick={onClickHandler}
                aria-label={`Go to slide ${index + 1}`}
              />
            )}
          >
            {carouselItems.map((item, index) => (
              <div key={index} className="carousel-slide">
                <div className="carousel-image-wrapper">
                  <img src={item.image} alt={item.title} loading="lazy" />
                  <div className="carousel-overlay" style={{ background: `linear-gradient(90deg, ${item.color}CC 0%, transparent 100%)` }}></div>
                  <div className="carousel-badges">
                    <span className="carousel-badge">{item.category}</span>
                    <span className="carousel-badge">{item.difficulty}</span>
                  </div>
                </div>
                <div className="carousel-caption">
                  <div className="caption-badge" style={{ background: item.color }}>Featured</div>
                  <h3>{item.title}</h3>
                  <p className="caption-subtitle">{item.subtitle}</p>
                  <p className="caption-description">{item.description}</p>
                  <div className="caption-meta">
                    <span><FaClock /> {item.prepTime}</span>
                  </div>
                  <Link to={`/recipes?search=${item.title}`} className="caption-link">
                    Discover Recipe <FaChevronRight />
                  </Link>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="about-preview reveal-on-scroll">
        <div className="about-content">
          <div className="about-text">
            <div className="section-badge">Our Mission</div>
            <h2>Why Forgotten Recipes?</h2>
            <p>
              We revive long-lost family recipes and Sri Lankan culinary traditions through 
              community-driven cooking tools and cultural storytelling.
            </p>
            <div className="about-features">
              <div className="about-feature">
                <div className="feature-icon-wrapper">
                  <FaLeaf className="feature-icon" />
                </div>
                <div className="feature-text">
                  <h4>Authentic Recipes</h4>
                  <p>Time-honored recipes from Sri Lankan grandmothers</p>
                </div>
              </div>
              <div className="about-feature">
                <div className="feature-icon-wrapper">
                  <FaUsers className="feature-icon" />
                </div>
                <div className="feature-text">
                  <h4>Community Driven</h4>
                  <p>Share, learn, and grow with fellow food lovers</p>
                </div>
              </div>
              <div className="about-feature">
                <div className="feature-icon-wrapper">
                  <FaHeart className="feature-icon" />
                </div>
                <div className="feature-text">
                  <h4>Cultural Preservation</h4>
                  <p>Keeping Sri Lankan heritage alive through food</p>
                </div>
              </div>
            </div>
            <Link to="/about" className="about-link">
              Learn more about us <FaChevronRight />
            </Link>
          </div>
          <div className="about-stats-card">
            <div className="stat-circle">
              <div className="stat-circle-number">500+</div>
              <div className="stat-circle-label">Years of Heritage</div>
            </div>
            <div className="about-quote">
              <FaQuoteLeft className="quote-icon" />
              <p>"Food is our common ground, a universal experience that connects us to our roots."</p>
              <span className="quote-author">- Traditional Sri Lankan Proverb</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="tools-section reveal-on-scroll">
        <div className="section-header">
          <div className="section-badge-wrapper">
            <span className="section-badge-small">Powerful Tools</span>
          </div>
          <h2>Everything You Need to<br />Explore, Create & Share</h2>
          <p className="section-subtitle">Modern tools for traditional cooking</p>
        </div>
        <div className="tools-grid">
          {tools.map((tool, index) => (
            <div key={tool.id} className="tool-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="tool-icon-wrapper" style={{ background: `linear-gradient(135deg, ${tool.color}20 0%, ${tool.color}40 100%)` }}>
                <div className="tool-icon" style={{ color: tool.color }}>{tool.icon}</div>
              </div>
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
              <Link to={tool.link} className="tool-link">
                Try it now <FaChevronRight />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Recipes Section */}
      <section className="featured-recipes reveal-on-scroll">
        <div className="section-header">
          <div className="section-badge-wrapper">
            <span className="section-badge-small">Popular This Month</span>
          </div>
          <h2>Most Loved Recipes by<br />Our Community</h2>
          <p className="section-subtitle">Join thousands of home cooks enjoying these favorites</p>
        </div>
        <div className="recipes-grid">
          {featuredRecipes.map((recipe) => (
            <div 
              key={recipe.id} 
              className="recipe-card"
              onMouseEnter={() => setHoveredRecipe(recipe.id)}
              onMouseLeave={() => setHoveredRecipe(null)}
              onClick={() => handleRecipeClick(recipe.id)}
            >
              <div className="recipe-image-wrapper">
                <img src={recipe.image} alt={recipe.name} loading="lazy" />
                {recipe.isNew && <span className="recipe-badge new">New</span>}
                {recipe.isPopular && <span className="recipe-badge popular">🔥 Popular</span>}
                <button 
                  className="recipe-share-btn" 
                  onClick={(e) => handleShare(recipe.name, e)}
                  aria-label="Share recipe"
                >
                  <FaShareAlt />
                </button>
                <div className="recipe-overlay">
                  <button className="recipe-view-btn">View Recipe</button>
                </div>
              </div>
              <div className="recipe-info">
                <div className="recipe-header">
                  <h4>{recipe.name}</h4>
                  <div className="recipe-rating">
                    <FaStar className="star-icon" />
                    <span>{recipe.rating}</span>
                    <span className="reviews-count">({recipe.reviews})</span>
                  </div>
                </div>
                <div className="recipe-meta">
                  <span className="recipe-culture">{recipe.culture}</span>
                  <span className="recipe-time"><FaClock /> {recipe.time}</span>
                  <span className="recipe-calories"><FaFire /> {recipe.calories}</span>
                </div>
                <div className="recipe-difficulty">
                  <span className={`difficulty-badge ${recipe.difficulty.toLowerCase()}`}>
                    {recipe.difficulty}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="view-all">
          <Link to="/recipes" className="view-all-btn">
            View All Recipes <FaChevronRight />
          </Link>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section reveal-on-scroll">
        <div className="section-header">
          <div className="section-badge-wrapper">
            <span className="section-badge-small">Testimonials</span>
          </div>
          <h2>What Our Community Says</h2>
          <p className="section-subtitle">Join thousands of food lovers preserving Sri Lankan heritage</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={testimonial.id} className="testimonial-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="testimonial-rating">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <FaStar key={i} className="star-filled" />
                ))}
              </div>
              <p className="testimonial-text">"{testimonial.text}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <img src={testimonial.avatar} alt={testimonial.name} />
                </div>
                <div className="author-info">
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-role">{testimonial.role}</div>
                  <div className="author-location">{testimonial.location}</div>
                </div>
              </div>
              <div className="testimonial-quote-mark">"</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section reveal-on-scroll">
        <div className="cta-particles">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="cta-particle" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
        </div>
        <div className="cta-content">
          <div className="cta-icon">🍛</div>
          <h2>Ready to Start Your Culinary Journey?</h2>
          <p>Join our community and discover the rich heritage of Sri Lankan cuisine</p>
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary btn-large">
              Join Now <FaArrowRight className="btn-icon" />
            </Link>
            <Link to="/recipes" className="btn btn-outline btn-large">
              Explore Recipes
            </Link>
          </div>
          <div className="cta-features">
            <span>✓ Free Membership</span>
            <span>✓ Unlimited Recipes</span>
            <span>✓ Community Access</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;