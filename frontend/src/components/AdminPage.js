// src/components/AdminPage.js
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Cookies from "js-cookie";
import { FiEdit, FiTrash2, FiArrowRight } from "react-icons/fi";
import "./Admin.css";

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  "https://portfolio-backend-clinton.onrender.com";
const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://portfolio-backend-clinton.onrender.com/api";

function AdminPage({ username }) {
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

  // ✅ UPDATE Testimonials state with profile picture
  const [newTestimonial, setNewTestimonial] = useState({
    clientName: "",
    comment: "",
    position: "",
    company: "",
    profilePicture: "", // ✅ ADD profile picture
  });
  const [addingTestimonial, setAddingTestimonial] = useState(false);

  const socketRef = useRef(null);

  // Fetch portfolio and subscribe to socket updates
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch(`${API_URL}/portfolio/${username}`);
        const data = await res.json();

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
        console.error("Error fetching portfolio:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();

    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });
    socketRef.current.emit("joinPortfolioRoom", username);

    socketRef.current.on(
      "portfolioUpdated",
      ({ contacts, skills, projects, testimonials }) => {
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

    return () => socketRef.current.disconnect();
  }, [username]);

  // Save portfolio function
  const savePortfolio = async (
    updatedContacts,
    updatedSkills,
    updatedProjects,
    updatedTestimonials
  ) => {
    try {
      const token = Cookies.get("token");
      const contactsObj = {};
      updatedContacts.forEach((c) => {
        if (c.key && c.key.trim() !== "" && c.value && c.value.trim() !== "") {
          contactsObj[c.key] = c.value;
        }
      });

      const res = await fetch(`${API_URL}/portfolio/update/${username}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contacts: contactsObj,
          skills: updatedSkills.filter((s) => s && s.trim() !== ""),
          projects: updatedProjects.map((p) => ({
            name: p.name || "",
            description: p.description || "",
            github: p.github || "",
            liveDemo: p.liveDemo || "",
          })),
          // ✅ UPDATE Testimonials with profile picture
          testimonials: updatedTestimonials.map((t) => ({
            clientName: t.clientName || "",
            comment: t.comment || "",
            position: t.position || "",
            company: t.company || "",
            profilePicture: t.profilePicture || "",
          })),
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        setSaveStatus("Saved");
        setTimeout(() => setSaveStatus(""), 2000);

        socketRef.current.emit("portfolioUpdated", {
          username,
          contacts: contactsObj,
          skills: updatedSkills.filter((s) => s && s.trim() !== ""),
          projects: updatedProjects,
          testimonials: updatedTestimonials,
        });
      } else {
        alert("Update failed: " + data.error);
      }
    } catch (err) {
      console.error("Error saving portfolio:", err);
      alert("Update failed: " + err.message);
    }
  };

  if (loading) return <p>Loading Admin Page...</p>;

  // ===== CONTACTS =====
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

  // ===== SKILLS =====
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

  // ===== PROJECTS =====
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

  // ===== TESTIMONIALS =====
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

  // ===== SKILLS GRID =====
  const skillColumns = [[], []];
  skills.forEach((s, i) => {
    const colIndex = Math.floor((i % 16) / 8);
    skillColumns[colIndex].push({ value: s, index: i });
  });

  return (
    <div className="admin-container">
      <h1>
        Admin Page - {username}
        {saveStatus && (
          <span style={{ color: "green", marginLeft: "10px" }}>
            ✓ {saveStatus}
          </span>
        )}
      </h1>

      {/* ===== CONTACTS ===== */}
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

      {/* ===== SKILLS ===== */}
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

      {/* ===== PROJECTS ===== */}
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

      {/* ===== TESTIMONIALS ===== */}
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
            {/* ✅ ADD Profile Picture Input */}
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
              {/* ✅ ADD Profile Picture Edit */}
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
