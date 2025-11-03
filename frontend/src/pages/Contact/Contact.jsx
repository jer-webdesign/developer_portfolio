import './Contact.css';

const Contact = ({ contactForm, setContactForm, formStatus, handleContactSubmit, copyToClipboard, contactInfo }) => {
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <section className="contact-section">
      <h2 className="contact-section-title">Let's Connect</h2>
      <div className="contact-grid">
  <div className="contact-card first-card">
          <div className="contact-category">Contact Information</div>
          <div className="contact-items contact-items-vertical">
            {contactInfo?.email && (
              <span className="contact-tag" tabIndex={0} role="button" onClick={() => copyToClipboard && copyToClipboard(contactInfo.email)}>
                📧 Email: <span className="contact-tag-highlight">{contactInfo.email}</span>
              </span>
            )}
            {contactInfo?.phone && (
              <span className="contact-tag" tabIndex={0} role="button" onClick={() => copyToClipboard && copyToClipboard(contactInfo.phone)}>
                📱 Phone: <span className="contact-tag-highlight">{contactInfo.phone}</span>
              </span>
            )}
            {contactInfo?.location && (
              <span className="contact-tag">
                🌍 Location: <span className="contact-tag-highlight">{contactInfo.location}</span>
              </span>
            )}
          </div>
        </div>
  <div className="contact-card second-card">
          <div className="contact-category">Contact Form</div>
          <div className="contact-items contact-items-vertical contact-items-fullwidth">
            <form onSubmit={handleContactSubmit} className="contact-form-fullwidth">
              <input
                className="form-input contact-form-input"
                type="text"
                name="name"
                placeholder="Your Name"
                value={contactForm.name}
                onChange={handleFormChange}
                required
              />
              <input
                className="form-input contact-form-input"
                type="email"
                name="email"
                placeholder="Your Email"
                value={contactForm.email}
                onChange={handleFormChange}
                required
              />
              <textarea
                className="form-textarea contact-form-input"
                name="message"
                placeholder="Your Message"
                value={contactForm.message}
                onChange={handleFormChange}
                required
              />
              <button className="btn btn-primary contact-form-btn" type="submit">
                {formStatus === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
              {formStatus === 'success' && <div className="contact-tag contact-form-success">Message sent!</div>}
              {formStatus === 'error' && <div className="contact-tag contact-form-error">Error sending message.</div>}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;