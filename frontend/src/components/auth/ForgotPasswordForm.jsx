import React, { useState } from "react";

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Reset link sent to:", email);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Forgot Password</h2>

      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="submit-btn">
        Send Reset Link
      </button>
    </form>
  );
};

export default ForgotPasswordForm;
