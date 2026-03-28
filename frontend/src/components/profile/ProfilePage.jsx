// ProfilePage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NewsCard from "../explore/NewsCard";
import "./ProfilePage.css";

const API_BASE = "http://127.0.0.1:5000";

// ── Helper: generate a colour from a string (for avatar fallback) ──────────
function stringToColor(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 45%)`;
}

function getInitials(name, email) {
  if (name && name.trim()) {
    return name
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  // Fall back to first letter of email
  return (email || "?")[0].toUpperCase();
}

// ── Stat card sub-component ────────────────────────────────────────────────
const StatCard = ({ label, value, emoji }) => (
  <div className="stat-card">
    <span className="stat-emoji">{emoji}</span>
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
  </div>
);

// ── Main ProfilePage ───────────────────────────────────────────────────────
const ProfilePage = ({ user }) => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [savedArticles, setSavedArticles] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch profile data ───────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoadingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/profile/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error(err);
      setError("Could not load profile.");
    } finally {
      setLoadingProfile(false);
    }
  }, [user?.id]);

  // ── Fetch saved articles ─────────────────────────────────────────────────
  const fetchSaved = useCallback(async () => {
    if (!user?.id) return;
    setLoadingSaved(true);
    try {
      const [savedRes, interactRes] = await Promise.all([
        fetch(`${API_BASE}/profile/${user.id}/saved`),
        fetch(`${API_BASE}/interactions/${user.id}`),
      ]);
      const savedData = await savedRes.json();
      const interactData = await interactRes.json();

      setSavedArticles(savedData);
      setLikedIds(new Set(interactData.liked || []));
      setSavedIds(new Set(interactData.saved || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSaved(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
    fetchSaved();
  }, [fetchProfile, fetchSaved]);

  // ── Handle interactions from saved-article cards ─────────────────────────
  const handleArticleInteraction = async (articleId, interactionType) => {
    if (!user?.id) return;

    // Optimistic UI
    if (interactionType === "like") {
      setLikedIds((prev) => new Set([...prev, articleId]));
    } else if (interactionType === "unlike") {
      setLikedIds((prev) => { const n = new Set(prev); n.delete(articleId); return n; });
    } else if (interactionType === "save") {
      setSavedIds((prev) => new Set([...prev, articleId]));
    } else if (interactionType === "unsave") {
      setSavedIds((prev) => { const n = new Set(prev); n.delete(articleId); return n; });
      // Remove from displayed list immediately
      setSavedArticles((prev) => prev.filter((a) => a.id !== articleId));
    }

    try {
      await fetch(`${API_BASE}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          article_id: articleId,
          interaction_type: interactionType,
        }),
      });

      // Refresh profile stats after interaction
      fetchProfile();
    } catch (err) {
      console.error("Interaction failed:", err);
    }
  };

  const handleArticleClick = (articleId) => {
    handleArticleInteraction(articleId, "view");
    navigate(`/article/${articleId}`);
  };

  // ── Redirect if not logged in ────────────────────────────────────────────
  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-not-logged-in">
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loadingProfile) {
    return (
      <div className="profile-page">
        <div className="profile-loading"><p>Loading profile…</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-error"><p>{error}</p></div>
      </div>
    );
  }

  const displayName = profile?.name || profile?.email?.split("@")[0] || "User";
  const initials = getInitials(profile?.name, profile?.email);
  const avatarColor = stringToColor(profile?.email || profile?.id);
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <div className="profile-page">
      {/* ── Header ── */}
      <div className="profile-header-section">
        <div className="profile-avatar-wrap">
          {profile?.profile_pic ? (
            <img
              src={profile.profile_pic}
              alt={displayName}
              className="profile-avatar-img"
            />
          ) : (
            <div
              className="profile-avatar-initials"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
          )}
        </div>

        <div className="profile-identity">
          <h1 className="profile-display-name">{displayName}</h1>
          <p className="profile-email">{profile?.email}</p>
          {joinDate && (
            <p className="profile-join-date">Member since {joinDate}</p>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      {profile?.stats && (
        <div className="profile-stats-section">
          <h2 className="section-title">Activity</h2>
          <div className="stats-grid">
            <StatCard emoji="👍" label="Liked" value={profile.stats.liked} />
            <StatCard emoji="🔖" label="Saved" value={profile.stats.saved} />
            <StatCard emoji="👁️" label="Viewed" value={profile.stats.viewed} />
            <StatCard emoji="🔗" label="Shared" value={profile.stats.shared} />
            <StatCard emoji="👎" label="Disliked" value={profile.stats.disliked} />
          </div>
        </div>
      )}

      {/* ── Saved Articles ── */}
      <div className="profile-saved-section">
        <h2 className="section-title">
          Saved Articles
          {savedArticles.length > 0 && (
            <span className="saved-count"> ({savedArticles.length})</span>
          )}
        </h2>

        {loadingSaved ? (
          <p className="profile-loading-text">Loading saved articles…</p>
        ) : savedArticles.length === 0 ? (
          <div className="profile-empty-saved">
            <p>No saved articles yet.</p>
            <p className="profile-empty-sub">
              Tap the bookmark icon on any article to save it here.
            </p>
          </div>
        ) : (
          <div className="profile-saved-grid">
            {savedArticles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                onClick={handleArticleClick}
                onInteraction={handleArticleInteraction}
                initialLiked={likedIds.has(article.id)}
                initialSaved={savedIds.has(article.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;