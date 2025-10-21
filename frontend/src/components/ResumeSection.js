import React from "react";
import { FiTrash2 } from "react-icons/fi";
import "./Admin.css";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://portfolio-backend-clinton.onrender.com";

function ResumeSection({
  isAdmin,
  portfolio,
  onChange,
  onFileChange,
  onDeleteResume,
}) {
  const { resumeUrl, resumeFile } = portfolio;

  if (isAdmin) {
    return (
      <div className="resume-section">
        <h3>Resume</h3>
        <input
          type="url"
          placeholder="Resume URL (optional, e.g., https://example.com/resume.pdf)"
          value={resumeUrl || ""}
          onChange={(e) => onChange("resumeUrl", e.target.value)}
          className="editable-item"
          style={{ width: "100%", margin: "5px 0" }}
        />
        <input
          type="file"
          accept=".pdf"
          onChange={onFileChange}
          className="editable-item"
          style={{ margin: "5px 0" }}
        />
        {resumeUrl && (
          <div style={{ marginTop: "10px" }}>
            <embed
              src={`${API_URL}${resumeUrl}`}
              type="application/pdf"
              width="100%"
              height="300px"
              style={{ border: "1px solid #ccc", borderRadius: "4px" }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              <a
                href={`${API_URL}${resumeUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#007bff", textDecoration: "none" }}
              >
                {resumeFile ? resumeFile.name : "Download Resume"}
              </a>
              <FiTrash2
                onClick={onDeleteResume}
                className="delete-icon"
                title="Delete Resume"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!resumeUrl || resumeUrl.trim() === "") {
    return null;
  }

  return (
    <div className="resume-section">
      <h3>Resume</h3>
      <embed
        src={`${API_URL}${resumeUrl}`}
        type="application/pdf"
        width="100%"
        height="300px"
        style={{ border: "1px solid #ccc", borderRadius: "4px" }}
      />
      <p>
        <a
          href={`${API_URL}${resumeUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#007bff", textDecoration: "none" }}
        >
          Download Resume
        </a>
      </p>
    </div>
  );
}

export default ResumeSection;
