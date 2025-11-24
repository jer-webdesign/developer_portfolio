import { useEffect } from 'react';
import './Home.css';

const Home = ({ profile, hero, navigateToSection }) => {
  // Compute title fallback so the hero title always shows a sensible value
  const title = hero?.headline || profile?.name || profile?.firstName || 'JEREMY OLANDA';

  useEffect(() => {

    const subtitleElement = document.getElementById('typing-subtitle');
    if (!subtitleElement) return;

    // Determine subtitles: prefer hero.subheadline or hero.subheadlines (both variants),
    // then fall back to profile.skills or a short tagline from profile.bio
    const possibleSub = Array.isArray(hero?.subheadline) && hero.subheadline.length
      ? hero.subheadline
      : Array.isArray(hero?.subheadlines) && hero.subheadlines.length
        ? hero.subheadlines
        : (typeof hero?.subheadline === 'string' && hero.subheadline.trim().length)
          ? [hero.subheadline.trim()]
          : (typeof hero?.subheadlines === 'string' && hero.subheadlines.trim().length)
            ? [hero.subheadlines.trim()]
            : null;

    const subtitles = possibleSub ||
      ((Array.isArray(profile?.skills) && profile.skills.length) ? [profile.skills[0]] :
        (profile?.bio ? [profile.bio.split('.').slice(0,1).join('').trim()] : null));

    if (!subtitles || subtitles.length === 0) {
      // No subtitles provided: show a simple fallback from profile name
      subtitleElement.textContent = profile?.name || profile?.firstName || '';
      return;
    }

    let currentIndex = 0;
    let currentText = '';
    let isDeleting = false;
    let timeoutId = null;

    const typeWriter = () => {
      const currentSubtitle = subtitles[currentIndex] || '';

      if (isDeleting) {
        currentText = currentSubtitle.substring(0, Math.max(0, currentText.length - 1));
      } else {
        currentText = currentSubtitle.substring(0, Math.min(currentSubtitle.length, currentText.length + 1));
      }

      subtitleElement.textContent = currentText;

      let typeSpeed = isDeleting ? 100 : 200;

      if (!isDeleting && currentText === currentSubtitle) {
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && currentText === '') {
        isDeleting = false;
        currentIndex = (currentIndex + 1) % subtitles.length;
        typeSpeed = 500;
      }

      timeoutId = setTimeout(typeWriter, typeSpeed);
    };

    // Start with empty text to ensure animation runs consistently
    subtitleElement.textContent = '';
    typeWriter();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [hero, profile]);

  return (
    <section className="hero home-section">
      <div className="hero-content">
        <h1 className="hero-title">{title}</h1>
        <h2 id="typing-subtitle" className="hero-subtitle" aria-live="polite"></h2>
        <p className="hero-description">{profile?.bio}</p>
        {/* Social / contact links from profile (display above CTAs) */}
        <div className="profile-links" style={{marginBottom: '1rem'}}>
          {profile?.github && (
            <a className="link" href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub">
              <svg className="social-icon github-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M12 .297a12 12 0 00-3.793 23.4c.6.11.793-.26.793-.577v-2.234c-3.218.7-3.893-1.55-3.893-1.55-.528-1.34-1.293-1.697-1.293-1.697-1.057-.723.08-.708.08-.708 1.17.082 1.785 1.203 1.785 1.203 1.037 1.776 2.723 1.263 3.388.967.105-.752.405-1.263.737-1.553-2.567-.293-5.267-1.283-5.267-5.71 0-1.262.45-2.295 1.188-3.102-.119-.293-.514-1.473.113-3.07 0 0 .97-.31 3.18 1.186a11.06 11.06 0 015.79 0c2.21-1.496 3.18-1.186 3.18-1.186.627 1.597.232 2.777.114 3.07.74.807 1.187 1.84 1.187 3.102 0 4.438-2.704 5.412-5.28 5.696.417.36.787 1.07.787 2.157v3.197c0 .32.19.694.8.576A12 12 0 0012 .297"/>
              </svg>
              <span>GitHub</span>
            </a>
          )}
          {profile?.linkedin && (
            <a className="link" href={profile.linkedin} target="_blank" rel="noreferrer">🔗 LinkedIn</a>
          )}
          {(profile?.email || profile?.publicEmail) && (
            <a className="link" href={`mailto:${profile?.email || profile?.publicEmail}`}>✉️ Email</a>
          )}
        </div>

        <div className="cta-buttons">
          <button className="btn btn-primary" onClick={() => navigateToSection && navigateToSection('projects')}>
            View Projects
          </button>
          <button className="btn btn-secondary" onClick={() => navigateToSection && navigateToSection('contact')}>
            Contact Me
          </button>
        </div>
      </div>
    </section>
  );
}

export default Home;

