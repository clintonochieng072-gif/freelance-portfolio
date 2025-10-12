import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import "../App.css";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

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
      const res = await fetch(`${API_URL}/portfolio/${username}`);

      if (!res.ok) {
        throw new Error(`Portfolio not found`);
      }

      const data = await res.json();
      setPortfolio(data);
      setError("");
    } catch (err) {
      console.error("Error fetching portfolio:", err);
      setError("Portfolio not found or is private");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchPortfolio();

    const socket = io(SOCKET_URL);
    socket.emit("joinPortfolioRoom", username);

    socket.on("portfolioUpdated", ({ portfolio: updatedPortfolio }) => {
      if (updatedPortfolio && updatedPortfolio.username === username) {
        setPortfolio(updatedPortfolio);
      }
    });

    return () => socket.disconnect();
  }, [username, fetchPortfolio]);

  if (loading)
    return (
      <div className="App">
        <p>Loading portfolio...</p>
      </div>
    );
  if (error)
    return (
      <div className="App">
        <p>Error: {error}</p>
      </div>
    );
  if (!portfolio)
    return (
      <div className="App">
        <p>Portfolio not found</p>
      </div>
    );

  return (
    <div className={`App ${portfolio.theme === "dark" ? "dark-mode" : ""}`}>
      <header className="portfolio-header">
        <h1>{portfolio.displayName || portfolio.username}'s Portfolio</h1>
        {portfolio.title && (
          <p className="portfolio-title">{portfolio.title}</p>
        )}
        {portfolio.bio && <p className="portfolio-bio">{portfolio.bio}</p>}
      </header>

      {/* Contacts */}
      {Object.keys(portfolio.contacts).length > 0 && (
        <section className="section">
          <h2>Contact Information</h2>
          <ul className="contacts-list">
            {Object.entries(portfolio.contacts).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {value}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Skills */}
      {portfolio.skills.length > 0 && (
        <section className="section">
          <h2>Skills & Expertise</h2>
          <div className="skills-grid">
            {portfolio.skills.map((skill, i) => (
              <span key={i} className="skill-tag">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {portfolio.projects.length > 0 && (
        <section className="section">
          <h2>Projects</h2>
          <div className="projects-list">
            {portfolio.projects.map((p, i) => (
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

      {/* Testimonials */}
      {portfolio.testimonials.length > 0 && (
        <section className="section">
          <h2>Client Testimonials</h2>
          <div className="testimonials-list">
            {portfolio.testimonials.map((t, i) => (
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
