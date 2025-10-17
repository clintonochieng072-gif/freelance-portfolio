// frontend/src/components/ProfilePictureSection.js
import React from "react";

const ProfilePictureSection = ({ isAdmin, portfolio, updatePortfolio }) => {
  const handleFileChange = async (e) => {
    if (isAdmin && updatePortfolio && e.target.files[0]) {
      const file = e.target.files[0];
      // Simulate upload (replace with real backend call)
      try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch(
          "https://portfolio-backend-clinton.onrender.com/api/portfolio/upload-image",
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        );
        if (!res.ok) throw new Error("Image upload failed");
        const data = await res.json();
        updatePortfolio({ profilePicture: data.imageUrl });
      } catch (err) {
        console.error("Error uploading image:", err);
      }
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
            style={{ display: "none" }}
          />
          <button
            onClick={() => document.getElementById("profilePicture").click()}
            style={{
              padding: "10px 20px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Add Picture
          </button>
          {portfolio.profilePicture && (
            <img
              src={portfolio.profilePicture}
              alt="Profile Preview"
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
          src={portfolio.profilePicture}
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
