import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import { Link } from 'react-router-dom';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import './Home.css';
import MeasurementConverter from './MeasurementConverter';

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <h1>Welcome to Forgotten Recipes</h1>
        <p>Preserving Sri Lanka’s ancient flavors with a modern twist</p>
        <div className="hero-buttons">
          <Link to="/recipes" className="btn">Explore Recipes</Link>
          <Link to="/login" className="btn btn-outline">Join Now</Link>
        </div>
      </section>

      <section style={{ textAlign: 'center', margin: '1rem 0' }}>
  <Link to="/convert">
    <button className="btn">Use Measurement Converter?</button>
  </Link>
</section>


      {/* Carousel Section */}
      <section className="carousel-section">
        <Carousel
          autoPlay
          infiniteLoop
          showThumbs={false}
          showStatus={false}
          interval={4000}
          dynamicHeight={false}
        >
          <div>
            <img src="/carousel1.jpg" alt="Ambulthiyal" />
            <p className="legend">Traditional Fish Ambulthiyal</p>
          </div>
          <div>
            <img src="/carousel2.jpg" alt="Kiribath" />
            <p className="legend">Kiribath for Avurudu</p>
          </div>
          <div>
            <img src="/carousel3.jpg" alt="Hoppers" />
            <p className="legend">Egg Hoppers with Lunu Miris</p>
          </div>
        </Carousel>
      </section>

      {/* About Preview */}
      <section className="about-preview">
        <h2>Why Forgotten Recipes?</h2>
        <p>
          We revive long-lost family recipes and Sri Lankan culinary traditions through community-driven cooking tools and cultural storytelling.
        </p>
        <Link to="/about" className="link">Learn more →</Link>
      </section>

      {/* Feature Highlights */}
      <section className="features">
        <div className="feature-card">
          <h3>Western Twist Tool</h3>
          <p>Modernize traditional recipes with western alternatives and updated nutrition info.</p>
        </div>
        <div className="feature-card">
          <h3>Nutrition Visualizer</h3>
          <p>See calories, macros, and ingredient health highlights instantly.</p>
        </div>
        <div className="feature-card">
          <h3>Festive Food Calendar</h3>
          <p>Browse recipes by Avurudu, Thai Pongal, and seasonal festivals.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;

