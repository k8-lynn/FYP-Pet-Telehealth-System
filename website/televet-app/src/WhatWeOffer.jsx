import React, { useState } from 'react'
import "./styles/WhatWeOffer.css" 

const WhatWeOffer = () => {
  const [activeTab, setActiveTab] = useState('owners')
  const [currentImage, setCurrentImage] = useState(0)

  // Sample images - replace with your actual images
  const petOwnerImages = [
    '/images/pet-owner-1.jpg',
    '/images/pet-owner-2.jpg',
    '/images/pet-owner-3.jpg'
  ]

  const vetImages = [
    '/images/vet-1.jpg',
    '/images/vet-2.jpg',
    '/images/vet-3.jpg'
  ]

  const currentImages = activeTab === 'owners' ? petOwnerImages : vetImages

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % currentImages.length)
  }

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + currentImages.length) % currentImages.length)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentImage(0) // Reset to first image when switching tabs
  }

  return (
    <div className="what-we-offer">
      {/* Tab Buttons */}
      <div className="tab-buttons">
        <button
          className={`tab-button ${activeTab === 'owners' ? 'active' : ''}`}
          onClick={() => handleTabChange('owners')}
        >
          For Pet Owners
        </button>
        <button
          className={`tab-button ${activeTab === 'vets' ? 'active' : ''}`}
          onClick={() => handleTabChange('vets')}
        >
          For Vets
        </button>
      </div>

      {/* Image Container with Navigation */}
      <div className="image-section">
        {/* Left Arrow */}
        <button className="nav-arrow left-arrow" onClick={prevImage}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Image Container */}
        <div className="image-container">
          <img
            src={currentImages[currentImage]}
            alt={`${activeTab === 'owners' ? 'Pet Owner' : 'Veterinarian'} ${currentImage + 1}`}
            className="main-image"
            onError={(e) => {
              // Fallback for missing images
              e.target.src = `https://via.placeholder.com/600x400/5368d3/ffffff?text=${activeTab === 'owners' ? 'Pet+Owner' : 'Veterinarian'}+${currentImage + 1}`
            }}
          />
          
          {/* Image Counter */}
          <div className="image-counter">
            {currentImage + 1} / {currentImages.length}
          </div>
        </div>

        {/* Right Arrow */}
        <button className="nav-arrow right-arrow" onClick={nextImage}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Dot Indicators */}
      <div className="dot-indicators">
        {currentImages.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentImage ? 'active' : ''}`}
            onClick={() => setCurrentImage(index)}
          />
        ))}
      </div>
    </div>
  )
}

export default WhatWeOffer