import React from "react";
import { Link } from "react-router-dom";
import ForgotPasswordForm from "./ForgotPasswordForm";
import "../../styles/auth.css";

const ForgotPasswordPage = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>We'll help you get back in</p>
        </div>

        <ForgotPasswordForm />

        <div className="auth-footer">
          <p>
            Remembered your password?
            <Link to="/login"> Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
