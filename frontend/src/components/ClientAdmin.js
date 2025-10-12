import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGlobalContext } from "../context/GlobalContext";
import {
  FiUser,
  FiSettings,
  FiBarChart2,
  FiExternalLink,
  FiLogOut,
} from "react-icons/fi";
import "./Admin.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function ClientAdmin() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState({ displayName: "", email: "" });

  const { user, logout } = useGlobalContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token =
        localStorage.getItem("token") ||
        document.cookie.replace(
          /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
          "$1"
        );

      const res = await fetch(`${API_URL}/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        // Token is invalid, logout
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
      // If there's an error, redirect to login
      logout();
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const updateProfile = async () => {
    try {
      const token =
        localStorage.getItem("token") ||
        document.cookie.replace(
          /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
          "$1"
        );

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

      {/* Rest of your existing ClientAdmin component remains the same */}
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

      {/* ... rest of your existing JSX ... */}
    </div>
  );
}

export default ClientAdmin;
