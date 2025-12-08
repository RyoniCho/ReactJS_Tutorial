import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Styles/Home.css';

const Home = () => {
    const navigate = useNavigate();

    const handleCategoryClick = (category) => {
        if (category === 'ALL') {
            navigate('/list?category=');
        } else {
            navigate(`/list?category=${encodeURIComponent(category)}`);
        }
    };

    return (
        <div className="home-container">
            <div className="category-grid">
                <div className="category-card" onClick={() => handleCategoryClick('ALL')}>
                    <div className="category-content">
                        <span className="category-icon">📽️</span>
                        <h2>ALL Movie</h2>
                    </div>
                </div>
                <div className="category-card" onClick={() => handleCategoryClick('Animation')}>
                    <div className="category-content">
                        <span className="category-icon">🎨</span>
                        <h2>Animation</h2>
                    </div>
                </div>
                <div className="category-card" onClick={() => handleCategoryClick('TV Show')}>
                    <div className="category-content">
                        <span className="category-icon">📺</span>
                        <h2>TV Show</h2>
                    </div>
                </div>
                <div className="category-card" onClick={() => handleCategoryClick('Magic')}>
                    <div className="category-content">
                        <span className="category-icon">🪄</span>
                        <h2>Magic</h2>
                    </div>
                </div>
                <div className="category-card" onClick={() => handleCategoryClick('AdultVideo')}>
                    <div className="category-content">
                        <span className="category-icon">🔞</span>
                        <h2>Adult</h2>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
