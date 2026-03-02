import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ArticleDetailPage.css';

const ArticleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticleDetail();
  }, [id]);

  const fetchArticleDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://127.0.0.1:5000/articles/${id}`);

      if (!response.ok) {
        throw new Error("Article not found");
      }

      const data = await response.json();
      setArticle(data);

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load article. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const published = new Date(timestamp);
    const diffMs = now - published;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className="article-detail-page">
        <div className="article-loading">
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="article-detail-page">
        <div className="article-error">
          <p>{error || 'Article not found'}</p>
          <button className="article-back-btn" onClick={handleGoBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="article-detail-page">
      <div className="article-detail-container">

        <button className="article-back-btn-top" onClick={handleGoBack}>
          ← Back to Explore
        </button>

        <div className="article-header">
          <div className="article-category-badge">{article.category}</div>
          <h1 className="article-title">{article.title}</h1>

          <div className="article-meta">
            <div className="article-source">
              <span className="article-source-name">{article.source_name}</span>
            </div>
            <div className="article-timestamp">
              {getTimeAgo(article.published_at)}
            </div>
          </div>
        </div>

        {article.image_url && (
          <div className="article-image-container">
            <img
              src={article.image_url}
              alt={article.title}
              className="article-image"
            />
          </div>
        )}

        <div className="article-content">
          <div className="article-description">
            {article.description}
          </div>

          {article.content && (
            <div className="article-body">
              {article.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="article-paragraph">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>

        {article.url && (
          <div className="article-footer">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="article-source-link"
            >
              Read original article →
            </a>
          </div>
        )}

      </div>
    </div>
  );
};

export default ArticleDetailPage;