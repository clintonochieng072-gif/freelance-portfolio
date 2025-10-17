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

  // Data states
  const [contacts, setContacts] = useState([]);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [about, setAbout] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

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

  // Preview handler
  const handlePreview = () => {
    const portfolio = {
      username: effectiveUsername,
      displayName,
      occupation,
      about,
      profilePicture,
      resumeUrl,
      contacts: Object.fromEntries(
        contacts.map(({ key, value }) => [key, value])
      ),
      skills,
      projects,
      testimonials,
      introduction:
        displayName && occupation
          ? `Hi, I'm ${displayName} — ${occupation}`
          : "Welcome to my portfolio!",
    };
    localStorage.setItem("previewPortfolio", JSON.stringify(portfolio));
    window.open(`/portfolio/${effectiveUsername}?preview=true`, "_blank");
  };

  // DISPLAY ONLY: Resolve username for UI and socket room
  useEffect(() => {
    const resolveUsername = () => {
      console.log("🔍 Resolving display username...");
      console.log("   - URL param:", urlUsername);
      console.log("   - Context user:", user?.username);

      let usernameToUse = null;

      if (urlUsername && urlUsername !== "undefined") {
        usernameToUse = urlUsername;
        console.log("✅ Using URL param for display:", usernameToUse);
      } else if (user?.username) {
        usernameToUse = user.username;
        console.log("✅ Using context user for display:", usernameToUse);
      }

      console.log("🎯 Display username:", usernameToUse);
      setEffectiveUsername(usernameToUse);
    };

    resolveUsername();
  }, [urlUsername, user]);

  // Fetch portfolio
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        console.log("📡 Loading user portfolio via auth cookie...");

        const res = await fetch(`${API_URL}/portfolio`, {
          credentials: "include",
        });

        console.log("📡 Portfolio fetch status:", res.status);

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
        console.log("✅ Portfolio loaded:", Object.keys(data).length, "items");

        // Process contacts as array
        const contactArray = data.contacts
          ? Object.entries(data.contacts)
              .filter(([key, value]) => value && value.trim() !== "")
              .map(([key, value]) => ({ key, value }))
          : [];

        setContacts(contactArray);
        setSkills(data.skills || []);
        setProjects(data.projects || []);
        setTestimonials(data.testimonials || []);
        setDisplayName(data.displayName || "");
        setOccupation(data.occupation || "");
        setAbout(data.about || "");
        setProfilePicture(data.profilePicture || "");
        setResumeUrl(data.resumeUrl || "");
        setLoading(false);
      } catch (err) {
        console.error("💥 Portfolio fetch error:", err);

        // Fallback: try with username if available
        if (effectiveUsername) {
          try {
            console.log("🔄 Fallback: trying with username...");
            const fallbackRes = await fetch(
              `${API_URL}/portfolio/${effectiveUsername}`,
              {
                credentials: "include",
              }
            );
            if (fallbackRes.ok) {
              const data = await fallbackRes.json();
              const contactArray = data.contacts
                ? Object.entries(data.contacts)
                    .filter(([key, value]) => value && value.trim() !== "")
                    .map(([key, value]) => ({ key, value }))
                : [];
              setContacts(contactArray);
              setSkills(data.skills || []);
              setProjects(data.projects || []);
              setTestimonials(data.testimonials || []);
              setDisplayName(data.displayName || "");
              setOccupation(data.occupation || "");
              setAbout(data.about || "");
              setProfilePicture(data.profilePicture || "");
              setResumeUrl(data.resumeUrl || "");
              setLoading(false);
              return;
            }
          } catch (fallbackErr) {
            console.error("Fallback fetch failed:", fallbackErr);
          }
        }

        setLoading(false);
        alert("Failed to load portfolio data. Please try refreshing.");
      }
    };

    fetchPortfolio();

    // Socket setup
    if (effectiveUsername) {
      socketRef.current = io(SOCKET_URL, {
        transports: ["websocket"],
        withCredentials: true,
      });
      socketRef.current.emit("joinPortfolioRoom", effectiveUsername);

      socketRef.current.on("portfolioUpdated", ({ portfolio }) => {
        if (portfolio) {
          const contactArray = portfolio.contacts
            ? Object.entries(portfolio.contacts)
                .filter(([key, value]) => value && value.trim() !== "")
                .map(([key, value]) => ({ key, value }))
            : [];
          setContacts(contactArray);
          setSkills(portfolio.skills || []);
          setProjects(portfolio.projects || []);
          setTestimonials(portfolio.testimonials || []);
          setDisplayName(portfolio.displayName || "");
          setOccupation(portfolio.occupation || "");
          setAbout(portfolio.about || "");
          setProfilePicture(portfolio.profilePicture || "");
          setResumeUrl(portfolio.resumeUrl || "");
        }
      });

      return () => socketRef.current?.disconnect();
    }
  }, [effectiveUsername, logout, navigate]);

  // Save portfolio
  const savePortfolio = async (
    updatedContacts,
    updatedSkills,
    updatedProjects,
    updatedTestimonials,
    updatedDisplayName,
    updatedOccupation,
    updatedAbout,
    updatedProfilePicture,
    updatedResumeUrl
  ) => {
    try {
      console.log("💾 Saving portfolio via auth cookie...");

      const contactsObj = {};
      updatedContacts.forEach((c) => {
        if (c.key?.trim() && c.value?.trim()) {
          contactsObj[c.key] = c.value;
        }
      });

      const updateUrl = `${API_URL}/portfolio/update`;
      console.log("📡 Save URL:", updateUrl);
      console.log("🔐 User identified via auth cookie");

      const res = await fetch(updateUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contacts: contactsObj,
          skills: updatedSkills.filter((s) => s?.trim()),
          projects: updatedProjects.map((p) => ({
            name: p.name || "",
            description: p.description || "",
            github: p.github || "",
            liveDemo: p.liveDemo || "",
          })),
          testimonials: updatedTestimonials.map((t) => ({
            clientName: t.clientName || "",
            comment: t.comment || "",
            position: t.position || "",
            company: t.company || "",
            profilePicture: t.profilePicture || "",
          })),
          displayName: updatedDisplayName,
          occupation: updatedOccupation,
          about: updatedAbout,
          profilePicture: updatedProfilePicture,
          resumeUrl: updatedResumeUrl,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: `HTTP ${res.status}` };
      }

      console.log("📤 Save response:", { status: res.status, data });

      if (res.ok) {
        setSaveStatus("Saved ✓");
        setTimeout(() => setSaveStatus(""), 2000);

        socketRef.current?.emit("portfolioUpdated", {
          username: effectiveUsername,
          portfolio: {
            contacts: contactsObj,
            skills: updatedSkills.filter((s) => s?.trim()),
            projects: updatedProjects,
            testimonials: updatedTestimonials,
            displayName: updatedDisplayName,
            occupation: updatedOccupation,
            about: updatedAbout,
            profilePicture: updatedProfilePicture,
            resumeUrl: updatedResumeUrl,
          },
        });
      } else {
        if (res.status === 401) {
          console.log("🚫 Save 401 - unauthorized");
          logout();
          navigate("/login");
          return;
        }
        console.error("Save failed:", data);
        alert(`Update failed: ${data.error || `HTTP ${res.status}`}`);
      }
    } catch (err) {
      console.error("💥 Save error:", err);
      alert(`Save failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <div>Loading portfolio...</div>
      </div>
    );
  }

  // Contact handlers
  const handleAddContact = () => setAddingContact(true);
  const handleContactChange = (field, value) =>
    setNewContact((prev) => ({ ...prev, [field]: value }));

  const handleNextContact = () => {
    if (!newContact.key?.trim() || !newContact.value?.trim()) return;
    const updated = [...contacts, { ...newContact }];
    setContacts(updated);
    setNewContact({ key: "", value: "" });
    savePortfolio(
      updated,
      skills,
      projects,
      testimonials,
      displayName,
      occupation,
      about,
      profilePicture,
      resumeUrl
    );
  };

  const handleSaveContact = () => {
    handleNextContact();
    setAddingContact(false);
  };

  const handleEditContact = (index, field, value) => {
    const updated = [...contacts];
    updated[index][field] = value;
    setContacts(updated);
    savePortfolio(
      updated,
      skills,
      projects,
      testimonials,
      displayName,
      occupation,
      about,
      profilePicture,
      resumeUrl
    );
  };

  const handleDeleteContact = (index) => {
    const updated = contacts.filter((_, i) => i !== index);
    setContacts(updated);
    savePortfolio(
      updated,
      skills,
      projects,
      testimonials,
      displayName,
      occupation,
      about,
      profilePicture,
      resumeUrl
    );
  };

  // Skills handlers
  const handleAddSkill = () => setAddingSkill(true);
  const handleNextSkill = () => {
    if (!newSkill?.trim()) return;
    const updated = [...skills, newSkill];
    setSkills(updated);
    setNewSkill("");
    savePortfolio(
      contacts,
      updated,
      projects,
      testimonials,
      displayName,
      occupation,
      about,
      profilePicture,
      resumeUrl
    );
  };

  const handleSaveSkill = () => {
    handleNextSkill();
    setAddingSkill(false);
  };

  const handleEditSkill = (index, value) => {
    const updated = [...skills];
    updated[index] = value;
    setSkills(updated);
    savePortfolio(
      contacts,
      updated,
      projects,
      testimonials,
      displayName,
      occupation,
      about,
      profilePicture,
      resumeUrl
    );
  };

  const handleDeleteSkill = (index) => {
    const updated = skills.filter((_, i) => i !== index);
    setSkills(updated);
    savePortfolio(
      contacts,
      updated,
      projects,
      testimonials,
      displayName,
      occupation,
      about,
      profilePicture,
      resumeUrl
    );
  };

  // Projects handlers
  const handleAddProject = () => setAddingProject(true);
  const handleNextProject = () => {
    const updated = [...projects, { ...newProject }];
    setProjects(updated);
    setNewProject({ name: "", description: "", github: "", liveDemo: "" });
    savePortfolio(
      contacts,
      skills,
      updated,
      testimonials,
      displayName,
      occupation,
      about,
      profilePicture,
      resumeUrl
    );
  };

  const handleSaveProject = () => {
    handleNextProject();
    setAddingProject(false);
  };

  const handleEditProject = (index, field, value) => {
    const updated = [...projects];
    updated[index][field] = value;
    setProjects(updated);
    savePortfolio(
      contacts,
      skills,
      updated,
      testimonials,
      displayName,
      occupation,
      about,
      profilePicture,
      resumeUrl
    );
  };

  const handleDeleteProject = (index) => {
    const updated = projects.filter((_, i) => i !== index);
    setProjects(updated);
    savePortfolio(
      contacts,
      skills,
      updated,
      testimonials,
      displayName,
      occupation,
      about,
      profilePicture,
      resumeUrl
    );
  };

  // Testimonials handlers
  const handleAddTestimonial = () => setAddingTestimonial(true);
  const handleNextTestimonial = () => {
    const updated = [...testimonials, { ...newTestimonial }];
    setTestimonials(updated);
    setNewTestimonial({
      clientName: "",
      comment: "",
      position: "",
      company: "",
      profilePicture: "",
    });
    savePortfolio(
      contacts,
      skills,
      projects,
      updated,
      displayName,
      occupation,
      about,
      profilePicture,
      resumeUrl
    );
  };

  const handleSaveTestimonial = () => {
    handleNextTestimonial();
    setAddingTestimonial(false);
  };

  const handleEditTestimonial = (index, field, value) => {
    const updated = [...testimonials];
    updated[index][field] = value;
    setTestimonials(updated);
    savePortfolio(
      contacts,
      skills,
      projects,
      updated,
      displayName,
      occupation,
      about,
      profilePicture,
      resumeUrl
    );
  };

  const handleDeleteTestimonial = (index) => {
    const updated = testimonials.filter((_, i) => i !== index);
    setTestimonials(updated);
    savePortfolio(
      contacts,
      skills,
      projects,
      updated,
      displayName,
      occupation,
      about,
      profilePicture,
      resumeUrl
    );
  };

  // Profile handlers
  const handleProfileChange = (field, value) => {
    switch (field) {
      case "displayName":
        setDisplayName(value);
        break;
      case "occupation":
        setOccupation(value);
        break;
      case "about":
        setAbout(value);
        break;
      case "profilePicture":
        setProfilePicture(value);
        break;
      case "resumeUrl":
        setResumeUrl(value);
        break;
      default:
        break;
    }
    savePortfolio(
      contacts,
      skills,
      projects,
      testimonials,
      field === "displayName" ? value : displayName,
      field === "occupation" ? value : occupation,
      field === "about" ? value : about,
      field === "profilePicture" ? value : profilePicture,
      field === "resumeUrl" ? value : resumeUrl
    );
  };

  // Skills grid layout
  const skillColumns = [[], []];
  skills.forEach((s, i) => {
    const colIndex = Math.floor((i % 16) / 8);
    skillColumns[colIndex].push({ value: s, index: i });
  });

  return (
    <div className="admin-container">
      <h1>
        Admin Page {effectiveUsername ? `- ${effectiveUsername}` : ""}
        {saveStatus && (
          <span style={{ color: "green", marginLeft: "10px" }}>
            ✓ {saveStatus}
          </span>
        )}
      </h1>
      <button
        onClick={handlePreview}
        className="save-btn"
        style={{ marginBottom: "20px" }}
      >
        Preview Portfolio
      </button>

      {/* Profile Section */}
      <section>
        <h2>Profile</h2>
        <IntroductionSection
          isAdmin={true}
          portfolio={{
            displayName,
            occupation,
            introduction:
              displayName && occupation
                ? `Hi, I'm ${displayName} — ${occupation}`
                : "Welcome to my portfolio!",
          }}
          onChange={handleProfileChange}
        />
        <ProfilePictureSection
          isAdmin={true}
          portfolio={{ profilePicture }}
          onChange={handleProfileChange}
        />
        <AboutSection
          isAdmin={true}
          portfolio={{ about }}
          onChange={handleProfileChange}
        />
        <ResumeSection
          isAdmin={true}
          portfolio={{ resumeUrl }}
          onChange={handleProfileChange}
        />
      </section>

      {/* Contacts Section */}
      <section>
        <h2>
          Contacts{" "}
          <button className="add-btn" onClick={handleAddContact}>
            ADD
          </button>
        </h2>
        {addingContact && (
          <div
            style={{
              marginBottom: "10px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Field name (e.g., Email, Phone)"
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
            <button className="next-btn" onClick={handleNextContact}>
              <FiArrowRight /> Next
            </button>
            <button className="ok-btn" onClick={handleSaveContact}>
              OK
            </button>
          </div>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {contacts.map((c, i) => (
            <li
              key={i}
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
                value={c.key}
                onChange={(e) => handleEditContact(i, "key", e.target.value)}
                placeholder="Field name"
                style={{ flex: "1", minWidth: "150px" }}
              />
              <input
                className="editable-item"
                value={c.value}
                onChange={(e) => handleEditContact(i, "value", e.target.value)}
                placeholder="Value"
                style={{ flex: "2", minWidth: "200px" }}
              />
              <FiTrash2
                onClick={() => handleDeleteContact(i)}
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
          Skills{" "}
          <button className="add-btn" onClick={handleAddSkill}>
            ADD
          </button>
        </h2>
        {addingSkill && (
          <div
            style={{
              marginBottom: "10px",
              display: "flex",
              gap: "10px",
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
            <button className="next-btn" onClick={handleNextSkill}>
              <FiArrowRight /> Next
            </button>
            <button className="ok-btn" onClick={handleSaveSkill}>
              OK
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {skillColumns.map((col, cIndex) => (
            <div
              key={cIndex}
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              {col.map((s) => (
                <div
                  key={s.index}
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <input
                    className="editable-item"
                    type="text"
                    value={s.value}
                    onChange={(e) => handleEditSkill(s.index, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <FiTrash2
                    onClick={() => handleDeleteSkill(s.index)}
                    style={{ cursor: "pointer", color: "#ff4444" }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Projects Section */}
      <section>
        <h2>
          Projects{" "}
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
              type="text"
              placeholder="GitHub Link"
              value={newProject.github}
              onChange={(e) =>
                setNewProject({ ...newProject, github: e.target.value })
              }
            />
            <input
              className="editable-item"
              type="text"
              placeholder="Live Demo Link"
              value={newProject.liveDemo}
              onChange={(e) =>
                setNewProject({ ...newProject, liveDemo: e.target.value })
              }
            />
            <div style={{ marginTop: "10px" }}>
              <button className="next-btn" onClick={handleNextProject}>
                <FiArrowRight /> Next
              </button>
              <button className="ok-btn" onClick={handleSaveProject}>
                OK
              </button>
            </div>
          </div>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {projects.map((p, i) => (
            <li
              key={i}
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
              />
              <input
                className="editable-item"
                value={p.liveDemo}
                onChange={(e) =>
                  handleEditProject(i, "liveDemo", e.target.value)
                }
                placeholder="Live Demo Link"
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
          Testimonials{" "}
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
            />
            <input
              className="editable-item"
              type="text"
              placeholder="Profile Picture URL"
              value={newTestimonial.profilePicture}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  profilePicture: e.target.value,
                })
              }
            />
            <div style={{ marginTop: "10px" }}>
              <button className="next-btn" onClick={handleNextTestimonial}>
                <FiArrowRight /> Next
              </button>
              <button className="ok-btn" onClick={handleSaveTestimonial}>
                OK
              </button>
            </div>
          </div>
        )}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {testimonials.map((t, i) => (
            <li
              key={i}
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
              />
              <input
                className="editable-item"
                value={t.company}
                onChange={(e) =>
                  handleEditTestimonial(i, "company", e.target.value)
                }
                placeholder="Client Company"
              />
              <input
                className="editable-item"
                value={t.profilePicture}
                onChange={(e) =>
                  handleEditTestimonial(i, "profilePicture", e.target.value)
                }
                placeholder="Profile Picture URL"
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
