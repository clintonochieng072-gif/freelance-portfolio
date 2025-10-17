import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import IntroductionSection from "./IntroductionSection";
import AboutSection from "./AboutSection";
import ProfilePictureSection from "./ProfilePictureSection";
import ResumeSection from "./ResumeSection";
import "../App.css";

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  "https://portfolio-backend-clinton.onrender.com";
const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://portfolio-backend-clinton.onrender.com/api";

function HomePage() {
  const { username } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPortfolio = useCallback(async () => {
    if (!username) {
      setError("No portfolio specified");
      setLoading(false);
      return;
    }

    try {
      console.log(`📡 Fetching portfolio for: ${username}`);
      const res = await fetch(`${API_URL}/portfolio/${username.toLowerCase()}`);

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Portfolio not found or is private`);
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("✅ Portfolio loaded:", data);

      // Validate portfolio structure
      if (!data || typeof data !== "object") {
        throw new Error("Invalid portfolio data received");
      }

      setPortfolio(data);
      setError("");
    } catch (err) {
      console.error("💥 Error fetching portfolio:", err);
      setError(err.message || "Portfolio not found or is private");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    // Support preview mode
    const previewData = localStorage.getItem("previewPortfolio");
    if (previewData && window.location.search.includes("preview=true")) {
      setPortfolio(JSON.parse(previewData));
      setLoading(false);
      localStorage.removeItem("previewPortfolio");
      return;
    }

    fetchPortfolio();

    // Socket setup with Render-friendly configuration
    const socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"], // Prefer polling for Render
      withCredentials: false, // Public view - no auth needed
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
    });

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
      if (username) {
        socket.emit("joinPortfolioRoom", username.toLowerCase());
      }
    });

    socket.on("connect_error", (err) => {
      console.warn(
        "⚠️ Socket connection error (using polling fallback):",
        err.message
      );
      // Don't crash - continue without real-time updates
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });

    socket.on("portfolioUpdated", ({ portfolio: updatedPortfolio }) => {
      console.log("🔄 Portfolio updated via socket");
      if (
        updatedPortfolio &&
        updatedPortfolio.username === username.toLowerCase()
      ) {
        setPortfolio(updatedPortfolio);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [username, fetchPortfolio]);

  if (loading) {
    return (
      <div className="App">
        <p>Loading portfolio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <p>Error: {error}</p>
        <button
          onClick={fetchPortfolio}
          style={{ marginTop: "10px", padding: "5px 10px" }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="App">
        <p>Portfolio not found</p>
      </div>
    );
  }

  // Safe data extraction with fallbacks
  const safeContacts =
    portfolio.contacts && typeof portfolio.contacts === "object"
      ? portfolio.contacts
      : {};
  const safeSkills = Array.isArray(portfolio.skills) ? portfolio.skills : [];
  const safeProjects = Array.isArray(portfolio.projects)
    ? portfolio.projects
    : [];
  const safeTestimonials = Array.isArray(portfolio.testimonials)
    ? portfolio.testimonials
    : [];

  return (
    <div className={`App ${portfolio.theme === "dark" ? "dark-mode" : ""}`}>
      <IntroductionSection isAdmin={false} portfolio={portfolio} />

      <header
        className="portfolio-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        <ProfilePictureSection isAdmin={false} portfolio={portfolio} />
        <div>
          <h1>{portfolio.displayName || portfolio.username || "Portfolio"}</h1>
          {portfolio.title && (
            <p className="portfolio-title">{portfolio.title}</p>
          )}
          {portfolio.bio && <p className="portfolio-bio">{portfolio.bio}</p>}
          <AboutSection isAdmin={false} portfolio={portfolio} />
        </div>
      </header>

      <ResumeSection isAdmin={false} portfolio={portfolio} />

      {Object.keys(safeContacts).length > 0 && (
        <section className="section">
          <h2>Contact Information</h2>
          <ul className="contacts-list">
            {Object.entries(safeContacts).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {value}
              </li>
            ))}
          </ul>
        </section>
      )}

      {safeSkills.length > 0 && (
        <section className="section">
          <h2>Skills & Expertise</h2>
          <div className="skills-grid">
            {safeSkills.map((skill, i) => (
              <span key={i} className="skill-tag">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {safeProjects.length > 0 && (
        <section className="section">
          <h2>Projects</h2>
          <div className="projects-list">
            {safeProjects.map((p, i) => (
              <div key={i} className="project-card">
                {p.name && <h3>{p.name}</h3>}
                {p.description && <p>{p.description}</p>}
                <div className="project-links">
                  {p.github && (
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      🔗 GitHub Link
                    </a>
                  )}
                  {p.liveDemo && (
                    <a
                      href={p.liveDemo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      🌐 Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {safeTestimonials.length > 0 && (
        <section className="section">
          <h2>Client Testimonials</h2>
          <div className="testimonials-list">
            {safeTestimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-header">
                  {t.profilePicture && (
                    <img
                      src={t.profilePicture}
                      alt={t.clientName}
                      className="testimonial-avatar"
                    />
                  )}
                  <div className="testimonial-info">
                    <strong>{t.clientName}</strong>
                    {t.position && <span>, {t.position}</span>}
                    {t.company && <span> at {t.company}</span>}
                  </div>
                </div>
                <p className="testimonial-comment">"{t.comment}"</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="portfolio-footer">
        <p>Powered by PortfolioPro</p>
      </footer>
    </div>
  );
}

export default HomePage;
