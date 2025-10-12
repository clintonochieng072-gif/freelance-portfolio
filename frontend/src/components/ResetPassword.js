import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setMessage("Invalid or missing reset token");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (!token) {
      setMessage("Invalid reset token");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setMessage(data.error || "Error resetting password");
      }
    } catch (err) {
      setMessage("Error resetting password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="auth-card">
          <h2>Invalid Reset Link</h2>
          <p>The password reset link is invalid or has expired.</p>
          <div className="auth-footer">
            <Link to="/forgot-password">Request a new reset link</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="auth-card">
        <h2>Set New Password</h2>
        <p className="auth-subtitle">Enter your new password below</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="password"
              placeholder="New Password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        {message && (
          <div
            className={`auth-message ${
              message.includes("successfully") ? "success" : ""
            }`}
          >
            {message}
          </div>
        )}

        <div className="auth-footer">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
