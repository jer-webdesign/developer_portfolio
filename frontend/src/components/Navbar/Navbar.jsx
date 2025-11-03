import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const NAV_LINKS = [
	{ id: 'home', label: 'Home', icon: '🏠' },
	{ id: 'about', label: 'About', icon: '👨‍💼' },
	{ id: 'skills', label: 'Skills', icon: '💡' },
	{ id: 'projects', label: 'Projects', icon: '🚀' },
	{ id: 'blog', label: 'Blog', icon: '📝' },
	{ id: 'contact', label: 'Contact', icon: '✉️' }
];

const Navbar = ({ activeSection, navigateToSection, mobileMenuOpen, setMobileMenuOpen, onLoginClick, onRegisterClick }) => {
	const { user, isAuthenticated, isAdmin, logout } = useAuth();
	const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
	const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
	const dropdownRef = useRef(null);

	// Debug logging
	console.log('Navbar - user object:', user);
	console.log('Navbar - user.role:', user?.role);
	console.log('Navbar - isAdmin:', isAdmin);

	// Handle admin dashboard click
	const handleAdminDashboardClick = () => {
		if (isAdmin) {
			navigateToSection('admin');
		} else {
			setShowAccessDeniedModal(true);
		}
	};

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setProfileDropdownOpen(false);
			}
		};

		if (profileDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [profileDropdownOpen]);

	return (
		<nav className="nav" id="nav" aria-label="Main navigation">
			<div className="nav-container">
				<a className="nav-logo" href="#home" onClick={e => { e.preventDefault(); navigateToSection('home'); }} tabIndex={0} aria-label="Go to Home">
					<img src="/dev_logo.png" alt="Developer Logo" />
					<span className="nav-logo-text">Dev Portfolio</span>
				</a>
				<button
					className="nav-toggle"
					aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
					aria-expanded={mobileMenuOpen}
					aria-controls="main-menu"
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
				>
					<span aria-hidden="true">&#9776;</span>
				</button>
				<ul
					id="main-menu"
					className={`nav-menu${mobileMenuOpen ? ' open' : ''}`}
					role="menubar"
				>
					{NAV_LINKS.map((item) => (
						<li
							key={item.id}
							className={`nav-item${activeSection === item.id ? ' active' : ''}`}
							role="menuitem"
							tabIndex={0}
							aria-current={activeSection === item.id ? 'page' : undefined}
							data-tooltip={item.label}
							onClick={() => navigateToSection(item.id)}
							onKeyDown={e => {
								if (e.key === 'Enter' || e.key === ' ') navigateToSection(item.id);
							}}
						>
							<span className="nav-item-icon">{item.icon}</span>
							<span className="nav-item-text">{item.label}</span>
						</li>
					))}
					{isAuthenticated && (
						<li
							className={`nav-item${activeSection === 'create-portfolio' ? ' active' : ''}`}
							role="menuitem"
							tabIndex={0}
							aria-current={activeSection === 'create-portfolio' ? 'page' : undefined}
							data-tooltip="Create Portfolio"
							onClick={() => navigateToSection('create-portfolio')}
							onKeyDown={e => {
								if (e.key === 'Enter' || e.key === ' ') navigateToSection('create-portfolio');
							}}
						>
							<span className="nav-item-icon">✏️</span>
							<span className="nav-item-text">Create Portfolio</span>
						</li>
					)}
					{/* Only show Admin Dashboard link when user is authenticated */}
					{isAuthenticated && (
						<li
							className={`nav-item${activeSection === 'admin' ? ' active' : ''}`}
							role="menuitem"
							tabIndex={0}
							aria-current={activeSection === 'admin' ? 'page' : undefined}
							data-tooltip="Admin Dashboard"
							onClick={handleAdminDashboardClick}
							onKeyDown={e => {
								if (e.key === 'Enter' || e.key === ' ') handleAdminDashboardClick();
							}}
						>
							<span className="nav-item-icon">🛡️</span>
							<span className="nav-item-text">Admin Dashboard</span>
						</li>
					)}
					{isAuthenticated ? (
						<li className="nav-item nav-profile-dropdown" ref={dropdownRef}>
							<button 
								className="nav-user-badge"
								onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
								aria-expanded={profileDropdownOpen}
								aria-haspopup="true"
							>
								Hi, {user?.username || 'User'}
								<span className="dropdown-arrow">▼</span>
							</button>
							{profileDropdownOpen && (
								<ul className="profile-dropdown-menu">
									<li 
										onClick={() => {
											setProfileDropdownOpen(false);
											navigateToSection('profile');
										}}
									>
										{isAdmin ? 'Admin Profile' : 'User Profile'}
									</li>
									<li 
										onClick={() => {
											setProfileDropdownOpen(false);
											logout();
										}}
									>
										Logout
									</li>
								</ul>
							)}
						</li>
					) : (
						<>
							<li className="nav-item nav-auth-btn" role="menuitem" tabIndex={0} onClick={onLoginClick}>
								Login
							</li>
							<li className="nav-item nav-auth-btn-primary" role="menuitem" tabIndex={0} onClick={onRegisterClick}>
								Sign Up
							</li>
						</>
					)}
				</ul>
			</div>

			{/* Access Denied Modal */}
			{showAccessDeniedModal && (
				<div className="modal-overlay" onClick={() => setShowAccessDeniedModal(false)}>
					<div className="access-denied-modal" onClick={e => e.stopPropagation()}>
						<div className="modal-header">
							<h3>🚫 Access Denied</h3>
							<button 
								className="modal-close-btn"
								onClick={() => setShowAccessDeniedModal(false)}
								aria-label="Close modal"
							>
								×
							</button>
						</div>
						<div className="modal-content">
							<div className="access-denied-icon">🛡️</div>
							<h4>Admin Access Required</h4>
							<p>
								The Admin Dashboard is a <strong>protected</strong> that requires administrator privileges. 
								Only users with admin role can access this area.
							</p>
							<div className="access-denied-suggestion">
								<p><strong>Your Current Role:</strong> {user?.role || 'User'}</p>
								<p><strong>Required Role:</strong> Admin</p>
								<p>Contact the system administrator if you need admin access.</p>
							</div>
						</div>
						<div className="modal-footer">
							<button 
								className="btn btn-primary"
								onClick={() => setShowAccessDeniedModal(false)}
							>
								Got it
							</button>
						</div>
					</div>
				</div>
			)}
		</nav>
	);
};

export default Navbar;
