// Navbar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./Navbar.css";

const Navbar = ({ user }) => {
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Helper so active link gets the .active class for the underline indicator
  const navLink = (to, label) => (
    <Link to={to} className={location.pathname === to ? "active" : ""}>
      {label}
    </Link>
  );

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="logo">NovaNews</Link>
      </div>

      <div className="nav-center">
        {user && (
          <>
            {navLink("/", "Home")}
            {navLink("/explore", "Explore")}
            {navLink("/profile", "Profile")}
          </>
        )}
      </div>

      <div className="nav-right">
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup" className="signup-btn">Sign Up</Link>
          </>
        ) : (
          <>
            <span className="user-email">{user.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;









// //NavBar.jsx
// import React from "react";
// import { Link } from "react-router-dom";
// import { supabase } from "../../supabaseClient";
// import "./Navbar.css";

// const Navbar = ({ user }) => {

//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//     window.location.href = "/login";
//   };

//   return (
//     <nav className="navbar">
//       <div className="nav-left">
//         <Link to="/" className="logo">NovaNews</Link>
//       </div>

//       <div className="nav-center">
//         {user && (
//           <>
//             <Link to="/">Home</Link>
//             <Link to="/explore">Explore</Link>
//           </>
//         )}
//       </div>

//       <div className="nav-right">
//         {!user ? (
//           <>
//             <Link to="/login">Login</Link>
//             <Link to="/signup" className="signup-btn">Sign Up</Link>
//           </>
//         ) : (
//           <>
//             <span className="user-email">{user.email}</span>
//             <button onClick={handleLogout} className="logout-btn">
//               Logout
//             </button>
//           </>
//         )}
//       </div>
//     </nav>
//   );
// };

// export default Navbar;