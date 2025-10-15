import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGlobalContext } from "../context/GlobalContext";
import {
  FiLogOut,
  FiBarChart2,
  FiUser,
  FiSettings,
  FiExternalLink,
} from "react-icons/fi";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://portfolio-backend-clinton.onrender.com/api";

function ClientAdmin() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState({ displayName: "", email: "" });

  const { logout, user } = useGlobalContext();
  const navigate = useNavigate();

  // ✅ ENHANCED: Robust username resolution with caching
  const getCurrentUsername = useCallback(() => {
    // 1. Dashboard data (most reliable)
    if (dashboardData?.user?.username) {
      return dashboardData.user.username;
    }
    // 2. Context user
    if (user?.username) {
      return user.username;
    }
    // 3. Cached user from localStorage
    try {
      const cached = localStorage.getItem("cachedUser");
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.username;
      }
    } catch (err) {
      console.error("Cache parse error:", err);
    }
    // 4. Return null if all fail
    return null;
  }, [dashboardData, user]);

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log("📡 Fetching dashboard...");
      const res = await fetch(`${API_URL}/admin/dashboard`, {
        credentials: "include",
      });

      console.log("📡 Dashboard response status:", res.status);

      if (res.status === 401) {
        console.log("🚫 Dashboard 401 - logging out");
        logout();
        navigate("/login");
        return;
      }

      const data = await res.json();
      console.log("✅ Dashboard data:", data.user?.username);
      setDashboardData(data);
      setProfile({
        displayName: data.portfolio?.displayName || "",
        email: data.user?.email || "",
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      logout();
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ✅ CRITICAL: Re-fetch dashboard when user changes (context sync)
  useEffect(() => {
    if (user && !dashboardData) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const updateProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profile),
      });

      if (res.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      const data = await res.json();
      if (res.ok) {
        alert("Profile updated successfully");
        fetchDashboardData();
      } else {
        alert("Update failed: " + data.error);
      }
    } catch (err) {
      console.error("Profile update error:", err);
    }
  };

  if (loading) {
    return <div className="admin-container">Loading Dashboard...</div>;
  }

  const currentUsername = getCurrentUsername();

  // ✅ DEBUG: Log username resolution
  console.log("🔍 ClientAdmin username resolution:", {
    currentUsername,
    hasDashboard: !!dashboardData?.user?.username,
    hasContext: !!user?.username,
    dashboardUser: dashboardData?.user?.username,
    contextUser: user?.username,
  });

  // ✅ PREVENT RENDER IF NO USERNAME
  if (!currentUsername) {
    return (
      <div
        className="admin-container"
        style={{ textAlign: "center", padding: "50px" }}
      >
        <h2>❌ Cannot load dashboard</h2>
        <p>No username available. Please:</p>
        <ol>
          <li>Ensure you're logged in</li>
          <li>
            <button onClick={fetchDashboardData}>Refresh Dashboard</button>
          </li>
          <li>
            <button onClick={handleLogout}>Logout & Login Again</button>
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="dashboard-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div>
            <h1>Welcome, {currentUsername}!</h1>
            <div className="plan-badge">
              {dashboardData?.user?.plan || "Free"} plan
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="logout-btn"
            style={{
              background: "#ff4444",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          <FiBarChart2 /> Overview
        </button>
        <button
          className={activeTab === "profile" ? "active" : ""}
          onClick={() => setActiveTab("profile")}
        >
          <FiUser /> Profile
        </button>
        <button
          className={activeTab === "settings" ? "active" : ""}
          onClick={() => setActiveTab("settings")}
        >
          <FiSettings /> Settings
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Projects</h3>
              <div className="stat-number">
                {dashboardData?.stats?.projectsCount || 0}
              </div>
            </div>
            <div className="stat-card">
              <h3>Skills</h3>
              <div className="stat-number">
                {dashboardData?.stats?.skillsCount || 0}
              </div>
            </div>
            <div className="stat-card">
              <h3>Testimonials</h3>
              <div className="stat-number">
                {dashboardData?.stats?.testimonialsCount || 0}
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <a
                href={`https://your-app.onrender.com/portfolio/${currentUsername}`} // ✅ Full URL for external
                target="_blank"
                rel="noopener noreferrer"
                className="action-btn"
              >
                <FiExternalLink /> View Your Portfolio
              </a>
              {/* ✅ ENHANCED: Safe navigation with validation */}
              <Link
                to={`/admin/${currentUsername}`}
                className="action-btn"
                onClick={() => {
                  console.log(
                    "🔗 Navigating to admin:",
                    `/admin/${currentUsername}`
                  );
                }}
              >
                Edit Portfolio Content
              </Link>
            </div>
          </div>

          <div className="portfolio-preview">
            <h3>Your Portfolio URL</h3>
            <div className="portfolio-url">
              {window.location.origin}/portfolio/{currentUsername}
            </div>
            <small>Share this link with clients and employers</small>
          </div>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="dashboard-content">
          <h3>Profile Settings</h3>
          <div className="profile-form">
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) =>
                  setProfile({ ...profile, displayName: e.target.value })
                }
                placeholder="How you want to be displayed"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                placeholder="Your email address"
              />
            </div>
            <button onClick={updateProfile} className="save-btn">
              Update Profile
            </button>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="dashboard-content">
          <h3>Account Settings</h3>
          <div className="settings-list">
            <div className="setting-item">
              <h4>Current Plan: {dashboardData?.user?.plan || "Free"}</h4>
              <p>Upgrade for custom domains and advanced features</p>
              <button className="upgrade-btn">Upgrade Plan</button>
            </div>
            <div className="setting-item">
              <h4>Custom Domain</h4>
              <p>Connect your own domain (Pro plan required)</p>
              <input
                type="text"
                placeholder="yourdomain.com"
                disabled={dashboardData?.user?.plan === "free"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientAdmin;
