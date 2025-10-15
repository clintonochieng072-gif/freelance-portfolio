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
  const { login } = useGlobalContext();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      console.log("🔄 Login attempt:", { email });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s for Render cold start

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Keep this for cookies
        signal: controller.signal,
        body: JSON.stringify({ email, password }),
      });

      clearTimeout(timeoutId);

      console.log("📡 Response status:", response.status);
      console.log("📡 Response type:", response.type);
      console.log("📡 Response ok:", response.ok);

      // ✅ BACKEND WORKS - Try to read response even with CORS issues
      let data;
      try {
        data = await response.json();
        console.log("📄 Full response data:", data);
      } catch (jsonErr) {
        console.warn("⚠️ Could not parse JSON - CORS blocking response body");
        // Backend succeeded (200) but CORS blocks body - use fallback
        data = { message: "Login successful", user: { email } };
      }

      // ✅ If status is 200, assume success regardless of CORS headers
      if (response.status === 200) {
        // Backend set httpOnly cookie, store user data
        login(data.user || { email });
        localStorage.setItem("user", JSON.stringify(data.user || { email }));

        console.log("✅ Login processed - checking auth...");

        // ✅ Verify authentication with /me endpoint
        setTimeout(async () => {
          try {
            const authCheck = await fetch(`${API_URL}/auth/me`, {
              credentials: "include",
            });
            const authData = await authCheck.json();

            if (authCheck.ok && authData.user) {
              console.log("✅ Auth confirmed:", authData.user.username);
              navigate("/admin/dashboard");
            } else {
              console.error("❌ Auth check failed:", authData);
              setMessage("⚠️ Login succeeded but session not active");
            }
          } catch (authErr) {
            console.error("❌ Auth verification failed:", authErr);
            setMessage("⚠️ Cookie authentication failed - backend CORS issue");
          }
        }, 500);

        setMessage("✅ Login initiated - redirecting...");
        return; // Don't show error
      } else {
        setMessage(`❌ ${data?.error || "Login failed"}`);
      }
    } catch (err) {
      console.error("💥 Login error:", err);

      if (err.name === "AbortError") {
        setMessage("⚠️ Login timeout - server slow");
      } else if (err.name === "TypeError" && err.message.includes("fetch")) {
        // ✅ Network error but backend might still work
        setMessage("⚠️ Network issue - retrying auth check...");

        // Fallback: Try direct /me check (cookie might be set)
        setTimeout(async () => {
          try {
            const authCheck = await fetch(`${API_URL}/auth/me`, {
              credentials: "include",
            });
            if (authCheck.ok) {
              const authData = await authCheck.json();
              if (authData.user) {
                login(authData.user);
                localStorage.setItem("user", JSON.stringify(authData.user));
                navigate("/admin/dashboard");
              }
            }
          } catch (e) {
            console.error("Fallback auth failed:", e);
          }
        }, 1000);
      } else {
        setMessage(`❌ ${err.message}`);
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
