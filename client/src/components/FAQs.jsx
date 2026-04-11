// client/src/components/FAQs.jsx
import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';
import './FAQs.css';

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      question: "How do I submit my own recipe?",
      answer: "To submit your own recipe, simply create an account and navigate to your Visitor Dashboard. There you'll find a 'Submit Recipe' form where you can share your culinary creation with our community."
    },
    {
      question: "Are all recipes authentic Sri Lankan?",
      answer: "Yes! All recipes on Forgotten Recipes are authentic Sri Lankan dishes, carefully curated and verified by our team of culinary experts and community members."
    },
    {
      question: "How does the Western Twist Tool work?",
      answer: "The Western Twist Tool allows you to adapt traditional Sri Lankan recipes using ingredients that are more readily available in Western countries. Simply select a recipe and the tool will suggest substitutions."
    },
    {
      question: "Is the nutrition information accurate?",
      answer: "Our nutrition information is provided by professional dietitians and is calculated based on standard ingredient portions. However, actual values may vary based on specific ingredients used."
    },
    {
      question: "How can I save recipes to my cookbook?",
      answer: "Once you're logged in, you'll see a 'Save to Cookbook' button on each recipe page. Click it to add the recipe to your personal collection."
    },
    {
      question: "What are the different user roles?",
      answer: "We have four user roles: Visitors (can submit recipes and save favorites), Head Chefs (approve recipes), Dietitians (add nutrition info), and Admins (manage the platform)."
    },
    {
      question: "How do I reset my password?",
      answer: "Click on 'Forgot Password' on the login page and enter your email address. You'll receive a link to reset your password."
    },
    {
      question: "Can I share recipes on social media?",
      answer: "Absolutely! Each recipe page has a share button that lets you share on Facebook, Twitter, WhatsApp, and more."
    },
    {
      question: "How often are new recipes added?",
      answer: "New recipes are added weekly by our community and approved by our head chefs. Subscribe to our newsletter to stay updated!"
    },
    {
      question: "Is there a mobile app available?",
      answer: "Currently, Forgotten Recipes is a web-based platform optimized for mobile devices. We're working on a native app for iOS and Android!"
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faqs-container">
      <div className="faqs-hero">
        <h1>Frequently Asked Questions</h1>
        <p>Find answers to common questions about Forgotten Recipes</p>
      </div>

      <div className="faqs-content">
        <div className="faqs-search">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="faqs-list">
          {filteredFaqs.length === 0 ? (
            <div className="no-results">
              <p>No questions found matching your search.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button className="faq-question" onClick={() => toggleFaq(index)}>
                  <span>{faq.question}</span>
                  {openIndex === index ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                <div className={`faq-answer ${openIndex === index ? 'open' : ''}`}>
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="faqs-contact">
          <h3>Still have questions?</h3>
          <p>Can't find the answer you're looking for? Please contact our support team.</p>
          <a href="/contact" className="contact-btn">Contact Us</a>
        </div>
      </div>
    </div>
  );
};

export default FAQs;