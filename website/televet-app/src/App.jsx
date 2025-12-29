import React from 'react'
import Header from './Header'
import heroImage from './images/catDog.png'
import './styles/index.css'
import WhatWeOffer from "./WhatWeOffer";
import paws from './images/paws.png'
import catDog2 from './images/catDog2.png'
import tile1 from './images/tile1.png'
import pp_img1 from './images/pp_img1.png'
import pp_img2 from './images/pp_img2.png'
import pp_img3 from './images/pp_img3.png'
import v_img1 from './images/v_img1.png'
import v_img2 from './images/v_img2.png'
import v_img3 from './images/v_img3.png'
import { useNavigate } from 'react-router-dom'

function App() {
  const navigate = useNavigate()
  const [openFAQ, setOpenFAQ] = React.useState(null)
  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="hero-container">
          

          {/* Hero Content */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="hero-title">
              Healthy Pet,
              <br />
              Happy Owners
            </h1>

            <p className="hero-subtitle">
              Connecting you with certified vets for instant consultations,
              <br />
              personalized care, and expert advice anytime, anywhere.
            </p>

            <button className="signup-btn" onClick={() => navigate('/register')}>Sign Up!</button>

            <div className="hero-image-container">
              <img
                src={heroImage}
                alt="Happy corgi dog and cat sitting together"
                className="hero-image"
              />
            </div>
          </div>
          {/* Wave Divider */}
          <div className="wave-divider">
            <svg
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              className="wave-svg"
            >
              <path
                d="M0,120V73.71c47.79-22.2,103.59-32.17,158-28,70.36,5.37,136.33,33.31,206.8,37.5C438.64,87.57,512.34,66.33,583,47.95c69.27-18,138.3-24.88,209.4-13.08,36.15,6,69.85,17.84,104.45,29.34C989.49,95,1113,134.29,1200,67.53V120Z"
                fill="#5268D5"
              />
            </svg>
          </div>
          {/* Statistics Section */}
          <div className="stats-section">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">99%</div>
                <div className="stat-label">Satisfied users</div>
                <div className="stat-dot"></div>
              </div>

              <div className="stat-item">
                <div className="stat-number">80%</div>
                <div className="stat-label">
                  Cases Resolved
                  <br />
                  Remotely
                </div>
                <div className="stat-dot"></div>
              </div>

              <div className="stat-item">
                <div className="stat-number">100</div>
                <div className="stat-label">
                  Monthly
                  <br />
                  Consultations
                </div>
                <div className="stat-dot"></div>
              </div>

              <div className="stat-item">
                <div className="stat-number">54%</div>
                <div className="stat-label">
                  Decrease in non-
                  <br />
                  emergency
                </div>
              </div>
            </div>
          </div>
        </div>

        

        {/* What We Offer Section (outside hero-container) */}
        <section
          className="what-we-offer-section rounded-lg shadow-lg"
          style={{
            backgroundImage: `url(${tile1})`,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
            
          }}
        >
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="offer-title">What We Offer</h1>
          </div>
          <WhatWeOffer />
        </section>

        {/* How It works */}
        <section className="how-it-works-section">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="hero-title">How It Works</h1>
          </div>

          <div className="row with-paws">
            <div className="column">
              <h3 className="step-title">Create Your Pet's Profile</h3>
              <p className="step-description">Fill in the details of your furry friend.</p>
            </div>

            <div className="paw-image-wrapper">
              <img src={paws} alt="Paw Print" className="paw-image" />
            </div>

            <div className="column">
              <h3 className="step-title">Find Your Vet</h3>
              <p className="step-description">Search for available veterinarians or locate the nearest clinic to you.</p>
            </div>

            <div className="paw-image-wrapper">
              <img src={paws} alt="Paw Print" className="paw-image" />
            </div>

            <div className="column">
              <h3 className="step-title">Start Communicating</h3>
              <p className="step-description">Book appointments or message your vet directly with any questions.</p>
            </div>
          </div>

        </section>
        

        {/* Start Now section */}
        <section className="start-now-section">
            <div className="svg-wave">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                <path fill="#FEF7E5" fillOpacity="1" d="M0,160L34.3,144C68.6,128,137,96,206,112C274.3,128,343,192,411,202.7C480,213,549,171,617,149.3C685.7,128,754,128,823,149.3C891.4,171,960,213,1029,224C1097.1,235,1166,213,1234,208C1302.9,203,1371,213,1406,218.7L1440,224L1440,0L1405.7,0C1371.4,0,1303,0,1234,0C1165.7,0,1097,0,1029,0C960,0,891,0,823,0C754.3,0,686,0,617,0C548.6,0,480,0,411,0C342.9,0,274,0,206,0C137.1,0,69,0,34,0L0,0Z" />
              </svg>
            </div>
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="start-title">
                Frequently Asked Questions
              </h1>
            </div>

            {/* FAQ Toggle Boxes */}
            <div className="faq-container">
              {[
                {
                  q: "How do I book a veterinary consultation?",
                  a: "Choose an available time slot for the consultation and book an appointment!"
                },
                {
                  q: "What issues can be handled through telemedicine?",
                  a: "Minor health concerns, follow-up consultations, medication advice, and general pet health inquiries can be managed remotely."
                },
                {
                  q: "Can I access my pet’s medical records through the platform?",
                  a: "Yes, the platform allows you to view and manage your pet’s medical history, treatments, and consultation records digitally."
                },
                {
                  q: "Who can use this platform?",
                  a: "The platform is designed for pet owners, certified veterinarians, and veterinary administrators to support telehealth consultations and clinic management."
                }
              ].map((faq, index) => (
                <div key={index} className="faq-item">
                  <button 
                    className="faq-question"
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  >
                    <span>{faq.q}</span>
                    <span className="faq-icon">{openFAQ === index ? '−' : '+'}</span>
                  </button>
                  {openFAQ === index && (
                    <div className="faq-answer">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-4">
              <button className="signup-btn" onClick={() => navigate('/register')}>Sign Up!</button>
              <img src={catDog2} alt="Cat and Dog" className="mt-6 mx-auto max-w-xs" />
            </div>

        </section>

      </main>
    </div>
  )
}

export default App
