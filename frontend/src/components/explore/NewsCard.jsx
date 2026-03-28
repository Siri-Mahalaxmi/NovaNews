// NewsCard.jsx
import React, { useState } from "react";
import "./NewsCard.css";

const NewsCard = ({
  article,
  onClick,
  onInteraction,
  initialLiked = false,
  initialSaved = false,
  initialDisliked = false,
}) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isDisliked, setIsDisliked] = useState(initialDisliked);
  const [shareMsg, setShareMsg] = useState(null);

  // ── Like ────────────────────────────────────────────────────────────────
  const handleLike = (e) => {
    e.stopPropagation();
    const newState = !isLiked;
    setIsLiked(newState);

    // Liking removes any dislike
    if (newState && isDisliked) setIsDisliked(false);

    if (onInteraction) {
      onInteraction(article.id, newState ? "like" : "unlike");
    }
  };

  // ── Dislike ─────────────────────────────────────────────────────────────
  const handleDislike = (e) => {
    e.stopPropagation();
    const newState = !isDisliked;
    setIsDisliked(newState);

    // Disliking removes any like
    if (newState && isLiked) setIsLiked(false);

    if (onInteraction) {
      onInteraction(article.id, newState ? "dislike" : "unlike");
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = (e) => {
    e.stopPropagation();
    const newState = !isSaved;
    setIsSaved(newState);

    if (onInteraction) {
      onInteraction(article.id, newState ? "save" : "unsave");
    }
  };

  // ── Share ─────────────────────────────────────────────────────────────────
  const handleShare = async (e) => {
    e.stopPropagation();
    const url = article.url || window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, text: article.description, url });
        if (onInteraction) onInteraction(article.id, "share");
      } catch (err) {
        if (err.name !== "AbortError") console.error("Share failed:", err);
      }
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const el = document.createElement("textarea");
        el.value = url;
        el.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }

      if (onInteraction) onInteraction(article.id, "share");
      setShareMsg("Copied!");
      setTimeout(() => setShareMsg(null), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      setShareMsg("Failed");
      setTimeout(() => setShareMsg(null), 2000);
    }
  };

  return (
    <div className="news-card" onClick={() => onClick(article.id)}>
      <img
        src={article.image_url || "https://placehold.co/400x300?text=No+Image"}
        alt={article.title}
        className="news-image"
        onError={(e) => { e.target.src = "https://placehold.co/400x300?text=No+Image"; }}
      />

      <div className="news-content">
        <h3>{article.title}</h3>
        <p>{article.description}</p>

        <div className="news-actions">
          <button
            onClick={handleLike}
            className={isLiked ? "liked" : ""}
          >
            {isLiked ? "❤️ Liked" : "🤍 Like"}
          </button>

          <button
            onClick={handleDislike}
            className={isDisliked ? "disliked" : ""}
          >
            {isDisliked ? "👎 Disliked" : "👎 Dislike"}
          </button>

          <button
            onClick={handleSave}
            className={isSaved ? "saved" : ""}
          >
            {isSaved ? "🔖 Saved" : "💾 Save"}
          </button>

          <button onClick={handleShare}>
            {shareMsg ?? "📤 Share"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;







// //NewsCard.jsx
// import React, { useState } from "react";
// import "./NewsCard.css";

// // initialLiked / initialSaved come from ExplorePage which fetches
// // the user's past interactions on load — so state persists across reloads
// const NewsCard = ({ article, onClick, onInteraction, initialLiked = false, initialSaved = false }) => {
//   const [isLiked, setIsLiked] = useState(initialLiked);   // ✅ seeded from backend
//   const [isSaved, setIsSaved] = useState(initialSaved);   // ✅ seeded from backend
//   const [shareMsg, setShareMsg] = useState(null);

//   // -------------------- Like --------------------
//   const handleLike = (e) => {
//   e.stopPropagation();
//   console.log("1. LIKE CLICKED - article id:", article.id);
//   console.log("2. onInteraction prop:", onInteraction);
  
//   const newState = !isLiked;
//   setIsLiked(newState);

//   if (onInteraction) {
//     console.log("3. CALLING onInteraction");
//     onInteraction(article.id, newState ? "like" : "unlike");
//   } else {
//     console.log("3. onInteraction IS NULL/UNDEFINED - prop not passed");
//   }
// };

//   // -------------------- Save --------------------
//   const handleSave = (e) => {
//     e.stopPropagation();
//     const newState = !isSaved;
//     setIsSaved(newState);

//     if (onInteraction) {
//       onInteraction(article.id, newState ? "save" : "unsave");
//     }
//   };

//   // -------------------- Share --------------------
//   const handleShare = async (e) => {
//     e.stopPropagation();

//     const url = article.url || window.location.href;

//     // Native share sheet (mobile / desktop where supported)
//     if (navigator.share) {
//       try {
//         await navigator.share({ title: article.title, text: article.description, url });
//         if (onInteraction) onInteraction(article.id, "share");
//       } catch (err) {
//         if (err.name !== "AbortError") console.error("Share failed:", err);
//       }
//       return;
//     }

//     // Clipboard fallback
//     try {
//       if (navigator.clipboard?.writeText) {
//         await navigator.clipboard.writeText(url);
//       } else {
//         // Legacy HTTP fallback
//         const el = document.createElement("textarea");
//         el.value = url;
//         el.style.cssText = "position:fixed;opacity:0";
//         document.body.appendChild(el);
//         el.focus();
//         el.select();
//         document.execCommand("copy");
//         document.body.removeChild(el);
//       }

//       if (onInteraction) onInteraction(article.id, "share");
//       setShareMsg("Copied!");
//       setTimeout(() => setShareMsg(null), 2000);
//     } catch (err) {
//       console.error("Clipboard copy failed:", err);
//       setShareMsg("Failed");
//       setTimeout(() => setShareMsg(null), 2000);
//     }
//   };

//   return (
//     <div className="news-card" onClick={() => onClick(article.id)}>
//       <img
//         src={article.image_url || "https://placehold.co/400x300?text=No+Image"}
//         alt={article.title}
//         className="news-image"
//         onError={(e) => { e.target.src = "https://placehold.co/400x300?text=No+Image"; }}
//       />

//       <div className="news-content">
//         <h3>{article.title}</h3>
//         <p>{article.description}</p>

//         <div className="news-actions">
//           <button onClick={handleLike}>
//             {isLiked ? "❤️ Liked" : "🤍 Like"}
//           </button>

//           <button onClick={handleSave}>
//             {isSaved ? "🔖 Saved" : "💾 Save"}
//           </button>

//           <button onClick={handleShare}>
//             {shareMsg ?? "📤 Share"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NewsCard;









// import React, { useState } from "react";
// import "./NewsCard.css";

// const NewsCard = ({ article, onClick, onInteraction }) => {
//   const [isLiked, setIsLiked] = useState(false);
//   const [isSaved, setIsSaved] = useState(false);         // ✅ save state was missing
//   const [shareMsg, setShareMsg] = useState(null);        // ✅ share feedback state

//   // -------------------- Like --------------------
//   const handleLike = (e) => {
//     e.stopPropagation();
//     const newState = !isLiked;
//     setIsLiked(newState);

//     if (onInteraction) {
//       onInteraction(article.id, newState ? "like" : "unlike");
//     }
//   };

//   // -------------------- Save --------------------
//   const handleSave = (e) => {
//     e.stopPropagation();
//     const newState = !isSaved;
//     setIsSaved(newState);                                 // ✅ toggle reflected in UI

//     if (onInteraction) {
//       onInteraction(article.id, newState ? "save" : "unsave");
//     }
//   };

//   // -------------------- Share --------------------
//   const handleShare = async (e) => {
//     e.stopPropagation();

//     const url = article.url || window.location.href;

//     // ✅ Web Share API (mobile/desktop native share sheet)
//     if (navigator.share) {
//       try {
//         await navigator.share({
//           title: article.title,
//           text: article.description,
//           url,
//         });
//         if (onInteraction) onInteraction(article.id, "share");
//       } catch (err) {
//         // User dismissed share dialog — not an error worth logging
//         if (err.name !== "AbortError") console.error("Share failed:", err);
//       }
//       return;
//     }

//     // ✅ Fallback: clipboard copy (works on HTTP too via execCommand)
//     try {
//       if (navigator.clipboard?.writeText) {
//         await navigator.clipboard.writeText(url);
//       } else {
//         // Legacy fallback for HTTP or older browsers
//         const el = document.createElement("textarea");
//         el.value = url;
//         el.style.position = "fixed";
//         el.style.opacity = "0";
//         document.body.appendChild(el);
//         el.focus();
//         el.select();
//         document.execCommand("copy");
//         document.body.removeChild(el);
//       }

//       if (onInteraction) onInteraction(article.id, "share");

//       // Show temporary "Copied!" feedback
//       setShareMsg("Copied!");
//       setTimeout(() => setShareMsg(null), 2000);
//     } catch (err) {
//       console.error("Clipboard copy failed:", err);
//       setShareMsg("Failed");
//       setTimeout(() => setShareMsg(null), 2000);
//     }
//   };

//   return (
//     <div className="news-card" onClick={() => onClick(article.id)}>
//       <img
//         src={article.image_url || "https://placehold.co/400x300?text=No+Image"}
//         alt={article.title}
//         className="news-image"
//         onError={(e) => {
//           e.target.src = "https://placehold.co/400x300?text=No+Image";
//         }}
//       />

//       <div className="news-content">
//         <h3>{article.title}</h3>
//         <p>{article.description}</p>

//         <div className="news-actions">
//           <button onClick={handleLike}>
//             {isLiked ? "❤️ Liked" : "🤍 Like"}
//           </button>

//           <button onClick={handleSave}>
//             {isSaved ? "🔖 Saved" : "💾 Save"}    {/* ✅ reflects saved state */}
//           </button>

//           <button onClick={handleShare}>
//             {shareMsg ? shareMsg : "📤 Share"}      {/* ✅ shows feedback */}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NewsCard;





// import React, { useState } from "react";
// import "./NewsCard.css";

// const NewsCard = ({ article, onClick, onInteraction }) => {
//   const [isLiked, setIsLiked] = useState(false);

//   const handleLike = (e) => {
//     e.stopPropagation();

//     const newState = !isLiked;
//     setIsLiked(newState);

//     if (onInteraction) {
//       onInteraction(article.id, newState ? "like" : "unlike");
//     }
//   };

//   const handleSave = (e) => {
//     e.stopPropagation();

//     if (onInteraction) {
//       onInteraction(article.id, "save");
//     }
//   };

//   const handleShare = (e) => {
//     e.stopPropagation();

//     navigator.clipboard.writeText(article.url);
//     if (onInteraction) {
//       onInteraction(article.id, "share");
//     }
//   };

//   return (
//     <div className="news-card" onClick={() => onClick(article.id)}>
//       <img
//         src={article.image_url || "https://via.placeholder.com/400x300"}
//         alt={article.title}
//         className="news-image"
//       />

//       <div className="news-content">
//         <h3>{article.title}</h3>
//         <p>{article.description}</p>

//         <div className="news-actions">
//           <button onClick={handleLike}>
//             {isLiked ? "❤️ Liked" : "🤍 Like"}
//           </button>

//           <button onClick={handleSave}>💾 Save</button>

//           <button onClick={handleShare}>📤 Share</button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NewsCard;