import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGlobalContext } from "../context/GlobalContext";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://portfolio-backend-clinton.onrender.com/api";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useGlobalContext(); // ✅ Only need login function
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      console.log("🔄 Login attempt for:", email);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ Backend sets httpOnly cookie
        signal: controller.signal,
        body: JSON.stringify({ email, password }),
      });

      clearTimeout(timeoutId);

      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      const data = await response.json();
      console.log("📄 Response data:", data);

      if (response.ok && data.user) {
        // ✅ CRITICAL: Call login with ONLY user data
        // Backend handles httpOnly cookie automatically
        login(data.user); // No token parameter needed

        // Store user data for context restoration
        localStorage.setItem("user", JSON.stringify(data.user));

        console.log(
          "✅ Login successful - user set in context:",
          data.user.username
        );
        setMessage("✅ Login successful! Redirecting...");

        // ✅ Immediate redirect - ProtectedRoute will use updated context
        setTimeout(() => {
          navigate("/admin/dashboard", { replace: true });
        }, 500);

        return;
      } else {
        console.error("❌ Login failed:", data.error);
        setMessage(`❌ ${data.error || "Invalid credentials"}`);

        // Clear any stale data
        localStorage.removeItem("user");
      }
    } catch (err) {
      console.error("💥 Login error:", err);

      if (err.name === "AbortError") {
        setMessage("⚠️ Login timeout - server too slow");
      } else if (err.name === "TypeError" && err.message.includes("fetch")) {
        setMessage("⚠️ Network error - check connection");
      } else {
        setMessage(`❌ ${err.message || "Login failed"}`);
      }
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
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot your password?</Link>
        </div>

        {message && (
          <p
            className={`auth-message ${
              message.includes("✅") ? "success" : "error"
            }`}
          >
            {message}
          </p>
        )}

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create Portfolio</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
