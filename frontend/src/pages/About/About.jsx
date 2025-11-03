import './About.css';

const About = ({ profile, about }) => {
  // Default feature cards if user hasn't customized them
  const defaultCards = [
    {
      category: 'Secure Development',
      content: 'Building robust, secure applications with HTTPS, SSL/TLS, and comprehensive security practices.'
    },
    {
      category: 'Knowledge Sharing',
      content: 'Contributing to the developer community through technical tutorials and insights on modern web technologies.'
    }
  ];

  // Use custom cards if available, otherwise use defaults
  const featureCards = about?.cards && about.cards.length > 0 ? about.cards : defaultCards;

  return (
    <section className="about-section">
      <h2 className="about-section-title">{about?.title || 'About Me'}</h2>
      <div className="about-grid">
        {/* Profile Bio Card - Always shown */}
        <div className="about-card slide-in-up">
          <div className="about-category">Profile Bio</div>
          <div className="about-items">
            <span className="about-tag slide-in-up" style={{whiteSpace: 'pre-line'}}>
              {about?.content || profile?.bio}
            </span>
          </div>
        </div>
        
        {/* Dynamic Feature Cards */}
        {featureCards.map((card, index) => (
          <div key={index} className="about-card slide-in-up">
            <div className="about-category">{card.category}</div>
            <div className="about-items">
              <span className="about-tag slide-in-up" style={{whiteSpace: 'pre-line'}}>
                {card.content}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default About;