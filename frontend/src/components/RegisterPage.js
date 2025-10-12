import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Cookies from "js-cookie";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    displayName: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName || formData.username
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Cookies.set("token", data.token, { expires: 7 });
        setMessage("✅ Registration successful! Redirecting...");
        setTimeout(() => {
          navigate(`/admin/dashboard`);
        }, 2000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage("⚠️ Server error, please try again later");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="auth-card">
        <h2>Create Your Portfolio</h2>
        <p className="auth-subtitle">Start building your professional portfolio in minutes</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="username"
              placeholder="Username (for your portfolio URL)"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <small>yourportfolio.com/portfolio/{formData.username || 'username'}</small>
          </div>

          <div className="form-group">
            <input
              type="text"
              name="displayName"
              placeholder="Display Name (optional)"
              value={formData.displayName}
              onChange={handleChange}
            />
            <small>How you want to be displayed on your portfolio</small>
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Portfolio"}
          </button>
        </form>

        {message && <div className="auth-message">{message}</div>}

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>

        <div className="plan-features">
          <h4>Free Plan Includes:</h4>
          <ul>
            <li>✓ Professional portfolio website</li>
            <li>✓ Customizable content</li>
            <li>✓ Real-time updates</li>
            <li>✓ Mobile responsive</li>
            <li>✓ Basic analytics</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;