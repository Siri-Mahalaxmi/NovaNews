import React from "react";
import { Link } from "react-router-dom";
import SignUpForm from "./SignUpForm";
import "../../styles/auth.css";

const SignUpPage = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Nova News</h1>
          <p>Real-time Intelligence</p>
        </div>
              <p>
        Already have an account? <Link to="/">Sign In</Link>
      </p>
        <SignUpForm />

        <div className="auth-footer">
          <p>
            Already have an account?
            <Link to="/login"> Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
