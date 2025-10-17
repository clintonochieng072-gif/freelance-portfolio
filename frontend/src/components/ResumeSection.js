// frontend/src/components/ResumeSection.js
import React from "react";

const ResumeSection = ({ isAdmin, portfolio, updatePortfolio }) => {
  const handleResumeChange = (e) => {
    if (isAdmin && updatePortfolio) {
      updatePortfolio({ resumeUrl: e.target.value });
    }
  };

  return (
    <section className="section resume-section">
      <h2>Resume</h2>
      {isAdmin ? (
        <div>
          <label htmlFor="resumeUrl">Resume URL:</label>
          <input
            type="text"
            id="resumeUrl"
            value={portfolio.resumeUrl || ""}
            onChange={handleResumeChange}
            placeholder="Enter resume URL (e.g., https://example.com/resume.pdf)"
            style={{ width: "100%", padding: "10px", marginTop: "5px" }}
          />
        </div>
      ) : portfolio.resumeUrl && portfolio.resumeUrl.trim() !== "" ? (
        <a
          href={portfolio.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="resume-link"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#007bff",
            color: "white",
            textDecoration: "none",
            borderRadius: "5px",
          }}
        >
          Download Resume
        </a>
      ) : (
        <p>No resume available.</p>
      )}
    </section>
  );
};

export default ResumeSection;
