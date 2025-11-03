import './Blog.css';
import { BookOpen } from 'lucide-react';

const Blog = ({ posts }) => {
  return (
  <section className="blog-section">
      <h2 className="blog-section-title">Latest Blog Posts</h2>
  <div className="blog-grid">
        {posts.map((post, index) => (
          <div key={post.id} className="blog-card slide-in-up">
            <div className="blog-category">
              <BookOpen size={18} /> {post.title}
            </div>
            <div className="blog-items">
              <span className="blog-tag slide-in-up">
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No date'}
              </span>
              <span className="blog-tag slide-in-up">{post.excerpt}</span>
              {post.tags && (
                <div>
                  {post.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="blog-tag slide-in-up">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Blog;