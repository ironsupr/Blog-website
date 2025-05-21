import React from 'react';
import '../../Css/Footer.css';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaGithub } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="footer">
                <div className="footer-content">
                    <div className="footer-section about">
                        <h2>StoryVerse</h2>
                        <p>A platform for sharing your thoughts, ideas, and stories with the world.</p>
                        <div className="social-icons">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer"><FaGithub /></a>
                        </div>
                    </div>
                    <div className="footer-section links">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/login">Login</Link></li>
                            <li><Link to="/register">Register</Link></li>
                            <li><Link to="/addstory">Add Story</Link></li>
                        </ul>
                    </div>
                    <div className="footer-section contact">
                        <h3>Contact Us</h3>
                        <p><i className="fas fa-envelope"></i> info@mernblog.com</p>
                        <p><i className="fas fa-phone"></i> +1 234 567 8900</p>
                        <p><i className="fas fa-map-marker-alt"></i> 123 Blog Street, Web Dev City</p>
                    </div>
                </div>
            </div>
            <div className="copyright">
                <p className="copyright-blog">© 2022 Gilbert Hutapea. All Rights Reserved</p>
            </div>
        </footer>
    )
}

export default Footer;
