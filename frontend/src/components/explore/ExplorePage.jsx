import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NewsCard from "./NewsCard";
import SearchBar from "./SearchBar";
import CategoryTabs from "./CategoryTabs";
import "./ExplorePage.css";

const ExplorePage = ({ user }) => {
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    "All",
    "Technology",
    "Global",
    "Finance",
    "Science",
    "Security"
  ];

  // 🔥 Fetch Personalized Recommendations
  const fetchRecommendations = async () => {
    if (!user?.id) {
      console.log("User not ready yet");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/recommend/${user.id}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      setArticles(data);
    } catch (err) {
      console.error("Recommendation error:", err);
      setError("Failed to load personalized feed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  // 🔥 Log Interaction
  const handleArticleInteraction = useCallback(
    async (articleId, interactionType) => {
      if (!user?.id) return;

      try {
        await fetch("http://127.0.0.1:5000/interact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: user.id,
            article_id: articleId,
            interaction_type: interactionType
          })
        });

        // Refresh recommendations after interaction
        fetchRecommendations();
      } catch (error) {
        console.error("Interaction logging failed:", error);
      }
    },
    [user]
  );

  const handleArticleClick = (articleId) => {
    handleArticleInteraction(articleId, "view");
    navigate(`/article/${articleId}`);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const filteredArticles = articles
    .filter((article) => {
      if (activeCategory === "All") return true;
      return (
        article.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    })
    .filter((article) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();

      return (
        article.title?.toLowerCase().includes(query) ||
        article.description?.toLowerCase().includes(query) ||
        article.source_name?.toLowerCase().includes(query)
      );
    });

  return (
    <div className="explore-page">

      <div className="explore-header">
        <h1>Explore</h1>
      </div>

      <div className="explore-search">
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search personalized news..."
        />
      </div>

      <div className="explore-tabs">
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {loading && (
        <div className="explore-loading">
          <p>Loading personalized feed...</p>
        </div>
      )}

      {error && (
        <div className="explore-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="explore-grid">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                onClick={handleArticleClick}
                onInteraction={handleArticleInteraction}
              />
            ))
          ) : (
            <p>No personalized articles found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;