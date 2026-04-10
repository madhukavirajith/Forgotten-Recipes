// client/src/components/About.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './About.css';

// Import icons
import { 
  FaHeart, 
  FaLeaf, 
  FaUsers, 
  FaUtensils, 
  FaLightbulb,
  FaChartLine,
  FaCalendarAlt,
  FaComments,
  FaBookOpen,
  FaHandsHelping,
  FaGlobe,
  FaAward,
  FaQuoteLeft,
  FaArrowRight,
  FaPlay,
  FaPause,
  FaCheckCircle,
  FaStar,
  FaSeedling,
  FaHistory,
  FaMobile,
  FaShieldAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube
} from 'react-icons/fa';

const About = () => {
  const [activeSection, setActiveSection] = useState('mission');
  const [statsVisible, setStatsVisible] = useState(false);
  const [stats, setStats] = useState({
    recipes: 0,
    users: 0,
    stories: 0,
    years: 0
  });
  const statsRef = useRef(null);
  const videoRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Stats animation
  useEffect(() => {
    const targetStats = {
      recipes: 250,
      users: 12500,
      stories: 45,
      years: 500
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !statsVisible) {
          setStatsVisible(true);
          const duration = 2000;
          const stepTime = 20;
          const steps = duration / stepTime;
          let currentStep = 0;

          const interval = setInterval(() => {
            currentStep++;
            if (currentStep <= steps) {
              setStats({
                recipes: Math.floor((targetStats.recipes * currentStep) / steps),
                users: Math.floor((targetStats.users * currentStep) / steps),
                stories: Math.floor((targetStats.stories * currentStep) / steps),
                years: Math.floor((targetStats.years * currentStep) / steps)
              });
            } else {
              clearInterval(interval);
            }
          }, stepTime);
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [statsVisible]);

  // Scroll spy for active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['mission', 'why', 'contribute', 'vision'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Team members data
  const teamMembers = [
    {
      id: 1,
      name: "Amara Weerasinghe",
      role: "Founder & Culinary Historian",
      bio: "Passionate about preserving Sri Lanka's culinary heritage for future generations.",
      image: "/amara.png",
      social: { twitter: "#", linkedin: "#" }
    },
    {
      id: 2,
      name: "Chef Ruwan Perera",
      role: "Head of Culinary Innovation",
      bio: "Modernizing traditional recipes while keeping their authentic essence alive.",
      image: "/chef.png",
      social: { twitter: "#", linkedin: "#" }
    },
    {
      id: 3,
      name: "Dr. Nimali Silva",
      role: "Nutrition Advisor",
      bio: "Ensuring our recipes are not just delicious but also nutritionally balanced.",
      image: "/nimali.png",
      social: { twitter: "#", linkedin: "#" }
    }
  ];

  // Milestones data
  const milestones = [
    { year: "2020", title: "Founded", description: "Forgotten Recipes was born from a passion to preserve Sri Lankan cuisine" },
    { year: "2021", title: "First 100 Recipes", description: "Reached 100 authentic Sri Lankan recipes in our archive" },
    { year: "2022", title: "Community Growth", description: "10,000+ members joined our community" },
    { year: "2023", title: "Global Recognition", description: "Featured in international food publications" },
    { year: "2024", title: "Innovation Launch", description: "Launched Western Twist Tool & Nutrition Visualizer" }
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-overlay"></div>
        <div className="about-hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🇱🇰</span>
            <span className="badge-text">Est. 2020</span>
          </div>
          <h1 className="about-hero-title">
            About Forgotten Recipes
          </h1>
          <p className="about-hero-subtitle">
            A digital gateway to Sri Lanka's ancient culinary heritage — reborn through culture, community, and creativity.
          </p>
          <div className="hero-stats" ref={statsRef}>
            <div className="hero-stat">
              <div className="hero-stat-number">{stats.recipes}+</div>
              <div className="hero-stat-label">Recipes</div>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <div className="hero-stat-number">{stats.users.toLocaleString()}+</div>
              <div className="hero-stat-label">Members</div>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <div className="hero-stat-number">{stats.stories}+</div>
              <div className="hero-stat-label">Stories</div>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <div className="hero-stat-number">{stats.years}+</div>
              <div className="hero-stat-label">Years Heritage</div>
            </div>
          </div>
        </div>
        <div className="about-hero-wave">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 64L60 69.3C120 75 240 85 360 80C480 75 600 53 720 48C840 43 960 53 1080 58.7C1200 64 1320 64 1380 64L1440 64L1440 120L1380 120C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120L0 120Z" fill="#FFF9F2"/>
          </svg>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="about-nav">
        <div className="about-nav-container">
          <button 
            className={`nav-tab ${activeSection === 'mission' ? 'active' : ''}`}
            onClick={() => scrollToSection('mission')}
          >
            <FaHeart /> Mission
          </button>
          <button 
            className={`nav-tab ${activeSection === 'why' ? 'active' : ''}`}
            onClick={() => scrollToSection('why')}
          >
            <FaLeaf /> Why It Matters
          </button>
          <button 
            className={`nav-tab ${activeSection === 'contribute' ? 'active' : ''}`}
            onClick={() => scrollToSection('contribute')}
          >
            <FaHandsHelping /> Contribute
          </button>
          <button 
            className={`nav-tab ${activeSection === 'vision' ? 'active' : ''}`}
            onClick={() => scrollToSection('vision')}
          >
            <FaGlobe /> Vision
          </button>
        </div>
      </div>

      {/* Mission Section */}
      <section id="mission" className="about-section mission-section">
        <div className="section-container">
          <div className="section-content">
            <div className="section-badge">Our Mission</div>
            <h2>Preserving Sri Lanka's<br />Culinary Heritage</h2>
            <p>
              Forgotten Recipes is dedicated to conserving and celebrating Sri Lanka's rich food traditions — 
              from generation-old family dishes to seasonal festival meals — by combining ancestral knowledge 
              with modern technology.
            </p>
            <div className="mission-cards">
              <div className="mission-card">
                <div className="mission-icon">📚</div>
                <h3>Archive</h3>
                <p>Collecting and preserving traditional recipes from across Sri Lanka</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">🌍</div>
                <h3>Share</h3>
                <p>Making Sri Lankan cuisine accessible to the world</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">💡</div>
                <h3>Innovate</h3>
                <p>Modernizing traditional recipes for contemporary kitchens</p>
              </div>
            </div>
          </div>
          <div className="section-image">
            <div className="image-placeholder">
              <img src="/hero-bg.jpg" alt="Sri Lankan cuisine" />
            </div>
          </div>
        </div>
      </section>

      {/* Why It Matters Section */}
      <section id="why" className="about-section why-section">
        <div className="section-container reverse">
          <div className="section-content">
            <div className="section-badge">Why It Matters</div>
            <h2>Fading Flavors,<br />Lost Traditions</h2>
            <p>
              With rapid modernization, many of our island's most flavorful, healthy, and meaningful recipes 
              are fading into history. By capturing these culinary gems in a digital format, we not only 
              preserve them but also make them accessible to the world.
            </p>
            <div className="impact-stats">
              <div className="impact-stat">
                <div className="impact-number">70%</div>
                <div className="impact-label">Traditional recipes at risk</div>
              </div>
              <div className="impact-stat">
                <div className="impact-number">3+</div>
                <div className="impact-label">Generations of knowledge</div>
              </div>
              <div className="impact-stat">
                <div className="impact-number">25+</div>
                <div className="impact-label">Regional cuisines</div>
              </div>
            </div>
          </div>
          <div className="section-image">
            <div className="video-container">
              <video 
                ref={videoRef}
                poster="/about-video-poster.jpg"
                className="about-video"
              >
                <source src="/about-video.mp4" type="video/mp4" />
              </video>
              <button className="video-play-btn" onClick={toggleVideo}>
                {isVideoPlaying ? <FaPause /> : <FaPlay />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How You Can Contribute Section */}
      <section id="contribute" className="about-section contribute-section">
        <div className="section-container">
          <div className="section-content full-width">
            <div className="section-badge">Join Our Community</div>
            <h2>How You Can Contribute</h2>
            <p className="contribute-subtitle">
              Everyone has a role in preserving Sri Lanka's culinary heritage
            </p>
            <div className="contribute-grid">
              <div className="contribute-card">
                <div className="contribute-icon">📝</div>
                <h3>Submit Recipes</h3>
                <p>Share long-lost family recipes to our growing archive</p>
                <Link to="/login" className="contribute-link">
                  Submit Recipe <FaArrowRight />
                </Link>
              </div>
              <div className="contribute-card">
                <div className="contribute-icon">🔄</div>
                <h3>Western Twist Tool</h3>
                <p>Try our innovative tool and share your creations</p>
                <Link to="/twist-tool" className="contribute-link">
                  Try It Now <FaArrowRight />
                </Link>
              </div>
              <div className="contribute-card">
                <div className="contribute-icon">📖</div>
                <h3>Engage & Learn</h3>
                <p>Read our blog, explore the food calendar, and share stories</p>
                <Link to="/blog" className="contribute-link">
                  Explore Content <FaArrowRight />
                </Link>
              </div>
              <div className="contribute-card">
                <div className="contribute-icon">💬</div>
                <h3>Chat with Experts</h3>
                <p>Connect with our dieticians and learn healthier options</p>
                <Link to="/chat" className="contribute-link">
                  Start Chatting <FaArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Vision Section */}
      <section id="vision" className="about-section vision-section">
        <div className="section-container">
          <div className="section-content">
            <div className="section-badge">Our Vision</div>
            <h2>A Future Where<br />Tradition Thrives</h2>
            <p>
              We envision a world where every Sri Lankan recipe, no matter how old or obscure, 
              is preserved, celebrated, and passed down to future generations. A world where 
              technology serves heritage, and where every kitchen becomes a gateway to our 
              island's rich culinary past.
            </p>
            <div className="vision-quote">
              <FaQuoteLeft className="quote-icon" />
              <p>"Let's rediscover, reimagine, and relive Sri Lanka's food legacy — one recipe at a time."</p>
            </div>
          </div>
          <div className="section-image">
            <div className="milestones-timeline">
              <h3>Our Journey</h3>
              {milestones.map((milestone, index) => (
                <div key={index} className="milestone-item">
                  <div className="milestone-year">{milestone.year}</div>
                  <div className="milestone-content">
                    <h4>{milestone.title}</h4>
                    <p>{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="about-section team-section">
        <div className="section-container">
          <div className="section-content full-width">
            <div className="section-badge">Meet the Team</div>
            <h2>The People Behind<br />Forgotten Recipes</h2>
            <p className="team-subtitle">
              Passionate individuals dedicated to preserving Sri Lanka's culinary heritage
            </p>
            <div className="team-grid">
              {teamMembers.map((member) => (
                <div key={member.id} className="team-card">
                  <div className="team-image">
                    <img src={member.image} alt={member.name} />
                    <div className="team-social">
                      <a href={member.social.twitter} target="_blank" rel="noopener noreferrer">🐦</a>
                      <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer">🔗</a>
                    </div>
                  </div>
                  <div className="team-info">
                    <h3>{member.name}</h3>
                    <p className="team-role">{member.role}</p>
                    <p className="team-bio">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-section values-section">
        <div className="section-container">
          <div className="section-content full-width">
            <div className="section-badge">Our Values</div>
            <h2>What Guides Us</h2>
            <div className="values-grid">
              <div className="value-card">
                <FaSeedling className="value-icon" />
                <h3>Authenticity</h3>
                <p>We honor traditional recipes and cooking methods</p>
              </div>
              <div className="value-card">
                <FaUsers className="value-icon" />
                <h3>Community</h3>
                <p>Built by and for food lovers everywhere</p>
              </div>
              <div className="value-card">
                <FaHeart className="value-icon" />
                <h3>Passion</h3>
                <p>Driven by love for Sri Lankan cuisine</p>
              </div>
              <div className="value-card">
                <FaGlobe className="value-icon" />
                <h3>Accessibility</h3>
                <p>Making heritage available to everyone</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="cta-content">
          <h2>Ready to Be Part of Our Story?</h2>
          <p>Join thousands of food lovers preserving Sri Lanka's culinary heritage</p>
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary">Join Now</Link>
            <Link to="/recipes" className="btn btn-outline">Explore Recipes</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;