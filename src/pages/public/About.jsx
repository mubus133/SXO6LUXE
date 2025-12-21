import React from 'react'

const About = () => {
  return (
    <div className="about-page" style={{ padding: '120px 0 5rem', minHeight: '70vh' }}>
      <div className="container">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '2rem', textAlign: 'center' }}>
            About SXO6LUXE
          </h1>
          
          <div style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#333' }}>
            <p>
              Welcome to SXO6LUXE, where luxury meets contemporary fashion. We believe that style 
              is more than just clothing—it's an expression of individuality, confidence, and sophistication.
            </p>
            
            <h2 style={{ fontSize: '2rem', marginTop: '3rem', marginBottom: '1rem' }}>Our Story</h2>
            <p>
              Founded with a passion for premium fashion, SXO6LUXE has been redefining luxury 
              clothing for discerning customers worldwide. Each piece in our collection is carefully 
              curated to embody timeless elegance and contemporary flair.
            </p>
            
            <h2 style={{ fontSize: '2rem', marginTop: '3rem', marginBottom: '1rem' }}>Our Promise</h2>
            <p>
              From premium fabrics to meticulous craftsmanship, we ensure every detail reflects 
              our commitment to quality and luxury. Experience fashion that transcends trends and 
              celebrates your unique style.
            </p>
            
            <h2 style={{ fontSize: '2rem', marginTop: '3rem', marginBottom: '1rem' }}>Contact Us</h2>
            <p>
              Have questions? We're here to help. Reach out to us at{' '}
              <a href="mailto:support@sxo6luxe.com" style={{ color: '#d4af37', fontWeight: '600' }}>
                support@sxo6luxe.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About