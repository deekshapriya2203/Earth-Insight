import React from 'react';
import { Link } from 'react-router-dom';
import NewsletterSignup from '../components/NewsLetterSignup';
import './styles/home.css';

function HomePage() {
  return (
    <div className="home-container">
      <h1 className="home-title"> Welcome to Earth Insight!</h1>
      

      <div className="home-buttons">
        <Link to="/login" className="login-btn">Login</Link>
        <Link to="/signup" className="signup-btn">Sign Up</Link>
      </div>
      <p className="home-subtext">Get weekly eco tips straight to your inbox!</p>
      <div className="newsletter-box">
        <NewsletterSignup />
      </div>
    </div>
  );
}
export default HomePage;
