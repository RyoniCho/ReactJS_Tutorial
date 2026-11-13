import React, { useState } from 'react';
import ServiceHome from './ServiceHome';
import { useNavigate } from 'react-router-dom';
import './Styles/Home.css';

const Home = ({ isAuthenticated, isNSFWContentBlured }) => {
    const [view, setView] = useState(() => {
        try { return localStorage.getItem('media-home-view') === 'service' ? 'service' : 'cards'; } catch { return 'cards'; }
    });
    const selectView = (next) => {
        setView(next);
        try { localStorage.setItem('media-home-view', next); } catch {}
    };
    const navigate = useNavigate();

    const handleCategoryClick = (category) => {
        if (category === 'ALL') {
            navigate('/list?category=');
        } else {
            navigate(`/list?category=${encodeURIComponent(category)}`);
        }
    };

    return (
        <>
        <div className="home-view-switch" role="group" aria-label="홈 보기 방식">
            <button aria-pressed={view === 'cards'} onClick={() => selectView('cards')}>카드 보기</button>
            <button aria-pressed={view === 'service'} onClick={() => selectView('service')}>서비스 보기</button>
        </div>
        {view === 'service' ? <ServiceHome isAuthenticated={isAuthenticated} isNSFWContentBlured={isNSFWContentBlured} /> : <div className="home-container">
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
        </div>}
        </>
    );
};

export default Home;
