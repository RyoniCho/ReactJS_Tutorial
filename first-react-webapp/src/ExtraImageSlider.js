import React, { useState } from 'react';
import "./Styles/ExtraImageSlider.css"

const ExtraImageSlider = ({ images }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const nextImage = () => {
        console.log("nextImage:"+images.length);
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    return (
    <div className="slider-container">
            <div className="slider">
                <img
                    src={images[currentImageIndex]}
                    alt={`Slide ${currentImageIndex + 1}`}
                    className="slider-image"
                />
            </div>
            <div className="slider-controls-container">
                <div className="slider-controls">
                    <button type="button" className="slider-button prev-btn" onClick={prevImage}>
                        Prev
                    </button>
                    <div className="slider-indicator">
                        {currentImageIndex + 1}/{images.length}
                    </div>
                    <button type="button" className="slider-button next-btn" onClick={nextImage}>
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExtraImageSlider;
