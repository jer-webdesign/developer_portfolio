import './Skills.css';

const Skills = ({ profile, skillCategories }) => {
  // Defensive: filter out empty or malformed categories
  const validCategories = Array.isArray(skillCategories)
    ? skillCategories.filter(cat => cat && cat.category && Array.isArray(cat.skills) && cat.skills.length > 0)
    : [];

  return (
    <section className="skills-section">
      <h2 className="skill-section-title">Technical Skills</h2>
      <div className="skills-grid">
        {validCategories.length > 0 ? (
          validCategories.map((category, index) => {
            // Split emoji and name if present
            const match = category.category.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|[\u2600-\u27BF])?\s*(.*)$/u);
            const emoji = match && match[1] ? match[1] : null;
            const name = match && match[2] ? match[2] : category.category;
            return (
              <div key={index} className="skill-card slide-in-up">
                <div className="skill-category">
                  {emoji && <span style={{marginRight: '0.5em'}}>{emoji}</span>}
                  {name}
                </div>
                <div className="skill-items">
                  {category.skills.map((skill, skillIndex) => (
                    <span key={skillIndex} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="skill-card slide-in-up">
            <div className="skill-category">All Skills</div>
            <div className="skill-items">
              {(profile?.skills || []).map((skill, skillIndex) => (
                <span key={skillIndex} className="skill-tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Skills;