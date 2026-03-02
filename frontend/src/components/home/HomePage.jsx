import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NewsCard from "../explore/NewsCard";
import SearchBar from "../explore/SearchBar";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLatestArticles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/articles"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch articles");
      }

      const data = await response.json();
      setArticles(data);

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestArticles();
  }, []);

  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const handleArticleClick = useCallback((articleId) => {
    navigate(`/article/${articleId}`);
  }, [navigate]);

  const handleArticleInteraction = useCallback(() => {
    // Home does not need personalization logic
  }, []);

  const filteredArticles = articles.filter((article) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      article.title?.toLowerCase().includes(query) ||
      article.description?.toLowerCase().includes(query) ||
      article.source_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="home-page">

      <div className="home-header">
        <h1>Latest News</h1>
      </div>

      <div className="home-search">
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search latest news..."
        />
      </div>

      {loading && (
        <div className="home-loading">
          <p>Loading articles...</p>
        </div>
      )}

      {error && (
        <div className="home-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="home-grid">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                onInteraction={handleArticleInteraction}
                onClick={handleArticleClick}
              />
            ))
          ) : (
            <p>No articles found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;