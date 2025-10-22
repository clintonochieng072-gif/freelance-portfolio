import React from "react";
import { FiTrash2 } from "react-icons/fi";
import "./Admin.css";

function ResumeSection({
  isAdmin,
  portfolio,
  onChange,
  onFileChange,
  onDeleteResume,
}) {
  const { resumeUrl, resumeFile } = portfolio;

  // Handle delete with proper event prevention
  const handleDeleteClick = (e) => {
    e.preventDefault(); // Prevent default action
    e.stopPropagation(); // Stop event bubbling
    onDeleteResume();
  };

  // Handle download with proper event handling
  const handleDownloadClick = (e) => {
    e.stopPropagation(); // Stop event bubbling
    // Let the natural download happen via the anchor tag
  };

  if (isAdmin) {
    return (
      <div className="resume-section">
        <h3>Resume</h3>
        <input
          type="url"
          placeholder="Resume URL (optional, e.g., https://example.com/resume)"
          value={resumeUrl || ""}
          onChange={(e) => onChange("resumeUrl", e.target.value)}
          className="editable-item"
          style={{ width: "100%", margin: "5px 0" }}
        />
        <input
          type="file"
          accept="application/pdf,application/vnd.oasis.opendocument.text,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={onFileChange}
          className="editable-item"
          style={{ margin: "5px 0" }}
        />
        {resumeUrl && (
          <div style={{ marginTop: "10px" }}>
            <iframe
              src={resumeUrl}
              title="Resume Preview"
              width="100%"
              height="300px"
              style={{ border: "1px solid #ccc", borderRadius: "4px" }}
            />
            <p style={{ color: "#666", fontSize: "14px", margin: "5px 0" }}>
              {resumeFile ? `File: ${resumeFile.name}` : "File: Resume"}
              <br />
              Note: Some file types (e.g., .docx, .odt) may not display in the
              browser but can be downloaded.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                onClick={handleDownloadClick}
                style={{
                  color: "#007bff",
                  textDecoration: "none",
                  padding: "5px 10px",
                  border: "1px solid #007bff",
                  borderRadius: "4px",
                }}
              >
                Download Resume
              </a>
              <FiTrash2
                onClick={handleDeleteClick}
                className="delete-icon"
                title="Delete Resume"
                style={{
                  cursor: "pointer",
                  color: "#dc3545",
                  fontSize: "18px",
                  padding: "5px",
                  border: "1px solid #dc3545",
                  borderRadius: "4px",
                }}
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
      <iframe
        src={resumeUrl}
        title="Resume Preview"
        width="100%"
        height="300px"
        style={{ border: "1px solid #ccc", borderRadius: "4px" }}
      />
      <p style={{ color: "#666", fontSize: "14px", margin: "5px 0" }}>
        Note: Some file types (e.g., .docx, .odt) may not display in the browser
        but can be downloaded.
      </p>
      <p>
        <a
          href={resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          style={{
            color: "#007bff",
            textDecoration: "none",
            padding: "5px 10px",
            border: "1px solid #007bff",
            borderRadius: "4px",
            display: "inline-block",
          }}
        >
          Download Resume
        </a>
      </p>
    </div>
  );
}

export default ResumeSection;
