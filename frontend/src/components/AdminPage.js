import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { FiTrash2, FiArrowRight } from "react-icons/fi";
import { useGlobalContext } from "../context/GlobalContext";
import IntroductionSection from "./IntroductionSection";
import AboutSection from "./AboutSection";
import ProfilePictureSection from "./ProfilePictureSection";
import ResumeSection from "./ResumeSection";
import "./Admin.css";

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  "https://portfolio-backend-clinton.onrender.com";
const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://portfolio-backend-clinton.onrender.com/api";

function AdminPage() {
  const { username: urlUsername } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useGlobalContext();
  const [effectiveUsername, setEffectiveUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Portfolio states
  const [contacts, setContacts] = useState({});
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [theme, setTheme] = useState("light");
  const [isPublished, setIsPublished] = useState(false);

  // Form states
  const [newContact, setNewContact] = useState({ key: "", value: "" });
  const [addingContact, setAddingContact] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    github: "",
    liveDemo: "",
  });
  const [addingProject, setAddingProject] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    clientName: "",
    comment: "",
    position: "",
    company: "",
    profilePicture: "",
  });
  const [addingTestimonial, setAddingTestimonial] = useState(false);

  const socketRef = useRef(null);

  // Fetch portfolio
  useEffect(() => {
    const resolveUsername = () => {
      console.log("🔍 Resolving username...");
      let usernameToUse = urlUsername || user?.username;
      if (usernameToUse && usernameToUse !== "undefined") {
        setEffectiveUsername(usernameToUse.toLowerCase());
        console.log("✅ Username set:", usernameToUse);
      } else {
        setError("No user specified");
        setLoading(false);
      }
    };

    resolveUsername();
  }, [urlUsername, user]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!effectiveUsername) return;

      try {
        console.log("📡 Fetching portfolio for:", effectiveUsername);
        const res = await fetch(`${API_URL}/portfolio/me/portfolio`, {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401) {
            console.log("🚫 Unauthorized - logging out");
            logout();
            navigate("/login");
            return;
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("✅ Portfolio loaded:", data);
        setContacts(data.contacts || {});
        setSkills(data.skills || []);
        setProjects(data.projects || []);
        setTestimonials(data.testimonials || []);
        setDisplayName(data.displayName || "");
        setTitle(data.title || "");
        setBio(data.bio || "");
        setProfilePictureUrl(data.profilePicture || "");
        setResumeUrl(data.resumeUrl || "");
        setTheme(data.theme || "light");
        setIsPublished(data.isPublished || false);
        setLoading(false);
      } catch (err) {
        console.error("💥 Fetch error:", err);
        setError("Failed to load portfolio");
        setLoading(false);
      }
    };

    if (effectiveUsername) {
      fetchPortfolio();

      socketRef.current = io(SOCKET_URL, {
        transports: ["polling", "websocket"],
        withCredentials: true,
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
      });

      socketRef.current.on("connect", () => {
        console.log("🔌 Socket connected:", socketRef.current.id);
        socketRef.current.emit("joinPortfolioRoom", effectiveUsername);
      });

      socketRef.current.on("connect_error", (err) => {
        console.warn("⚠️ Socket error:", err.message);
      });

      socketRef.current.on("portfolioUpdated", ({ portfolio }) => {
        if (portfolio?.username === effectiveUsername) {
          console.log("🔄 Portfolio updated via socket:", portfolio);
          setContacts(portfolio.contacts || {});
          setSkills(portfolio.skills || []);
          setProjects(portfolio.projects || []);
          setTestimonials(portfolio.testimonials || []);
          setDisplayName(portfolio.displayName || "");
          setTitle(portfolio.title || "");
          setBio(portfolio.bio || "");
          setProfilePictureUrl(portfolio.profilePicture || "");
          setResumeUrl(portfolio.resumeUrl || "");
          setTheme(portfolio.theme || "light");
          setIsPublished(portfolio.isPublished || false);
        }
      });

      return () => socketRef.current?.disconnect();
    }
  }, [effectiveUsername, logout, navigate]);

  // Handle file uploads
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setProfilePictureUrl(URL.createObjectURL(file));
    }
  };

  const handleResumeFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setResumeUrl(URL.createObjectURL(file));
    }
  };

  const savePortfolio = async () => {
    try {
      setIsSaving(true);
      setSaveStatus("Saving...");
      setError("");

      console.log("💾 Starting portfolio save...");
      console.log("📊 Current contacts:", contacts);
      console.log("📊 Current skills:", skills);
      console.log("📊 Current projects:", projects);

      const formData = new FormData();
      formData.append("contacts", JSON.stringify(contacts));
      formData.append(
        "skills",
        JSON.stringify(skills.filter((s) => s?.trim()))
      );
      formData.append("projects", JSON.stringify(projects));
      formData.append("testimonials", JSON.stringify(testimonials));
      formData.append("displayName", displayName || "");
      formData.append("title", title || "");
      formData.append("bio", bio || "");
      formData.append("theme", theme);
      formData.append("isPublished", isPublished);

      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }
      if (resumeFile) {
        formData.append("resumeFile", resumeFile);
      } else {
        formData.append("resumeUrl", resumeUrl || "");
      }

      console.log("📡 Sending portfolio save request...");

      const res = await fetch(`${API_URL}/portfolio/update`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.log("🚫 Unauthorized - logging out");
          logout();
          navigate("/login");
          return;
        }
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ Portfolio saved successfully:", data);
      setSaveStatus("Saved ✓");
      setTimeout(() => setSaveStatus(""), 2000);
      setError("");

      // Update local state with saved data
      setProfilePictureUrl(data.portfolio.profilePicture || profilePictureUrl);
      setResumeUrl(data.portfolio.resumeUrl || resumeUrl);

      // Emit socket update
      socketRef.current?.emit("portfolioUpdated", {
        username: effectiveUsername,
        portfolio: data.portfolio,
      });
    } catch (err) {
      console.error("💥 Save error:", err);
      setError(`Failed to save portfolio: ${err.message}`);
      setSaveStatus("");
    } finally {
      setIsSaving(false);
    }
  };

  // Preview handler
  const handlePreview = () => {
    const portfolio = {
      username: effectiveUsername,
      displayName,
      title,
      bio,
      profilePicture: profilePictureUrl,
      resumeUrl,
      contacts,
      skills,
      projects,
      testimonials,
      theme,
      isPublished,
    };
    localStorage.setItem("previewPortfolio", JSON.stringify(portfolio));
    window.open(`/portfolio/${effectiveUsername}?preview=true`, "_blank");
  };

  // Contact handlers
  const handleAddContact = () => setAddingContact(true);
  const handleContactChange = (field, value) =>
    setNewContact((prev) => ({ ...prev, [field]: value }));

  const handleNextContact = () => {
    if (newContact.key?.trim() || newContact.value?.trim()) {
      const baseKey =
        newContact.key.trim() || `Field${Object.keys(contacts).length + 1}`;
      let newKey = baseKey;
      let counter = 1;
      while (contacts[newKey]) {
        newKey = `${baseKey}_${counter}`;
        counter++;
      }

      const updatedContacts = { ...contacts, [newKey]: newContact.value || "" };
      setContacts(updatedContacts);
      setNewContact({ key: "", value: "" });
    }
  };

  const handleSaveContact = async () => {
    if (newContact.key?.trim() || newContact.value?.trim()) {
      const baseKey =
        newContact.key.trim() || `Field${Object.keys(contacts).length + 1}`;
      let newKey = baseKey;
      let counter = 1;
      while (contacts[newKey]) {
        newKey = `${baseKey}_${counter}`;
        counter++;
      }

      const updatedContacts = { ...contacts, [newKey]: newContact.value || "" };
      setContacts(updatedContacts);

      // Save to backend immediately
      await savePortfolio();
    }
    setNewContact({ key: "", value: "" });
    setAddingContact(false);
  };

  const handleEditContact = async (key, value) => {
    const updatedContacts = { ...contacts, [key]: value };
    setContacts(updatedContacts);
    // Auto-save after editing
    await savePortfolio();
  };

  const handleDeleteContact = async (key) => {
    const updatedContacts = { ...contacts };
    delete updatedContacts[key];
    setContacts(updatedContacts);
    // Auto-save after deletion
    await savePortfolio();
  };

  // Skills handlers
  const handleAddSkill = () => setAddingSkill(true);

  const handleNextSkill = () => {
    if (newSkill?.trim()) {
      const updatedSkills = [...skills, newSkill];
      setSkills(updatedSkills);
      setNewSkill("");
    }
  };

  const handleSaveSkill = async () => {
    if (newSkill?.trim()) {
      const updatedSkills = [...skills, newSkill];
      setSkills(updatedSkills);

      // Save to backend immediately
      await savePortfolio();
    }
    setNewSkill("");
    setAddingSkill(false);
  };

  const handleEditSkill = async (index, value) => {
    const updatedSkills = [...skills];
    updatedSkills[index] = value;
    setSkills(updatedSkills);
    // Auto-save after editing
    await savePortfolio();
  };

  const handleDeleteSkill = async (index) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    setSkills(updatedSkills);
    // Auto-save after deletion
    await savePortfolio();
  };

  // Projects handlers
  const handleAddProject = () => setAddingProject(true);

  const handleNextProject = () => {
    if (
      newProject.name?.trim() ||
      newProject.description?.trim() ||
      newProject.github?.trim() ||
      newProject.liveDemo?.trim()
    ) {
      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);
      setNewProject({ name: "", description: "", github: "", liveDemo: "" });
    }
  };

  const handleSaveProject = async () => {
    if (
      newProject.name?.trim() ||
      newProject.description?.trim() ||
      newProject.github?.trim() ||
      newProject.liveDemo?.trim()
    ) {
      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);

      // Save to backend immediately
      await savePortfolio();
    }
    setNewProject({ name: "", description: "", github: "", liveDemo: "" });
    setAddingProject(false);
  };

  const handleEditProject = async (index, field, value) => {
    const updatedProjects = [...projects];
    updatedProjects[index] = { ...updatedProjects[index], [field]: value };
    setProjects(updatedProjects);
    // Auto-save after editing
    await savePortfolio();
  };

  const handleDeleteProject = async (index) => {
    const updatedProjects = projects.filter((_, i) => i !== index);
    setProjects(updatedProjects);
    // Auto-save after deletion
    await savePortfolio();
  };

  // Testimonials handlers
  const handleAddTestimonial = () => setAddingTestimonial(true);

  const handleNextTestimonial = () => {
    if (
      newTestimonial.clientName?.trim() ||
      newTestimonial.comment?.trim() ||
      newTestimonial.position?.trim() ||
      newTestimonial.company?.trim() ||
      newTestimonial.profilePicture?.trim()
    ) {
      const updatedTestimonials = [...testimonials, newTestimonial];
      setTestimonials(updatedTestimonials);
      setNewTestimonial({
        clientName: "",
        comment: "",
        position: "",
        company: "",
        profilePicture: "",
      });
    }
  };

  const handleSaveTestimonial = async () => {
    if (
      newTestimonial.clientName?.trim() ||
      newTestimonial.comment?.trim() ||
      newTestimonial.position?.trim() ||
      newTestimonial.company?.trim() ||
      newTestimonial.profilePicture?.trim()
    ) {
      const updatedTestimonials = [...testimonials, newTestimonial];
      setTestimonials(updatedTestimonials);

      // Save to backend immediately
      await savePortfolio();
    }
    setNewTestimonial({
      clientName: "",
      comment: "",
      position: "",
      company: "",
      profilePicture: "",
    });
    setAddingTestimonial(false);
  };

  const handleEditTestimonial = async (index, field, value) => {
    const updatedTestimonials = [...testimonials];
    updatedTestimonials[index] = {
      ...updatedTestimonials[index],
      [field]: value,
    };
    setTestimonials(updatedTestimonials);
    // Auto-save after editing
    await savePortfolio();
  };

  const handleDeleteTestimonial = async (index) => {
    const updatedTestimonials = testimonials.filter((_, i) => i !== index);
    setTestimonials(updatedTestimonials);
    // Auto-save after deletion
    await savePortfolio();
  };

  // Profile handlers for components
  const handleProfileChange = async (field, value) => {
    switch (field) {
      case "displayName":
        setDisplayName(value);
        break;
      case "title":
        setTitle(value);
        break;
      case "bio":
        setBio(value);
        break;
      case "resumeUrl":
        setResumeUrl(value);
        break;
      default:
        break;
    }
    // Auto-save profile changes after a short delay
    setTimeout(() => savePortfolio(), 1000);
  };

  if (loading) {
    return (
      <div className="admin-container">
        <p>Loading portfolio...</p>
      </div>
    );
  }

  if (error && !effectiveUsername) {
    return (
      <div className="admin-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1>
        Admin Page - {effectiveUsername}
        {saveStatus && (
          <span style={{ color: "green", marginLeft: "10px" }}>
            {saveStatus}
          </span>
        )}
      </h1>
      {error && <p className="error-message">{error}</p>}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={handlePreview}
          className="save-btn"
          disabled={isSaving}
        >
          Preview Portfolio
        </button>
        <button
          onClick={savePortfolio}
          className="save-btn"
          style={{ marginLeft: "10px" }}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Portfolio"}
        </button>
      </div>

      {/* Profile Section */}
      <section>
        <h2>Profile</h2>
        <IntroductionSection
          isAdmin={true}
          portfolio={{ displayName, title }}
          onChange={handleProfileChange}
        />
        <ProfilePictureSection
          isAdmin={true}
          portfolio={{ profilePicture: profilePictureUrl }}
          onChange={handleProfilePictureChange}
        />
        <AboutSection
          isAdmin={true}
          portfolio={{ bio }}
          onChange={handleProfileChange}
        />
        <ResumeSection
          isAdmin={true}
          portfolio={{ resumeUrl, resumeFile }}
          onChange={handleProfileChange}
          onFileChange={handleResumeFileChange}
        />
        <div>
          <h3>Theme</h3>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
          </select>
        </div>
        <div>
          <h3>Publish</h3>
          <label>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            Make Portfolio Public
          </label>
        </div>
      </section>

      {/* Contacts Section */}
      <section>
        <h2>
          Contacts
          <button className="add-btn" onClick={handleAddContact}>
            ADD
          </button>
        </h2>
        {addingContact && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "10px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Field name (e.g., Email, GitHub)"
              value={newContact.key}
              onChange={(e) => handleContactChange("key", e.target.value)}
              style={{ flex: "1", minWidth: "200px" }}
            />
            <input
              type="text"
              placeholder="Value"
              value={newContact.value}
              onChange={(e) => handleContactChange("value", e.target.value)}
              style={{ flex: "1", minWidth: "200px" }}
            />
            <button
              className="next-btn"
              onClick={handleNextContact}
              disabled={isSaving}
            >
              <FiArrowRight /> Next
            </button>
            <button
              className="ok-btn"
              onClick={handleSaveContact}
              disabled={isSaving}
            >
              OK
            </button>
          </div>
        )}
        {Object.keys(contacts).length === 0 && !addingContact && (
          <p>No contacts added yet.</p>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {Object.entries(contacts).map(([key, value]) => (
            <li
              key={key}
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "10px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                className="editable-item"
                value={key}
                onChange={(e) => {
                  const newKey = e.target.value.trim();
                  if (newKey && newKey !== key && !contacts[newKey]) {
                    const updated = { ...contacts };
                    delete updated[key];
                    updated[newKey] = value;
                    setContacts(updated);
                    savePortfolio(); // Auto-save after renaming
                  }
                }}
                placeholder="Field name"
                style={{ flex: "1", minWidth: "150px" }}
              />
              <input
                className="editable-item"
                value={value}
                onChange={(e) => handleEditContact(key, e.target.value)}
                placeholder="Value"
                style={{ flex: "2", minWidth: "200px" }}
              />
              <FiTrash2
                onClick={() => handleDeleteContact(key)}
                style={{
                  cursor: "pointer",
                  color: "#ff4444",
                  fontSize: "18px",
                }}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Skills Section */}
      <section>
        <h2>
          Skills
          <button className="add-btn" onClick={handleAddSkill}>
            ADD
          </button>
        </h2>
        {addingSkill && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "10px",
              alignItems: "center",
            }}
          >
            <input
              className="editable-item"
              type="text"
              placeholder="Skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className="next-btn"
              onClick={handleNextSkill}
              disabled={isSaving}
            >
              <FiArrowRight /> Next
            </button>
            <button
              className="ok-btn"
              onClick={handleSaveSkill}
              disabled={isSaving}
            >
              OK
            </button>
          </div>
        )}
        {skills.length === 0 && !addingSkill && <p>No skills added yet.</p>}
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {skills.map(
            (skill, index) =>
              skill && (
                <div
                  key={`${skill}-${index}`}
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <input
                    className="editable-item"
                    type="text"
                    value={skill}
                    onChange={(e) => handleEditSkill(index, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <FiTrash2
                    onClick={() => handleDeleteSkill(index)}
                    style={{ cursor: "pointer", color: "#ff4444" }}
                  />
                </div>
              )
          )}
        </div>
      </section>

      {/* Projects Section */}
      <section>
        <h2>
          Projects
          <button className="add-btn" onClick={handleAddProject}>
            ADD
          </button>
        </h2>
        {addingProject && (
          <div style={{ marginBottom: "10px" }}>
            <input
              className="editable-item"
              type="text"
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) =>
                setNewProject({ ...newProject, name: e.target.value })
              }
              style={{ width: "100%", margin: "5px 0" }}
            />
            <textarea
              className="editable-item"
              placeholder="Description"
              value={newProject.description}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
              style={{ width: "100%", minHeight: "60px", margin: "5px 0" }}
            />
            <input
              className="editable-item"
              type="url"
              placeholder="GitHub Link"
              value={newProject.github}
              onChange={(e) =>
                setNewProject({ ...newProject, github: e.target.value })
              }
              style={{ width: "100%", margin: "5px 0" }}
            />
            <input
              className="editable-item"
              type="url"
              placeholder="Live Demo Link"
              value={newProject.liveDemo}
              onChange={(e) =>
                setNewProject({ ...newProject, liveDemo: e.target.value })
              }
              style={{ width: "100%", margin: "5px 0" }}
            />
            <div style={{ marginTop: "10px" }}>
              <button
                className="next-btn"
                onClick={handleNextProject}
                disabled={isSaving}
              >
                <FiArrowRight /> Next
              </button>
              <button
                className="ok-btn"
                onClick={handleSaveProject}
                disabled={isSaving}
              >
                OK
              </button>
            </div>
          </div>
        )}
        {projects.length === 0 && !addingProject && (
          <p>No projects added yet.</p>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {projects.map((p, i) => (
            <li
              key={`${p.name}-${i}`}
              style={{
                marginBottom: "15px",
                padding: "10px",
                border: "1px solid #ddd",
              }}
            >
              <input
                className="editable-item"
                value={p.name}
                onChange={(e) => handleEditProject(i, "name", e.target.value)}
                placeholder="Project Name"
                style={{ width: "100%", margin: "5px 0" }}
              />
              <textarea
                className="editable-item"
                value={p.description}
                onChange={(e) =>
                  handleEditProject(i, "description", e.target.value)
                }
                placeholder="Description"
                style={{ width: "100%", minHeight: "60px", margin: "5px 0" }}
              />
              <input
                className="editable-item"
                value={p.github}
                onChange={(e) => handleEditProject(i, "github", e.target.value)}
                placeholder="GitHub Link"
                style={{ width: "100%", margin: "5px 0" }}
              />
              <input
                className="editable-item"
                value={p.liveDemo}
                onChange={(e) =>
                  handleEditProject(i, "liveDemo", e.target.value)
                }
                placeholder="Live Demo Link"
                style={{ width: "100%", margin: "5px 0" }}
              />
              <FiTrash2
                onClick={() => handleDeleteProject(i)}
                style={{ cursor: "pointer", color: "#ff4444", float: "right" }}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Testimonials Section */}
      <section>
        <h2>
          Testimonials
          <button className="add-btn" onClick={handleAddTestimonial}>
            ADD
          </button>
        </h2>
        {addingTestimonial && (
          <div style={{ marginBottom: "10px" }}>
            <input
              className="editable-item"
              type="text"
              placeholder="Client Name"
              value={newTestimonial.clientName}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  clientName: e.target.value,
                })
              }
              style={{ width: "100%", margin: "5px 0" }}
            />
            <textarea
              className="editable-item"
              placeholder="Client Comment"
              value={newTestimonial.comment}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  comment: e.target.value,
                })
              }
              style={{ width: "100%", minHeight: "80px", margin: "5px 0" }}
            />
            <input
              className="editable-item"
              type="text"
              placeholder="Client Position"
              value={newTestimonial.position}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  position: e.target.value,
                })
              }
              style={{ width: "100%", margin: "5px 0" }}
            />
            <input
              className="editable-item"
              type="text"
              placeholder="Client Company"
              value={newTestimonial.company}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  company: e.target.value,
                })
              }
              style={{ width: "100%", margin: "5px 0" }}
            />
            <input
              className="editable-item"
              type="url"
              placeholder="Profile Picture URL"
              value={newTestimonial.profilePicture}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  profilePicture: e.target.value,
                })
              }
              style={{ width: "100%", margin: "5px 0" }}
            />
            <div style={{ marginTop: "10px" }}>
              <button
                className="next-btn"
                onClick={handleNextTestimonial}
                disabled={isSaving}
              >
                <FiArrowRight /> Next
              </button>
              <button
                className="ok-btn"
                onClick={handleSaveTestimonial}
                disabled={isSaving}
              >
                OK
              </button>
            </div>
          </div>
        )}
        {testimonials.length === 0 && !addingTestimonial && (
          <p>No testimonials added yet.</p>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {testimonials.map((t, i) => (
            <li
              key={`${t.clientName}-${i}`}
              style={{
                marginBottom: "15px",
                padding: "15px",
                border: "1px solid #ddd",
              }}
            >
              <input
                className="editable-item"
                value={t.clientName}
                onChange={(e) =>
                  handleEditTestimonial(i, "clientName", e.target.value)
                }
                placeholder="Client Name"
                style={{ width: "100%", margin: "5px 0" }}
              />
              <textarea
                className="editable-item"
                value={t.comment}
                onChange={(e) =>
                  handleEditTestimonial(i, "comment", e.target.value)
                }
                placeholder="Client Comment"
                style={{ width: "100%", minHeight: "80px", margin: "5px 0" }}
              />
              <input
                className="editable-item"
                value={t.position}
                onChange={(e) =>
                  handleEditTestimonial(i, "position", e.target.value)
                }
                placeholder="Client Position"
                style={{ width: "100%", margin: "5px 0" }}
              />
              <input
                className="editable-item"
                value={t.company}
                onChange={(e) =>
                  handleEditTestimonial(i, "company", e.target.value)
                }
                placeholder="Client Company"
                style={{ width: "100%", margin: "5px 0" }}
              />
              <input
                className="editable-item"
                value={t.profilePicture}
                onChange={(e) =>
                  handleEditTestimonial(i, "profilePicture", e.target.value)
                }
                placeholder="Profile Picture URL"
                style={{ width: "100%", margin: "5px 0" }}
              />
              <FiTrash2
                onClick={() => handleDeleteTestimonial(i)}
                style={{ cursor: "pointer", color: "#ff4444", float: "right" }}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default AdminPage;
