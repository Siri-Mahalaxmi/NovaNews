// HomePage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NewsCard from "../explore/NewsCard";
import SearchBar from "../explore/SearchBar";
import "./HomePage.css";

const API_BASE = "http://127.0.0.1:5000";

const HomePage = ({ user }) => {
  const navigate = useNavigate();
  const userRef = useRef(user);

  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [likedIds, setLikedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const [dislikedIds, setDislikedIds] = useState(new Set());

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ── Fetch Articles ──────────────────────────────────────────────────────
  const fetchLatestArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/articles`);
      if (!response.ok) throw new Error("Failed to fetch articles");
      const data = await response.json();
      setArticles(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load articles.");
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch Past Interactions ─────────────────────────────────────────────
  const fetchUserInteractions = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/interactions/${userId}`);
      if (!response.ok) return;
      const data = await response.json();
      setLikedIds(new Set(data.liked || []));
      setSavedIds(new Set(data.saved || []));
      setDislikedIds(new Set(data.disliked || []));
    } catch (err) {
      console.error("Failed to fetch interactions:", err);
    }
  };

  useEffect(() => {
    fetchLatestArticles();
    if (user?.id) fetchUserInteractions(user.id);
  }, [user?.id]);

  // ── Log Interaction ─────────────────────────────────────────────────────
  const handleArticleInteraction = async (articleId, interactionType) => {
    const currentUser = userRef.current;
    if (!currentUser?.id) return;

    // Optimistic UI
    if (interactionType === "like") {
      setLikedIds((prev) => new Set([...prev, articleId]));
      // A like cancels any prior dislike in the UI
      setDislikedIds((prev) => { const n = new Set(prev); n.delete(articleId); return n; });
    } else if (interactionType === "unlike") {
      setLikedIds((prev) => { const n = new Set(prev); n.delete(articleId); return n; });
    } else if (interactionType === "dislike") {
      setDislikedIds((prev) => new Set([...prev, articleId]));
      // A dislike cancels the like in the UI
      setLikedIds((prev) => { const n = new Set(prev); n.delete(articleId); return n; });
    } else if (interactionType === "save") {
      setSavedIds((prev) => new Set([...prev, articleId]));
    } else if (interactionType === "unsave") {
      setSavedIds((prev) => { const n = new Set(prev); n.delete(articleId); return n; });
    }

    try {
      await fetch(`${API_BASE}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          article_id: articleId,
          interaction_type: interactionType,
        }),
      });
    } catch (err) {
      console.error("Interaction logging failed:", err);
    }
  };

  // ── Navigation ──────────────────────────────────────────────────────────
  const handleArticleClick = (articleId) => {
    handleArticleInteraction(articleId, "view");
    navigate(`/article/${articleId}`);
  };

  // ── Filtering ───────────────────────────────────────────────────────────
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
          onChange={setSearchQuery}
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
                onClick={handleArticleClick}
                onInteraction={handleArticleInteraction}
                initialLiked={likedIds.has(article.id)}
                initialSaved={savedIds.has(article.id)}
                initialDisliked={dislikedIds.has(article.id)}
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









//HomePage.jsx
// import React, { useEffect, useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import NewsCard from "../explore/NewsCard";
// import SearchBar from "../explore/SearchBar";
// import "./HomePage.css";

// const API_BASE = "http://127.0.0.1:5000";

// const HomePage = ({ user }) => {  // ✅ accept user prop
//   const navigate = useNavigate();
//   const userRef = useRef(user);   // ✅ always up-to-date user ref

//   const [articles, setArticles] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [likedIds, setLikedIds] = useState(new Set());
//   const [savedIds, setSavedIds] = useState(new Set());

//   // Keep ref in sync
//   useEffect(() => {
//     userRef.current = user;
//   }, [user]);

//   // -------------------- Fetch Articles --------------------
//   const fetchLatestArticles = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await fetch(`${API_BASE}/articles`);
//       if (!response.ok) throw new Error("Failed to fetch articles");
//       const data = await response.json();
//       setArticles(data);
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setError("Failed to load articles.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // -------------------- Fetch Past Interactions --------------------
//   const fetchUserInteractions = async (userId) => {
//     try {
//       const response = await fetch(`${API_BASE}/interactions/${userId}`);
//       if (!response.ok) return;
//       const data = await response.json();
//       setLikedIds(new Set(data.liked));
//       setSavedIds(new Set(data.saved));
//     } catch (err) {
//       console.error("Failed to fetch interactions:", err);
//     }
//   };

//   useEffect(() => {
//     fetchLatestArticles();
//     if (user?.id) fetchUserInteractions(user.id);
//   }, [user?.id]);

//   // -------------------- Log Interaction --------------------
//   const handleArticleInteraction = async (articleId, interactionType) => {
//     const currentUser = userRef.current;
//     if (!currentUser?.id) return;

//     // Optimistic UI
//     if (interactionType === "like") {
//       setLikedIds((prev) => new Set([...prev, articleId]));
//     } else if (interactionType === "unlike") {
//       setLikedIds((prev) => { const n = new Set(prev); n.delete(articleId); return n; });
//     } else if (interactionType === "save") {
//       setSavedIds((prev) => new Set([...prev, articleId]));
//     } else if (interactionType === "unsave") {
//       setSavedIds((prev) => { const n = new Set(prev); n.delete(articleId); return n; });
//     }

//     try {
//       await fetch(`${API_BASE}/interact`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           user_id: currentUser.id,
//           article_id: articleId,
//           interaction_type: interactionType,
//         }),
//       });
//     } catch (err) {
//       console.error("Interaction logging failed:", err);
//     }
//   };

//   // -------------------- Navigation --------------------
//   const handleArticleClick = (articleId) => {
//     handleArticleInteraction(articleId, "view");
//     navigate(`/article/${articleId}`);
//   };

//   // -------------------- Filtering --------------------
//   const filteredArticles = articles.filter((article) => {
//     if (!searchQuery.trim()) return true;
//     const query = searchQuery.toLowerCase();
//     return (
//       article.title?.toLowerCase().includes(query) ||
//       article.description?.toLowerCase().includes(query) ||
//       article.source_name?.toLowerCase().includes(query)
//     );
//   });

//   return (
//     <div className="home-page">
//       <div className="home-header">
//         <h1>Latest News</h1>
//       </div>

//       <div className="home-search">
//         <SearchBar
//           value={searchQuery}
//           onChange={setSearchQuery}
//           placeholder="Search latest news..."
//         />
//       </div>

//       {loading && (
//         <div className="home-loading">
//           <p>Loading articles...</p>
//         </div>
//       )}

//       {error && (
//         <div className="home-error">
//           <p>{error}</p>
//         </div>
//       )}

//       {!loading && !error && (
//         <div className="home-grid">
//           {filteredArticles.length > 0 ? (
//             filteredArticles.map((article) => (
//               <NewsCard
//                 key={article.id}
//                 article={article}
//                 onClick={handleArticleClick}
//                 onInteraction={handleArticleInteraction}
//                 initialLiked={likedIds.has(article.id)}  // ✅ persisted state
//                 initialSaved={savedIds.has(article.id)}
//               />
//             ))
//           ) : (
//             <p>No articles found.</p>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default HomePage;

// import React, { useEffect, useState, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import NewsCard from "../explore/NewsCard";
// import SearchBar from "../explore/SearchBar";
// import "./HomePage.css";

// const HomePage = () => {
//   const navigate = useNavigate();

//   const [articles, setArticles] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const fetchLatestArticles = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await fetch(
//         "http://127.0.0.1:5000/articles"
//       );

//       if (!response.ok) {
//         throw new Error("Failed to fetch articles");
//       }

//       const data = await response.json();
//       setArticles(data);

//     } catch (err) {
//       console.error("Fetch error:", err);
//       setError("Failed to load articles.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchLatestArticles();
//   }, []);

//   const handleSearchChange = useCallback((query) => {
//     setSearchQuery(query);
//   }, []);

//   const handleArticleClick = useCallback((articleId) => {
//     navigate(`/article/${articleId}`);
//   }, [navigate]);

//   const handleArticleInteraction = useCallback(() => {
//     // Home does not need personalization logic
//   }, []);

//   const filteredArticles = articles.filter((article) => {
//     if (!searchQuery.trim()) return true;

//     const query = searchQuery.toLowerCase();
//     return (
//       article.title?.toLowerCase().includes(query) ||
//       article.description?.toLowerCase().includes(query) ||
//       article.source_name?.toLowerCase().includes(query)
//     );
//   });

//   return (
//     <div className="home-page">

//       <div className="home-header">
//         <h1>Latest News</h1>
//       </div>

//       <div className="home-search">
//         <SearchBar
//           value={searchQuery}
//           onChange={handleSearchChange}
//           placeholder="Search latest news..."
//         />
//       </div>

//       {loading && (
//         <div className="home-loading">
//           <p>Loading articles...</p>
//         </div>
//       )}

//       {error && (
//         <div className="home-error">
//           <p>{error}</p>
//         </div>
//       )}

//       {!loading && !error && (
//         <div className="home-grid">
//           {filteredArticles.length > 0 ? (
//             filteredArticles.map((article) => (
//               <NewsCard
//                 key={article.id}
//                 article={article}
//                 onInteraction={handleArticleInteraction}
//                 onClick={handleArticleClick}
//               />
//             ))
//           ) : (
//             <p>No articles found.</p>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default HomePage;