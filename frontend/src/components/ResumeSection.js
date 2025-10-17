import React from "react";

function ResumeSection({ isAdmin, portfolio, onChange, onFileChange }) {
  if (isAdmin) {
    return (
      <div className="resume-section">
        <input
          type="url"
          placeholder="Resume URL (optional, e.g., https://example.com/resume.pdf)"
          value={portfolio.resumeUrl || ""}
          onChange={(e) => onChange("resumeUrl", e.target.value)}
          style={{ width: "100%", margin: "5px 0" }}
        />
        <input
          type="file"
          accept=".pdf"
          onChange={onFileChange}
          style={{ margin: "5px 0" }}
        />
        {portfolio.resumeUrl && (
          <p>
            <a
              href={portfolio.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Preview Uploaded Resume
            </a>
          </p>
        )}
      </div>
    );
  }

  // Optional in public view
  if (!portfolio?.resumeUrl || portfolio.resumeUrl.trim() === "") {
    return null;
  }

  return (
    <div className="resume-section">
      <p>
        <a href={portfolio.resumeUrl} target="_blank" rel="noopener noreferrer">
          View Resume
        </a>
      </p>
    </div>
  );
}

export default ResumeSection;
