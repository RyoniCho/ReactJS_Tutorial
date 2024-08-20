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
        <div className="image-slider">
            <button type="button" onClick={prevImage}>Previous</button>
            <img src={images[currentImageIndex]} alt="Movie still" />
            <button type="button" onClick={nextImage}>Next</button>
        </div>
    );
};

export default ExtraImageSlider;
