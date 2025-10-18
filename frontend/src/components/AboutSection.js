import React from "react";

const AboutSection = ({ isAdmin, portfolio, onChange }) => {
  const handleBioChange = (e) => {
    if (isAdmin && onChange) {
      onChange("bio", e.target.value);
    }
  };

  return (
    <section className="section about-section">
      <h2>About</h2>
      {isAdmin ? (
        <textarea
          value={portfolio.bio || ""}
          onChange={handleBioChange}
          placeholder="Tell us about yourself..."
          className="editable-item"
          rows="5"
          style={{ width: "100%", padding: "10px" }}
        />
      ) : portfolio.bio && portfolio.bio.trim() !== "" ? (
        <p className="about-text">{portfolio.bio}</p>
      ) : (
        <p>No about information provided.</p>
      )}
    </section>
  );
};

export default AboutSection;
