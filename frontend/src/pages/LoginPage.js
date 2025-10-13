import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGlobalContext } from "../context/GlobalContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useGlobalContext();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Use context login which handles token and user state
        login(data.user, data.token);
        setMessage("✅ Login successful!");

        // Redirect user to dashboard and refresh app state
        setTimeout(() => {
          window.location.href = "/admin/dashboard";
        }, 1000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage("⚠️ Server error, try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="auth-card">
        <h2>Sign In to Your Portfolio</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email Address"
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
          <button type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot your password?</Link>
        </div>

        {message && <p className="auth-message">{message}</p>}

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create Portfolio</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
