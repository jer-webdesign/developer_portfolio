import React from 'react';
import './Header.css';

const Header = () => (
  <header className="header">
    <div className="header-logo">
      <img src="/logo192.png" alt="Logo" />
    </div>
    <nav className="header-nav">
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#skills">Skills</a></li>
        <li><a href="#projects">Projects</a></li>
        <li><a href="#blog">Blog</a></li>
        <li><a href="#contact" className="contact-link">Contact</a></li>
      </ul>
    </nav>
  </header>
);

export default Header;
