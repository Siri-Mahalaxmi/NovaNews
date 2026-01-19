import React, { useState } from 'react';
import './NewsCard.css';

const NewsCard = ({ article, onInteraction, onClick }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const published = new Date(timestamp);
    const diffMs = now - published;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const getReadingTime = (content) => {
    const wordCount = content ? content.split(' ').length : 150;
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min read`;
  };

  const handleCardClick = () => {
    onInteraction(article.id, 'view');
    onClick(article.id);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    onInteraction(article.id, newLikedState ? 'like' : 'unlike');
  };

  const handleSave = (e) => {
    e.stopPropagation();
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    onInteraction(article.id, newSavedState ? 'save' : 'unsave');
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    onInteraction(article.id, 'share');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.url
        });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(article.url);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  return (
    <div className="news-card" onClick={handleCardClick}>
      {article.image_url && (
        <div className="news-card-image-container">
          <img 
            className="news-card-image"
            src={article.image_url} 
            alt={article.title}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
            }}
          />
          <div className="news-card-category-badge">
            {article.category}
          </div>
        </div>
      )}

      <div className="news-card-content">
        <div className="news-card-metadata">
          <span>{getTimeAgo(article.published_at)}</span>
          <span>•</span>
          <span>{getReadingTime(article.content || article.description)}</span>
        </div>

        <h2 className="news-card-title">
          {article.title}
        </h2>

        <p className="news-card-description">
          {article.description}
        </p>

        <div className="news-card-actions">
          <button 
            className={`news-card-action-btn ${isLiked ? 'active' : ''}`}
            onClick={handleLike}
            aria-label={isLiked ? 'Unlike article' : 'Like article'}
          >
            <span>{isLiked ? '❤️' : '🤍'}</span>
            <span>{isLiked ? 'Liked' : 'Like'}</span>
          </button>

          <button 
            className={`news-card-action-btn ${isSaved ? 'active' : ''}`}
            onClick={handleSave}
            aria-label={isSaved ? 'Unsave article' : 'Save article'}
          >
            <span>{isSaved ? '🔖' : '📑'}</span>
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button 
            className="news-card-action-btn"
            onClick={handleShare}
            aria-label="Share article"
          >
            <span>📤</span>
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;