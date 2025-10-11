import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import "../App.css";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function HomePage({ username }) {
  const [contacts, setContacts] = useState({});
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPortfolio = useCallback(async () => {
    try {
      console.log("Fetching portfolio for:", username);
      const res = await fetch(`${API_URL}/portfolio/${username}`);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Portfolio data received:", data);

      // Filter out empty contact fields
      const cleanContacts = {};
      if (data.contacts) {
        Object.keys(data.contacts).forEach((key) => {
          if (data.contacts[key] && data.contacts[key].trim() !== "") {
            cleanContacts[key] = data.contacts[key];
          }
        });
      }

      setContacts(cleanContacts);
      setSkills(data.skills || []);
      setProjects(data.projects || []);
      setTestimonials(data.testimonials || []);
      setError("");
    } catch (err) {
      console.error("Error fetching portfolio:", err);
      setError("Failed to load portfolio data");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (!username) {
      setError("No username provided");
      setLoading(false);
      return;
    }

    fetchPortfolio();
    const socket = io(SOCKET_URL);
    socket.emit("joinPortfolioRoom", username);

    socket.on(
      "portfolioUpdated",
      ({ contacts, skills, projects, testimonials }) => {
        console.log("Real-time update received");
        if (contacts) {
          const cleanContacts = {};
          Object.keys(contacts).forEach((key) => {
            if (contacts[key] && contacts[key].trim() !== "") {
              cleanContacts[key] = contacts[key];
            }
          });
          setContacts(cleanContacts);
        }
        if (skills) setSkills(skills);
        if (projects) setProjects(projects);
        if (testimonials) setTestimonials(testimonials);
      }
    );

    return () => socket.disconnect();
  }, [username, fetchPortfolio]);

  if (loading) return <p>Loading portfolio...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="App">
      <h1>{username}'s Portfolio</h1>

      {/* Contacts */}
      <section className="section">
        <h2>Contacts</h2>
        {Object.keys(contacts).length > 0 ? (
          <ul className="contacts-list">
            {Object.entries(contacts).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {value}
              </li>
            ))}
          </ul>
        ) : (
          <p>No contacts added yet.</p>
        )}
      </section>

      {/* Skills */}
      <section className="section">
        <h2>Skills</h2>
        {skills.length > 0 ? (
          <div className="skills-grid">
            {skills.map((skill, i) => (
              <span key={i} className="skill-tag">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p>No skills added yet.</p>
        )}
      </section>

      {/* Projects */}
      <section className="section">
        <h2>Projects</h2>
        {projects.length > 0 ? (
          <div className="projects-list">
            {projects.map((p, i) => (
              <div key={i} className="project-card">
                {p.name && <h3>{p.name}</h3>}
                {p.description && <p>{p.description}</p>}
                {/* ✅ UPDATE Project Links - Vertical Layout with Better Labels */}
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
        ) : (
          <p>No projects added yet.</p>
        )}
      </section>

      {/* ✅ UPDATE Testimonials with Profile Pictures */}
      {testimonials.length > 0 && (
        <section className="section">
          <h2>Testimonials</h2>
          <div className="testimonials-list">
            {testimonials.map((t, i) => (
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
    </div>
  );
}

export default HomePage;
