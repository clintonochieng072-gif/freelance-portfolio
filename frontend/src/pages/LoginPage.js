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

      const controller = new AbortController(); // For timeout
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ This triggers CORS credential checks
        signal: controller.signal,
        body: JSON.stringify({ email, password }),
      });

      clearTimeout(timeoutId);

      // ✅ CRITICAL: Check if response was blocked by CORS
      console.log("📡 Response status:", response.status);
      console.log("📡 Response type:", response.type);
      console.log("📡 Response ok:", response.ok);
      console.log("📡 Response headers:", [...response.headers.entries()]);

      // ✅ Check CORS headers explicitly
      const corsOrigin = response.headers.get("access-control-allow-origin");
      const corsCredentials = response.headers.get(
        "access-control-allow-credentials"
      );

      console.log("🔍 CORS Origin:", corsOrigin);
      console.log("🔍 CORS Credentials:", corsCredentials);

      if (!corsCredentials || corsCredentials !== "true") {
        throw new Error(
          "Server missing Access-Control-Allow-Credentials header"
        );
      }

      if (
        !corsOrigin ||
        !corsOrigin.includes("portfolio-frontend-clinton.onrender.com")
      ) {
        throw new Error(`CORS origin mismatch. Got: ${corsOrigin}`);
      }

      // ✅ Only proceed if response is truly readable
      if (!response.body || !response.bodyUsed) {
        const data = await response.json().catch(() => ({}));
        console.log("📄 Response data:", data);

        if (response.ok && data.user) {
          // Backend succeeded but CORS blocked full response
          // Use the partial data we have
          login(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          setMessage("✅ Login successful!");

          // Check if cookie was set (httpOnly cookies aren't visible in JS)
          setTimeout(() => {
            // Test auth by checking /me endpoint
            fetch(`${API_URL}/auth/me`, { credentials: "include" })
              .then((res) => res.json())
              .then((data) => {
                if (data.user) {
                  navigate("/admin/dashboard");
                } else {
                  setMessage("⚠️ Login succeeded but auth check failed");
                }
              })
              .catch((err) => {
                console.error("Auth check failed:", err);
                setMessage("⚠️ Cookie not working - backend CORS issue");
              });
          }, 500);

          return;
        }
      }

      const data = await response.json();
      console.log("📄 Full response data:", data);

      if (response.ok) {
        login(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage("✅ Login successful!");
        setTimeout(() => navigate("/admin/dashboard"), 800);
      } else {
        setMessage(`❌ ${data.error || "Login failed"}`);
      }
    } catch (err) {
      console.error("💥 Login error details:", {
        name: err.name,
        message: err.message,
        isAbort: err.name === "AbortError",
        isTypeError: err.name === "TypeError",
      });

      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setMessage(
          "⚠️ CORS/Network Error: Server blocks credentialed requests"
        );
        console.error("🔍 This is a backend CORS configuration issue");
        console.error(
          "🔍 Backend needs: Access-Control-Allow-Credentials: true"
        );
      } else if (err.name === "AbortError") {
        setMessage("⚠️ Login timeout - server too slow");
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
