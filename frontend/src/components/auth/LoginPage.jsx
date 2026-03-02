import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/auth.css";

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate("/");
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome back!</h1>
        <p className="auth-subtext">
          Simplify your workflow and boost productivity.
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="forgot">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <button type="submit" className="primary-btn">
            Login
          </button>
        </form>

        <div className="divider">or continue with</div>

        <div className="social-login">
          <button onClick={handleGoogleLogin} className="social-btn">
            G
          </button>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <p className="switch-auth">
          Not a member? <Link to="/signup">Register now</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;