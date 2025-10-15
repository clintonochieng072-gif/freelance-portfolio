// src/components/AdminPage.js
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom"; // ✅ useNavigate for redirects
import { io } from "socket.io-client";
import { FiEdit, FiTrash2, FiArrowRight } from "react-icons/fi";
import { useGlobalContext } from "../context/GlobalContext"; // ✅ For context access
import "./Admin.css";

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  "https://portfolio-backend-clinton.onrender.com";
const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://portfolio-backend-clinton.onrender.com/api";

function AdminPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useGlobalContext(); // ✅ Access context user
  const [contacts, setContacts] = useState([]);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");

  // Add/Edit states
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

  // ✅ ENHANCED: Validate username with fallback from context
  useEffect(() => {
    console.log("🔍 AdminPage - URL username:", username);
    console.log("🔍 AdminPage - Context user:", user?.username);

    // Fallback to context user if URL param missing
    const effectiveUsername = username || user?.username;

    if (!effectiveUsername) {
      console.error("❌ No username available - redirecting to dashboard");
      navigate("/admin/dashboard");
      return;
    }

    const fetchPortfolio = async () => {
      try {
        console.log("📡 Fetching portfolio for:", effectiveUsername);
        const res = await fetch(`${API_URL}/portfolio/${effectiveUsername}`, {
          credentials: "include", // ✅ Cookie-based auth
        });

        if (!res.ok) {
          if (res.status === 401) {
            console.error("❌ Unauthorized - logging out");
            logout();
            navigate("/login");
            return;
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("📄 Portfolio data loaded:", data);

        const contactArray = data.contacts
          ? Object.entries(data.contacts)
              .filter(([key, value]) => value && value.trim() !== "")
              .map(([key, value]) => ({ key, value }))
          : [];

        setContacts(contactArray);
        setSkills(data.skills || []);
        setProjects(data.projects || []);
        setTestimonials(data.testimonials || []);
      } catch (err) {
        console.error("❌ Error fetching portfolio:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();

    // Socket setup with error handling
    try {
      socketRef.current = io(SOCKET_URL, {
        transports: ["websocket"],
        withCredentials: true,
      });
      socketRef.current.emit("joinPortfolioRoom", effectiveUsername);

      socketRef.current.on(
        "portfolioUpdated",
        ({ contacts, skills, projects, testimonials }) => {
          console.log("🔄 Real-time portfolio update received");
          if (contacts) {
            const contactArray = Object.entries(contacts)
              .filter(([key, value]) => value && value.trim() !== "")
              .map(([key, value]) => ({ key, value }));
            setContacts(contactArray);
          }
          if (skills) setSkills(skills);
          if (projects) setProjects(projects);
          if (testimonials) setTestimonials(testimonials);
        }
      );
    } catch (socketErr) {
      console.error("❌ Socket connection failed:", socketErr);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [username, user?.username, navigate, logout]);

  // ✅ ENHANCED: Robust save function with JSON parsing safety
  const savePortfolio = async (
    updatedContacts,
    updatedSkills,
    updatedProjects,
    updatedTestimonials
  ) => {
    const effectiveUsername = username || user?.username;

    if (!effectiveUsername) {
      console.error("❌ Cannot save - no username available");
      alert(
        "Error: Cannot save without username. Please refresh and try again."
      );
      return;
    }

    try {
      console.log("💾 Saving portfolio for:", effectiveUsername);

      const contactsObj = {};
      updatedContacts.forEach((c) => {
        if (c.key?.trim() && c.value?.trim()) {
          contactsObj[c.key] = c.value;
        }
      });

      const updateUrl = `${API_URL}/portfolio/update/${effectiveUsername}`;
      console.log("📡 Save URL:", updateUrl);

      const res = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ Cookie-based auth
        body: JSON.stringify({
          contacts: contactsObj,
          skills: updatedSkills.filter((s) => s && s.trim() !== ""),
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
        }),
      });

      console.log("📡 Response status:", res.status, res.statusText);

      // ✅ SAFE JSON parsing
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error("❌ JSON parse error:", jsonErr);
        data = { error: `HTTP ${res.status}: Invalid response format` };
      }

      console.log("📤 Save response:", data);

      if (res.ok) {
        setSaveStatus("Saved ✓");
        setTimeout(() => setSaveStatus(""), 2000);

        if (socketRef.current) {
          socketRef.current.emit("portfolioUpdated", {
            username: effectiveUsername,
            contacts: contactsObj,
            skills: updatedSkills.filter((s) => s && s.trim() !== ""),
            projects: updatedProjects,
            testimonials: updatedTestimonials,
          });
        }
      } else {
        if (res.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        console.error("❌ Save failed:", data);
        alert(`Update failed: ${data.error || `HTTP ${res.status}`}`);
      }
    } catch (err) {
      console.error("💥 Save error:", err);
      if (err.name === "AbortError") {
        alert("Request timeout - please try again");
      } else {
        alert(`Update failed: ${err.message}`);
      }
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Loading Admin Page...
      </div>
    );
  if (!username && !user?.username) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Error: No username available. Redirecting...
      </div>
    );
  }

  // ===== CONTACTS HANDLERS =====
  const handleAddContact = () => setAddingContact(true);
  const handleContactChange = (field, value) =>
    setNewContact({ ...newContact, [field]: value });
  const handleNextContact = () => {
    if (newContact.key.trim() === "" || newContact.value.trim() === "") return;
    const updated = [...contacts, { ...newContact }];
    setContacts(updated);
    setNewContact({ key: "", value: "" });
    savePortfolio(updated, skills, projects, testimonials);
  };
  const handleSaveContact = () => {
    if (newContact.key.trim() === "" || newContact.value.trim() === "") return;
    handleNextContact();
    setAddingContact(false);
  };
  const handleEditContact = (index, field, value) => {
    const updated = [...contacts];
    updated[index][field] = value;
    setContacts(updated);
    savePortfolio(updated, skills, projects, testimonials);
  };
  const handleDeleteContact = (index) => {
    const updated = contacts.filter((_, i) => i !== index);
    setContacts(updated);
    savePortfolio(updated, skills, projects, testimonials);
  };

  // ===== SKILLS HANDLERS =====
  const handleAddSkill = () => setAddingSkill(true);
  const handleNextSkill = () => {
    if (!newSkill.trim()) return;
    const updated = [...skills, newSkill];
    setSkills(updated);
    setNewSkill("");
    savePortfolio(contacts, updated, projects, testimonials);
  };
  const handleSaveSkill = () => {
    if (!newSkill.trim()) return;
    handleNextSkill();
    setAddingSkill(false);
  };
  const handleEditSkill = (index, value) => {
    const updated = [...skills];
    updated[index] = value;
    setSkills(updated);
    savePortfolio(contacts, updated, projects, testimonials);
  };
  const handleDeleteSkill = (index) => {
    const updated = skills.filter((_, i) => i !== index);
    setSkills(updated);
    savePortfolio(contacts, updated, projects, testimonials);
  };

  // ===== PROJECTS HANDLERS =====
  const handleAddProject = () => setAddingProject(true);
  const handleNextProject = () => {
    const updated = [...projects, { ...newProject }];
    setProjects(updated);
    setNewProject({ name: "", description: "", github: "", liveDemo: "" });
    savePortfolio(contacts, skills, updated, testimonials);
  };
  const handleSaveProject = () => {
    handleNextProject();
    setAddingProject(false);
  };
  const handleEditProject = (index, field, value) => {
    const updated = [...projects];
    updated[index][field] = value;
    setProjects(updated);
    savePortfolio(contacts, skills, updated, testimonials);
  };
  const handleDeleteProject = (index) => {
    const updated = projects.filter((_, i) => i !== index);
    setProjects(updated);
    savePortfolio(contacts, skills, updated, testimonials);
  };

  // ===== TESTIMONIALS HANDLERS =====
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
    savePortfolio(contacts, skills, projects, updated);
  };
  const handleSaveTestimonial = () => {
    handleNextTestimonial();
    setAddingTestimonial(false);
  };
  const handleEditTestimonial = (index, field, value) => {
    const updated = [...testimonials];
    updated[index][field] = value;
    setTestimonials(updated);
    savePortfolio(contacts, skills, projects, updated);
  };
  const handleDeleteTestimonial = (index) => {
    const updated = testimonials.filter((_, i) => i !== index);
    setTestimonials(updated);
    savePortfolio(contacts, skills, projects, updated);
  };

  // ===== SKILLS GRID LAYOUT =====
  const skillColumns = [[], []];
  skills.forEach((s, i) => {
    const colIndex = Math.floor((i % 16) / 8);
    skillColumns[colIndex].push({ value: s, index: i });
  });

  return (
    <div className="admin-container">
      <h1>
        Admin Page - {username || user?.username}
        {saveStatus && (
          <span style={{ color: "green", marginLeft: "10px" }}>
            ✓ {saveStatus}
          </span>
        )}
      </h1>

      {/* ===== CONTACTS SECTION ===== */}
      <section>
        <h2>
          Contacts{" "}
          <button className="add-btn" onClick={handleAddContact}>
            ADD
          </button>
        </h2>
        {addingContact && (
          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Field name (e.g., Email, Phone)"
              value={newContact.key}
              onChange={(e) => handleContactChange("key", e.target.value)}
            />
            <input
              type="text"
              placeholder="Value"
              value={newContact.value}
              onChange={(e) => handleContactChange("value", e.target.value)}
            />
            <button onClick={handleNextContact}>
              <FiArrowRight /> Next
            </button>
            <button onClick={handleSaveContact}>OK</button>
          </div>
        )}
        <ul>
          {contacts.map((c, i) => (
            <li key={i}>
              <input
                type="text"
                value={c.key}
                onChange={(e) => handleEditContact(i, "key", e.target.value)}
                placeholder="Field name"
              />
              <input
                type="text"
                value={c.value}
                onChange={(e) => handleEditContact(i, "value", e.target.value)}
                placeholder="Value"
              />
              <FiEdit style={{ cursor: "pointer", marginLeft: "5px" }} />
              <FiTrash2
                onClick={() => handleDeleteContact(i)}
                style={{ cursor: "pointer", marginLeft: "5px" }}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* ===== SKILLS SECTION ===== */}
      <section>
        <h2>
          Skills{" "}
          <button className="add-btn" onClick={handleAddSkill}>
            ADD
          </button>
        </h2>
        {addingSkill && (
          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
            />
            <button onClick={handleNextSkill}>
              <FiArrowRight /> Next
            </button>
            <button onClick={handleSaveSkill}>OK</button>
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
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <input
                    type="text"
                    value={s.value}
                    onChange={(e) => handleEditSkill(s.index, e.target.value)}
                  />
                  <FiEdit style={{ cursor: "pointer", marginLeft: "5px" }} />
                  <FiTrash2
                    onClick={() => handleDeleteSkill(s.index)}
                    style={{ cursor: "pointer", marginLeft: "5px" }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ===== PROJECTS SECTION ===== */}
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
              type="text"
              placeholder="Project Name (optional)"
              value={newProject.name}
              onChange={(e) =>
                setNewProject({ ...newProject, name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newProject.description}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="GitHub Link (optional)"
              value={newProject.github}
              onChange={(e) =>
                setNewProject({ ...newProject, github: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Live Demo Link (optional)"
              value={newProject.liveDemo}
              onChange={(e) =>
                setNewProject({ ...newProject, liveDemo: e.target.value })
              }
            />
            <button onClick={handleNextProject}>
              <FiArrowRight /> Next
            </button>
            <button onClick={handleSaveProject}>OK</button>
          </div>
        )}
        <ul>
          {projects.map((p, i) => (
            <li key={i}>
              <input
                type="text"
                value={p.name}
                onChange={(e) => handleEditProject(i, "name", e.target.value)}
                placeholder="Project Name"
              />
              <input
                type="text"
                value={p.description}
                onChange={(e) =>
                  handleEditProject(i, "description", e.target.value)
                }
                placeholder="Description"
              />
              <input
                type="text"
                value={p.github}
                onChange={(e) => handleEditProject(i, "github", e.target.value)}
                placeholder="GitHub Link"
              />
              <input
                type="text"
                value={p.liveDemo}
                onChange={(e) =>
                  handleEditProject(i, "liveDemo", e.target.value)
                }
                placeholder="Live Demo Link"
              />
              <FiEdit style={{ cursor: "pointer", marginLeft: "5px" }} />
              <FiTrash2
                onClick={() => handleDeleteProject(i)}
                style={{ cursor: "pointer", marginLeft: "5px" }}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* ===== TESTIMONIALS SECTION ===== */}
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
              type="text"
              placeholder="Client Name (optional)"
              value={newTestimonial.clientName}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  clientName: e.target.value,
                })
              }
            />
            <textarea
              placeholder="Client Comment (optional)"
              value={newTestimonial.comment}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  comment: e.target.value,
                })
              }
              style={{ width: "100%", minHeight: "60px" }}
            />
            <input
              type="text"
              placeholder="Client Position (optional)"
              value={newTestimonial.position}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  position: e.target.value,
                })
              }
            />
            <input
              type="text"
              placeholder="Client Company (optional)"
              value={newTestimonial.company}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  company: e.target.value,
                })
              }
            />
            <input
              type="text"
              placeholder="Profile Picture URL (optional)"
              value={newTestimonial.profilePicture}
              onChange={(e) =>
                setNewTestimonial({
                  ...newTestimonial,
                  profilePicture: e.target.value,
                })
              }
            />
            <button onClick={handleNextTestimonial}>
              <FiArrowRight /> Next
            </button>
            <button onClick={handleSaveTestimonial}>OK</button>
          </div>
        )}
        <ul>
          {testimonials.map((t, i) => (
            <li
              key={i}
              style={{
                marginBottom: "15px",
                padding: "10px",
                border: "1px solid #ddd",
              }}
            >
              <input
                type="text"
                value={t.clientName}
                onChange={(e) =>
                  handleEditTestimonial(i, "clientName", e.target.value)
                }
                placeholder="Client Name"
              />
              <textarea
                value={t.comment}
                onChange={(e) =>
                  handleEditTestimonial(i, "comment", e.target.value)
                }
                placeholder="Client Comment"
                style={{ width: "100%", minHeight: "60px" }}
              />
              <input
                type="text"
                value={t.position}
                onChange={(e) =>
                  handleEditTestimonial(i, "position", e.target.value)
                }
                placeholder="Client Position"
              />
              <input
                type="text"
                value={t.company}
                onChange={(e) =>
                  handleEditTestimonial(i, "company", e.target.value)
                }
                placeholder="Client Company"
              />
              <input
                type="text"
                value={t.profilePicture}
                onChange={(e) =>
                  handleEditTestimonial(i, "profilePicture", e.target.value)
                }
                placeholder="Profile Picture URL"
              />
              <FiEdit style={{ cursor: "pointer", marginLeft: "5px" }} />
              <FiTrash2
                onClick={() => handleDeleteTestimonial(i)}
                style={{ cursor: "pointer", marginLeft: "5px" }}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default AdminPage;
