import React, { useState } from 'react';
import "./Styles/ExtraImageSlider.css"

const ExtraImageSlider = ({ images, blur }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const nextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    if (!images || images.length === 0) return null;

    return (
        <div className="slider-container">
            <div className={`slider-wrapper ${blur ? 'blur' : ''}`}>
                <img
                    src={images[currentImageIndex]}
                    alt={`Slide ${currentImageIndex + 1}`}
                    className="slider-image"
                />
            </div>
            
            {/* Navigation Arrows */}
            <button className="slider-btn prev-btn" onClick={prevImage} aria-label="Previous image">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            
            <button className="slider-btn next-btn" onClick={nextImage} aria-label="Next image">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>

            {/* Indicator Dots */}
            <div className="slider-dots">
                {images.map((_, index) => (
                    <span 
                        key={index} 
                        className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(index)}
                    />
                ))}
            </div>
            
            <div className="slider-counter">
                {currentImageIndex + 1} / {images.length}
            </div>
        </div>
    );
};

export default ExtraImageSlider;
