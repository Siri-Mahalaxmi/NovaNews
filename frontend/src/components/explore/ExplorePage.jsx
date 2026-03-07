import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NewsCard from "./NewsCard";
import SearchBar from "./SearchBar";
import CategoryTabs from "./CategoryTabs";
import "./ExplorePage.css";

const API_BASE = "http://127.0.0.1:5000";

const ExplorePage = ({ user }) => {
  const navigate = useNavigate();
  const userRef = useRef(user);

  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [likedIds, setLikedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());

  const categories = ["All", "Technology", "Global", "Finance", "Science", "Security"];

  // Keep ref in sync with latest user
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // -------------------- Fetch Past Interactions --------------------
  const fetchUserInteractions = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/interactions/${userId}`);
      if (!response.ok) return;
      const data = await response.json();
      setLikedIds(new Set(data.liked));
      setSavedIds(new Set(data.saved));
    } catch (err) {
      console.error("Failed to fetch user interactions:", err);
    }
  };

  // -------------------- Fetch Recommendations --------------------
  const fetchRecommendations = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/recommend/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch recommendations");
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
    if (user?.id) {
      fetchUserInteractions(user.id);
      fetchRecommendations(user.id);
    }
  }, [user?.id]);

  // -------------------- Log Interaction --------------------
  const handleArticleInteraction = async (articleId, interactionType) => {
    const currentUser = userRef.current;
    if (!currentUser?.id) return;

    // Optimistic UI update
    if (interactionType === "like") {
      setLikedIds((prev) => new Set([...prev, articleId]));
    } else if (interactionType === "unlike") {
      setLikedIds((prev) => { const n = new Set(prev); n.delete(articleId); return n; });
    } else if (interactionType === "save") {
      setSavedIds((prev) => new Set([...prev, articleId]));
    } else if (interactionType === "unsave") {
      setSavedIds((prev) => { const n = new Set(prev); n.delete(articleId); return n; });
    }

    try {
      const response = await fetch(`${API_BASE}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          article_id: articleId,
          interaction_type: interactionType,
        }),
      });

      const result = await response.json();
      console.log("Interaction result:", result);

      if (interactionType === "like") {
        fetchRecommendations(currentUser.id);
      }
    } catch (err) {
      console.error("Interaction logging failed:", err);
    }
  };

  // -------------------- Navigation --------------------
  const handleArticleClick = (articleId) => {
    handleArticleInteraction(articleId, "view");
    navigate(`/article/${articleId}`);
  };

  // -------------------- Filtering --------------------
  const filteredArticles = articles
    .filter((article) => {
      if (activeCategory === "All") return true;
      return article.category?.toLowerCase() === activeCategory.toLowerCase();
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
          onChange={setSearchQuery}
          placeholder="Search personalized news..."
        />
      </div>

      <div className="explore-tabs">
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
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
                initialLiked={likedIds.has(article.id)}
                initialSaved={savedIds.has(article.id)}
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