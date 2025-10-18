import React from "react";

const IntroductionSection = ({ isAdmin, portfolio, onChange }) => {
  const handleDisplayNameChange = (e) => {
    if (isAdmin && onChange) {
      onChange("displayName", e.target.value);
    }
  };

  const handleTitleChange = (e) => {
    if (isAdmin && onChange) {
      onChange("title", e.target.value);
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
            className="editable-item"
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
          />
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            value={portfolio.title || ""}
            onChange={handleTitleChange}
            placeholder="Enter your title (e.g., Full Stack Developer)"
            className="editable-item"
            style={{ width: "100%", padding: "10px" }}
          />
        </div>
      ) : (
        <div className="introduction-text">
          {portfolio.displayName && portfolio.displayName.trim() !== "" && (
            <h1>{portfolio.displayName}</h1>
          )}
          {portfolio.title && portfolio.title.trim() !== "" && (
            <p>{portfolio.title}</p>
          )}
          {!portfolio.displayName && !portfolio.title && (
            <p>Welcome to my portfolio!</p>
          )}
        </div>
      )}
    </section>
  );
};

export default IntroductionSection;
