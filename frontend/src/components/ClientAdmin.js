import Cookies from "js-cookie";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalContext } from "../context/GlobalContext";
import {
  FiUser,
  FiSettings,
  FiBarChart2,
  FiLogOut,
  FiExternalLink,
} from "react-icons/fi";
import "./Admin.css";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://portfolio-backend-clinton.onrender.com/api";

function ClientAdmin() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState({ displayName: "", email: "" });

  const { logout } = useGlobalContext();
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = Cookies.get("token");

      const res = await fetch(`${API_URL}/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      const data = await res.json();
      setDashboardData(data);
      setProfile({
        displayName: data.portfolio?.displayName || "",
        email: data.user?.email || "",
      });
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      logout();
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const updateProfile = async () => {
    try {
      const token = Cookies.get("token");

      const res = await fetch(`${API_URL}/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      console.error("Error updating profile:", err);
    }
  };

  if (loading)
    return <div className="admin-container">Loading Dashboard...</div>;

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
            <h1>Welcome, {dashboardData?.user?.username}!</h1>
            <div className="plan-badge">{dashboardData?.user?.plan} plan</div>
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
                href={`/portfolio/${dashboardData?.user?.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="action-btn"
              >
                <FiExternalLink /> View Your Portfolio
              </a>
              <a
                href={`/admin/${dashboardData?.user?.username}`}
                className="action-btn"
              >
                Edit Portfolio Content
              </a>
            </div>
          </div>

          <div className="portfolio-preview">
            <h3>Your Portfolio URL</h3>
            <div className="portfolio-url">
              {window.location.origin}/portfolio/{dashboardData?.user?.username}
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
              <h4>Current Plan: {dashboardData?.user?.plan}</h4>
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
