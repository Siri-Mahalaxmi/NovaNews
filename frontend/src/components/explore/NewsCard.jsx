import React, { useState } from "react";
import "./NewsCard.css";

const NewsCard = ({ article, onClick, onInteraction }) => {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = (e) => {
    e.stopPropagation();

    const newState = !isLiked;
    setIsLiked(newState);

    if (onInteraction) {
      onInteraction(article.id, newState ? "like" : "unlike");
    }
  };

  const handleSave = (e) => {
    e.stopPropagation();

    if (onInteraction) {
      onInteraction(article.id, "save");
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();

    navigator.clipboard.writeText(article.url);
    if (onInteraction) {
      onInteraction(article.id, "share");
    }
  };

  return (
    <div className="news-card" onClick={() => onClick(article.id)}>
      <img
        src={article.image_url || "https://via.placeholder.com/400x300"}
        alt={article.title}
        className="news-image"
      />

      <div className="news-content">
        <h3>{article.title}</h3>
        <p>{article.description}</p>

        <div className="news-actions">
          <button onClick={handleLike}>
            {isLiked ? "❤️ Liked" : "🤍 Like"}
          </button>

          <button onClick={handleSave}>💾 Save</button>

          <button onClick={handleShare}>📤 Share</button>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;