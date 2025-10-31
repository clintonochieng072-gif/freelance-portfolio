import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGlobalContext } from "../context/GlobalContext";

const API_URL = process.env.REACT_APP_API_URL;

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useGlobalContext();
  const navigate = useNavigate();

  const handleLogin = async (e, retryCount = 0) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      console.log("🔄 Login attempt for:", email);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased to 60 seconds

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({ email, password }),
      });

      clearTimeout(timeoutId);

      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      const data = await response.json();
      console.log("📄 Response data:", data);

      if (response.ok && data.user) {
        login(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log(
          "✅ Login successful - user set in context:",
          data.user.username
        );
        setMessage("✅ Login successful! Redirecting...");

        setTimeout(() => {
          navigate("/admin/dashboard", { replace: true });
        }, 500);

        return;
      } else {
        console.error("❌ Login failed:", data.error);
        setMessage(`❌ ${data.error || "Invalid credentials"}`);
        localStorage.removeItem("user");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.warn("Login timed out");
        if (retryCount < 3) {
          // Up to 3 retries
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(
            `Retrying login (attempt ${
              retryCount + 1
            }) after ${delay}ms due to timeout`
          );
          setMessage(`⚠️ Server is starting, retrying in ${delay / 1000}s...`);
          setTimeout(() => handleLogin(e, retryCount + 1), delay);
          return; // Don't reset loading yet
        } else {
          setMessage("⚠️ Login timeout after retries - please try again later");
        }
      } else if (err.name === "TypeError" && err.message.includes("fetch")) {
        setMessage("⚠️ Network error - check connection and try again");
      } else {
        setMessage(`❌ ${err.message || "Login failed"}`);
      }
      console.error("💥 Login error:", err);
    } finally {
      setLoading(false); // Reset only after all retries
    }
  };

  return (
    <div className="login-container">
      <div className="auth-card">
        <h2>Sign In to Your Portfolio</h2>

        <form onSubmit={(e) => handleLogin(e, 0)}>
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
