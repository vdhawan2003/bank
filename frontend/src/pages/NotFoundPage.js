import React from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css'; // <-- Import the CSS file

const NotFoundPage = () => {
  return (
    // Added className for container styling
    <div className="not-found-page-container">
      <h2>404 - Page Not Found</h2>
      <p>Sorry, the page you are looking for does not exist.</p>
      {/* The Link component (renders an <a> tag) will be styled by the CSS */}
      <Link to="/">Go to Home</Link>
    </div>
  );
};

export default NotFoundPage;