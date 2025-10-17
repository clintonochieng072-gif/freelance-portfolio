import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { jsPDF } from "jspdf";
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
          throw new Error("Portfolio not found or is not published");
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      console.log("✅ Portfolio loaded:", data);
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

    const socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      withCredentials: false,
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

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    let yOffset = 10;

    // Full Name
    if (portfolio.displayName && portfolio.displayName.trim() !== "") {
      doc.setFontSize(20);
      doc.text(portfolio.displayName, 10, yOffset);
      yOffset += 10;
    }

    // Title
    if (portfolio.title && portfolio.title.trim() !== "") {
      doc.setFontSize(14);
      doc.text(portfolio.title, 10, yOffset);
      yOffset += 10;
    }

    // About
    if (portfolio.bio && portfolio.bio.trim() !== "") {
      doc.setFontSize(12);
      doc.text("About:", 10, yOffset);
      yOffset += 6;
      doc.text(portfolio.bio, 10, yOffset, { maxWidth: 190 });
      yOffset += doc.splitTextToSize(portfolio.bio, 190).length * 6 + 10;
    }

    // Resume
    if (portfolio.resumeUrl && portfolio.resumeUrl.trim() !== "") {
      doc.setFontSize(12);
      doc.text("Resume:", 10, yOffset);
      yOffset += 6;
      doc.text(portfolio.resumeUrl, 10, yOffset, { maxWidth: 190 });
      yOffset += 10;
    }

    // Contacts
    if (portfolio.contacts && Object.keys(portfolio.contacts).length > 0) {
      doc.setFontSize(12);
      doc.text("Contacts:", 10, yOffset);
      yOffset += 6;
      Object.entries(portfolio.contacts).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          doc.text(`${key}: ${value}`, 10, yOffset);
          yOffset += 6;
        }
      });
      yOffset += 10;
    }

    // Skills
    if (portfolio.skills && portfolio.skills.length > 0) {
      doc.setFontSize(12);
      doc.text("Skills:", 10, yOffset);
      yOffset += 6;
      portfolio.skills.forEach((skill) => {
        if (skill && skill.trim() !== "") {
          doc.text(`- ${skill}`, 10, yOffset);
          yOffset += 6;
        }
      });
      yOffset += 10;
    }

    // Projects
    if (portfolio.projects && portfolio.projects.length > 0) {
      doc.setFontSize(12);
      doc.text("Projects:", 10, yOffset);
      yOffset += 6;
      portfolio.projects.forEach((project) => {
        if (project.name && project.name.trim() !== "") {
          doc.text(project.name, 10, yOffset);
          yOffset += 6;
          if (project.description && project.description.trim() !== "") {
            doc.text(project.description, 15, yOffset, { maxWidth: 180 });
            yOffset += doc.splitTextToSize(project.description, 180).length * 6;
          }
          if (project.github && project.github.trim() !== "") {
            doc.text(`GitHub: ${project.github}`, 15, yOffset);
            yOffset += 6;
          }
          if (project.liveDemo && project.liveDemo.trim() !== "") {
            doc.text(`Live Demo: ${project.liveDemo}`, 15, yOffset);
            yOffset += 6;
          }
          yOffset += 5;
        }
      });
      yOffset += 10;
    }

    // Testimonials
    if (portfolio.testimonials && portfolio.testimonials.length > 0) {
      doc.setFontSize(12);
      doc.text("Testimonials:", 10, yOffset);
      yOffset += 6;
      portfolio.testimonials.forEach((t) => {
        if (t.clientName && t.clientName.trim() !== "") {
          const positionCompany = [
            t.position && t.position.trim() !== "" ? t.position : "",
            t.company && t.company.trim() !== "" ? t.company : "",
          ]
            .filter(Boolean)
            .join(", ");
          doc.text(
            `${t.clientName}${positionCompany ? ` (${positionCompany})` : ""}`,
            10,
            yOffset
          );
          yOffset += 6;
          if (t.comment && t.comment.trim() !== "") {
            doc.text(t.comment, 15, yOffset, { maxWidth: 180 });
            yOffset += doc.splitTextToSize(t.comment, 180).length * 6;
          }
          yOffset += 5;
        }
      });
    }

    // Footer
    doc.setFontSize(10);
    doc.text("Powered by PortfolioPro", 10, yOffset);

    doc.save(`${portfolio.displayName || username}_portfolio.pdf`);
  };

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
  const hasDisplayName =
    portfolio.displayName && portfolio.displayName.trim() !== "";
  const hasTitle = portfolio.title && portfolio.title.trim() !== "";

  // Helper to check if value is a URL
  const isUrl = (value) => {
    return (
      typeof value === "string" &&
      (value.startsWith("http://") || value.startsWith("https://"))
    );
  };

  return (
    <div className={`App ${portfolio.theme === "dark" ? "dark-mode" : ""}`}>
      {/* Header with Introduction, Profile Picture, Name, Title, About */}
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
          <IntroductionSection isAdmin={false} portfolio={portfolio} />
          {hasDisplayName && <h1>{portfolio.displayName}</h1>}
          {hasTitle && <p className="portfolio-title">{portfolio.title}</p>}
          <AboutSection isAdmin={false} portfolio={portfolio} />
        </div>
      </header>

      {/* Resume */}
      <ResumeSection isAdmin={false} portfolio={portfolio} />

      {/* Contacts - Show only if has data */}
      {Object.keys(safeContacts).length > 0 && (
        <section className="section">
          <h2>Contact Information</h2>
          <ul className="contacts-list">
            {Object.entries(safeContacts).map(
              ([key, value]) =>
                value &&
                value.trim() !== "" && (
                  <li key={key}>
                    <strong>{key}:</strong>{" "}
                    {isUrl(value) ? (
                      <a href={value} target="_blank" rel="noopener noreferrer">
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </li>
                )
            )}
          </ul>
        </section>
      )}

      {/* Skills - Show only if has data */}
      {safeSkills.length > 0 && (
        <section className="section">
          <h2>Skills & Expertise</h2>
          <div className="skills-grid">
            {safeSkills.map(
              (skill, i) =>
                skill &&
                skill.trim() !== "" && (
                  <span key={i} className="skill-tag">
                    {skill}
                  </span>
                )
            )}
          </div>
        </section>
      )}

      {/* Projects - Show only if has data */}
      {safeProjects.length > 0 && (
        <section className="section">
          <h2>Projects</h2>
          <div className="projects-list">
            {safeProjects.map(
              (p, i) =>
                (p.name || p.description || p.github || p.liveDemo) && (
                  <div key={i} className="project-card">
                    {p.name && p.name.trim() !== "" && <h3>{p.name}</h3>}
                    {p.description && p.description.trim() !== "" && (
                      <p>{p.description}</p>
                    )}
                    <div className="project-links">
                      {p.github && p.github.trim() !== "" && (
                        <a
                          href={p.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-link"
                        >
                          🔗 GitHub Link
                        </a>
                      )}
                      {p.liveDemo && p.liveDemo.trim() !== "" && (
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
                )
            )}
          </div>
        </section>
      )}

      {/* Testimonials - Show only if has data */}
      {safeTestimonials.length > 0 && (
        <section className="section">
          <h2>Client Testimonials</h2>
          <div className="testimonials-list">
            {safeTestimonials.map(
              (t, i) =>
                (t.clientName ||
                  t.position ||
                  t.company ||
                  t.comment ||
                  t.profilePicture) && (
                  <div key={i} className="testimonial-card">
                    <div className="testimonial-header">
                      {t.profilePicture && t.profilePicture.trim() !== "" && (
                        <img
                          src={t.profilePicture}
                          alt={t.clientName || "Client"}
                          className="testimonial-avatar"
                        />
                      )}
                      <div className="testimonial-info">
                        {t.clientName && t.clientName.trim() !== "" && (
                          <strong>{t.clientName}</strong>
                        )}
                        {(t.position || t.company) && (
                          <span>
                            {t.position &&
                              t.position.trim() !== "" &&
                              `, ${t.position}`}
                            {t.company &&
                              t.company.trim() !== "" &&
                              ` at ${t.company}`}
                          </span>
                        )}
                      </div>
                    </div>
                    {t.comment && t.comment.trim() !== "" && (
                      <p className="testimonial-comment">"{t.comment}"</p>
                    )}
                  </div>
                )
            )}
          </div>
        </section>
      )}

      {/* Download Portfolio Button */}
      <section className="section">
        <button
          onClick={handleDownloadPDF}
          className="download-btn"
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          Download Portfolio as PDF
        </button>
      </section>

      <footer className="portfolio-footer">
        <p>Powered by PortfolioPro</p>
      </footer>
    </div>
  );
}

export default HomePage;
