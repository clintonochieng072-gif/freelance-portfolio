// frontend/src/components/IntroductionSection.js
import React from "react";

const IntroductionSection = ({ isAdmin, portfolio, updatePortfolio }) => {
  const handleDisplayNameChange = (e) => {
    if (isAdmin && updatePortfolio) {
      updatePortfolio({ displayName: e.target.value });
    }
  };

  const handleOccupationChange = (e) => {
    if (isAdmin && updatePortfolio) {
      updatePortfolio({ occupation: e.target.value });
    }
  };

  return (
    <section className="section introduction-section">
      <h2>Welcome</h2>
      {isAdmin ? (
        <div>
          <label htmlFor="displayName">Full Name:</label>
          <input
            type="text"
            id="displayName"
            value={portfolio.displayName || ""}
            onChange={handleDisplayNameChange}
            placeholder="Enter your full name (e.g., Clinton Ochieng)"
            className="introduction-input"
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
          />
          <label htmlFor="occupation">Occupation:</label>
          <input
            type="text"
            id="occupation"
            value={portfolio.occupation || ""}
            onChange={handleOccupationChange}
            placeholder="Enter your occupation (e.g., Full Stack Developer)"
            className="introduction-input"
            style={{ width: "100%", padding: "10px" }}
          />
        </div>
      ) : (
        <p className="introduction-text">
          {portfolio.introduction || "Welcome to my portfolio!"}
        </p>
      )}
    </section>
  );
};

export default IntroductionSection;
