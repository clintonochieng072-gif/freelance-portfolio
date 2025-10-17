// frontend/src/components/AboutSection.js
import React from "react";

const AboutSection = ({ isAdmin, portfolio, updatePortfolio }) => {
  const handleAboutChange = (e) => {
    if (isAdmin && updatePortfolio) {
      updatePortfolio({ about: e.target.value });
    }
  };

  return (
    <section className="section about-section">
      <h2>About</h2>
      {isAdmin ? (
        <textarea
          value={portfolio.about || ""}
          onChange={handleAboutChange}
          placeholder="Tell us about yourself..."
          className="about-textarea"
          rows="5"
          style={{ width: "100%", padding: "10px" }}
        />
      ) : portfolio.about && portfolio.about.trim() !== "" ? (
        <p className="about-text">{portfolio.about}</p>
      ) : (
        <p>No about information provided.</p>
      )}
    </section>
  );
};

export default AboutSection;
