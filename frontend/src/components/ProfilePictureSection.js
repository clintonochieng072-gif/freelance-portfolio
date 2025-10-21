import React from "react";

const BASE_URL =
  process.env.REACT_APP_BASE_URL ||
  "https://portfolio-backend-clinton.onrender.com";

const ProfilePictureSection = ({ isAdmin, portfolio, onChange }) => {
  const handleFileChange = (e) => {
    if (isAdmin && onChange && e.target.files[0]) {
      onChange(e); // Pass event to AdminPage.js
    }
  };

  return (
    <div className="profile-picture-section">
      {isAdmin ? (
        <div>
          <label htmlFor="profilePicture" className="profile-picture-label">
            Upload Profile Picture
          </label>
          <input
            type="file"
            id="profilePicture"
            accept="image/*"
            onChange={handleFileChange}
            className="editable-item"
            style={{ display: "none" }}
          />
          <button
            onClick={() => document.getElementById("profilePicture").click()}
            className="editable-item"
          >
            Add Picture
          </button>
          {portfolio.profilePicture && (
            <img
              src={`${BASE_URL}${portfolio.profilePicture}`}
              alt="Profile Preview"
              className="profile-picture-preview"
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                marginTop: "10px",
              }}
            />
          )}
        </div>
      ) : portfolio.profilePicture && portfolio.profilePicture.trim() !== "" ? (
        <img
          src={`${BASE_URL}${portfolio.profilePicture}`}
          alt="Profile"
          className="profile-picture"
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          className="profile-picture-placeholder"
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "#ddd",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          No Image
        </div>
      )}
    </div>
  );
};

export default ProfilePictureSection;
