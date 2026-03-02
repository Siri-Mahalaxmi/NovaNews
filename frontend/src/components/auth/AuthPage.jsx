import React from "react";
import { supabase } from "../../supabaseClient";
import "./AuthPage.css";

const AuthPage = () => {

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:5173/"
      }
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>NovaNews</h1>
        <p>Personalized AI News Feed</p>

        <button
          className="google-btn"
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default AuthPage;