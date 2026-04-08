import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      <section className="about-hero">
        <h1>About Forgotten Recipes</h1>
        <p>
          A digital gateway to Sri Lanka's ancient culinary heritage . reborn through culture, community, and creativity.
        </p>
      </section>

      <section className="about-section">
        <h2>Our Mission</h2>
        <p>
          Forgotten Recipes is dedicated to conserving and celebrating Sri Lanka’s rich food traditions.from generation old family dishes to seasonal festival meals by combining ancestral knowledge with modern technology.
        </p>
      </section>

      <section className="about-section">
        <h2>Why It Matters</h2>
        <p>
          With rapid modernization, many of our island’s most flavorful, healthy, and meaningful recipes are fading into history. By capturing these culinary gems in a digital format, we not only preserve them but also make them accessible to the world.
        </p>
      </section>

      <section className="about-section">
        <h2>How You Can Contribute</h2>
        <ul>
          <li>Submit long-lost family recipes to our archive</li>
          <li>Try the Western Twist Tool and share your creations</li>
          <li>Engage with our blog and food calendar</li>
          <li>Chat with our dieticians and learn healthier options</li>
        </ul>
      </section>

      <section className="about-footer">
        <p>Let’s rediscover, reimagine, and relive Sri Lanka’s food legacy . one recipe at a time.</p>
      </section>
    </div>
  );
};

export default About;
