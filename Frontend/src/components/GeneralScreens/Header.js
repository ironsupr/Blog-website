import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import SearchForm from './SearchForm';
import '../../Css/Header.css'
import { RiPencilFill } from 'react-icons/ri'
import { FaUserEdit } from 'react-icons/fa'
import { BiLogOut } from 'react-icons/bi'
import { BsBookmarks } from 'react-icons/bs'
import { FiSun, FiMoon, FiMenu, FiX } from 'react-icons/fi'
import SkeletonElement from '../Skeletons/SkeletonElement';
import { AuthContext } from '../../Context/AuthContext';
import { ThemeContext } from '../../Context/ThemeContext';

const Header = () => {
    const bool = localStorage.getItem("authToken") ? true : false
    const [auth, setAuth] = useState(bool)
    const { activeUser } = useContext(AuthContext)
    const { darkMode, toggleDarkMode } = useContext(ThemeContext)
    const [loading, setLoading] = useState(true)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const menuRef = useRef(null)
    const navigate = useNavigate()

    // Close menu when clicking outside
    // Close menu when clicking outside and cleanup on unmount
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false)
            }
        }
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
            setIsMenuOpen(false)
        }
    }, [])

    useEffect(() => {

        setAuth(bool)
        setTimeout(() => {
            setLoading(false)
        }, 1600)

    }, [bool])


    const handleLogout = () => {
        localStorage.removeItem("authToken");
        navigate('/')
    };

    return (
        <header>
            <div className="averager">
                <Link to="/" className="logo">
                    <h5>MERN BLOG</h5>
                </Link>

                <div className="desktop-nav">
                    <SearchForm />
                </div>
                <div className='header_options'>
                        <button 
                            className="theme-toggle-btn" 
                            onClick={toggleDarkMode} 
                            aria-label="Toggle Dark Mode"
                        >
                            {darkMode ? <FiSun /> : <FiMoon />}
                        </button>

                        {auth ? (
                            <div className="auth_options">
                                <Link 
                                    className='addStory-link' 
                                    to="/addstory"
                                    aria-label="Add New Story"
                                >
                                    <RiPencilFill />
                                    <span>Add Story</span>
                                </Link>

                                <Link 
                                    to="/readList" 
                                    className='readList-link'
                                    aria-label="Reading List"
                                >
                                    <BsBookmarks />
                                    <span id="readListLength">
                                        {activeUser.readListLength}
                                    </span>
                                </Link>

                                <Link
                                    to="/drafts"
                                    className='drafts-link'
                                    aria-label="My Drafts"
                                >
                                    <RiPencilFill />
                                    <span>Drafts</span>
                                </Link>

                                <div className='header-profile-wrapper'>
                                    {loading ? (
                                        <SkeletonElement type="minsize-avatar" />
                                    ) : (
                                        <img 
                                            src={`/userPhotos/${activeUser.photo}`} 
                                            alt={`${activeUser.username}'s profile`} 
                                        />
                                    )}

                                    <div className="sub-profile-wrap">
                                        <Link className='profile-link' to="/profile">
                                            <FaUserEdit />
                                            Profile
                                        </Link>
                                        <button 
                                            className='logout-btn' 
                                            onClick={handleLogout}
                                            aria-label="Logout"
                                        >
                                            <BiLogOut />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="noAuth_options">
                                <Link className='login-link' to="/login">Login</Link>
                                <Link className='register-link' to="/register">Get Started</Link>
                            </div>
                        )}

                        <button 
                            className="mobile-menu-btn"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle mobile menu"
                            aria-expanded={isMenuOpen}
                        >
                            {isMenuOpen ? <FiX /> : <FiMenu />}
                        </button>
                    </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="mobile-menu" ref={menuRef}>
                        <SearchForm />
                        {auth ? (
                            <div className="mobile-auth-options">
                                <Link 
                                    to="/addstory" 
                                    className="mobile-menu-item"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <RiPencilFill />
                                    Add Story
                                </Link>
                                <Link 
                                    to="/readList" 
                                    className="mobile-menu-item"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <BsBookmarks />
                                    Reading List
                                </Link>
                                <Link
                                    to="/drafts"
                                    className="mobile-menu-item"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <RiPencilFill />
                                    Drafts
                                </Link>
                                <Link 
                                    to="/profile" 
                                    className="mobile-menu-item"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <FaUserEdit />
                                    Profile
                                </Link>
                                <button 
                                    className="mobile-menu-item"
                                    onClick={() => {
                                        handleLogout();
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    <BiLogOut />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="mobile-noauth-options">
                                <Link 
                                    to="/login" 
                                    className="mobile-menu-item"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link 
                                    to="/register" 
                                    className="mobile-menu-item highlight"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );

    
}

// return (
//   <>
//     <header>
//       <div className="averager">

//         <Link to="/" className="logo">
//           <h5>
//             MERN BLOG
//           </h5>
//         </Link>
//         <SearchForm />
//         <div className='header_options'>
//           <button 
//             className="theme-toggle-btn" 
//             onClick={toggleDarkMode} 
//             aria-label="Toggle Dark Mode"
//           >
//             {darkMode ? <FiSun /> : <FiMoon />}
//           </button>

//           {auth ?
//             <div className="auth_options">
//               <Link to="/readList" className='readList-link'>
//                 <BsBookmarks />
//                 <span id="readListLength">
//                   {activeUser.readListLength}
//                 </span>
//               </Link>
//               <div className='header-profile-wrapper'>
//                 {loading ? <SkeletonElement type="minsize-avatar" /> :
//                   <img src={`/userPhotos/${activeUser.photo}`} alt={activeUser.username} />
//                 }
//                 <div className="sub-profile-wrap">
//                   <Link className='profile-link' to="/profile"> <FaUserEdit /> Profile </Link>
//                   <button className='logout-btn' onClick={handleLogout}> <BiLogOut /> Logout</button>
//                 </div>
//               </div>
//             </div>
//             :
//             <div className="noAuth_options">
//               <Link className='login-link' to="/login"> Login </Link>
//               <Link className='register-link' to="/register"> Get Started</Link>
//             </div>
//           }
//         </div>
//       </div>
//     </header>
//     {auth && (
//       <Link to="/addstory" className="fab">
//         <RiPencilFill size={24} />
//       </Link>
//     )}
//   </>
// );


export default Header;
