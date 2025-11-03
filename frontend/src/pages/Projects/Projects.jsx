import './Projects.css';
import { Code, ExternalLink, Github } from 'lucide-react';

const Projects = ({ projects }) => {
  return (
  <section className="projects-section">
      <h2 className="projects-section-title">Featured Projects</h2>
      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project._id || project.id} className="project-card">
            <div className="project-category">
              <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <Code size={18} /> {project.title}
              </span>
            </div>
            <div className="project-items" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
              <span className="project-tag slide-in-up" style={{marginBottom: '0.5rem'}}>{project.description}</span>
              <div className="project-items slide-in-up" style={{marginBottom: '0.5rem'}}>
                {project.technologies?.map((tech, index) => (
                  <span key={index} className="project-tag">{tech}</span>
                ))}
              </div>
              <div className="project-items slide-in-up">
                {(project.links?.live || project.liveDemo) && (
                  <a href={project.links?.live || project.liveDemo} target="_blank" rel="noopener noreferrer" className="project-tag" data-variant="demo">
                    <ExternalLink size={14} /> Live Demo
                  </a>
                )}
                {(project.links?.github || project.githubRepo) && (
                  <a href={project.links?.github || project.githubRepo} target="_blank" rel="noopener noreferrer" className="project-tag" data-variant="github">
                    <Github size={14} /> GitHub Repository
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Projects;