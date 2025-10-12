import React, { useState } from "react";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetLink, setShowResetLink] = useState(false);
  const [resetLink, setResetLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        if (data.resetLink) {
          setResetLink(data.resetLink);
          setShowResetLink(true);
        }
      } else {
        setMessage(data.error || "Error sending reset request");
      }
    } catch (err) {
      setMessage("Error sending reset request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="auth-card">
        <h2>Reset Your Password</h2>
        <p className="auth-subtitle">
          Enter your email to get a password reset link
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Sending Reset Link..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <div className={`auth-message ${showResetLink ? "success" : ""}`}>
            {message}
          </div>
        )}

        {showResetLink && resetLink && (
          <div className="reset-link-container">
            <h4>Demo Reset Link:</h4>
            <p className="reset-link-note">
              For demo purposes, here's your reset link. In production, this
              would be sent via email.
            </p>
            <div className="reset-link">
              <a href={resetLink} target="_blank" rel="noopener noreferrer">
                Click here to reset your password
              </a>
            </div>
          </div>
        )}

        <div className="auth-footer">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
