import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <span>&copy; {new Date().getFullYear()} Developer Portfolio. All rights reserved.</span>
    </div>
  </footer>
);

export default Footer;
