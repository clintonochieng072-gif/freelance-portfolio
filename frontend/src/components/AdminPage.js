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

// Payment notice component
const PaymentNotice = ({ onClose }) => {
  const handlePayNow = () => {
    // Fixed: Changed from "Buy Goods & Services" to "Send Money" instructions
    // This corrects the M-Pesa payment flow for sending money to a phone number
    alert(
      `M-Pesa Payment Instructions:\n\n1. Open M-Pesa on your phone\n2. Tap "Send Money"\n3. Enter Payee Number: 254745408764\n4. Enter Amount: 999\n5. Enter your M-Pesa PIN and send\n\nAfter sending, contact the admin via WhatsApp or Call to confirm payment.`
    );
  };

  const handleCallAdmin = () => {
    window.location.href = "tel:+254745408764";
  };

  const handleMessageAdmin = () => {
    const message = encodeURIComponent(
      "Hello, I've just sent my subscription payment. Kindly activate my account."
    );
    window.open(`https://wa.me/254745408764?text=${message}`, "_blank");
  };

  return (
    <div className="payment-notice">
      <div className="payment-notice-content">
        <h2>Editing Trial Ended</h2>
        <p>
          Your editing trial has ended. To unlock full editing access, please
          pay a one-time subscription fee of <strong>KES 999</strong>.
        </p>
        <p>
          Send KES 999 via M-Pesa to <strong>254745408764</strong>.
        </p>
        <p>After payment, contact admin to activate your account manually.</p>
        <div className="payment-buttons">
          <button className="payment-btn" onClick={handlePayNow}>
            Pay Now
          </button>
          <button className="payment-btn call-admin" onClick={handleCallAdmin}>
            Call Admin
          </button>
          <button
            className="payment-btn message-admin"
            onClick={handleMessageAdmin}
          >
            Message Admin
          </button>
        </div>
      </div>
    </div>
  );
};

// Admin mini panel component
const AdminMiniPanel = () => {
  const [searchEmail, setSearchEmail] = useState("");
  const [searchedUser, setSearchedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/admin/search-user?email=${encodeURIComponent(searchEmail)}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchedUser(data.user);
      } else {
        alert("User not found or access denied");
        setSearchedUser(null);
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Error searching user");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!searchedUser) return;

    setConfirming(true);
    try {
      const response = await fetch(
        `${API_URL}/admin/confirm-payment/${searchedUser.id}`,
        {
          method: "PUT",
          credentials: "include",
        }
      );

      if (response.ok) {
        alert("Payment confirmed successfully!");
        setSearchedUser({ ...searchedUser, has_paid: true });
      } else {
        alert("Error confirming payment");
      }
    } catch (error) {
      console.error("Confirm error:", error);
      alert("Error confirming payment");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="admin-panel">
      <h3>Admin Panel - User Payment Confirmation</h3>
      <div className="admin-search">
        <input
          type="email"
          placeholder="Enter user email to search"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {searchedUser && (
        <div className="user-card">
          <h4>{searchedUser.name}</h4>
          <p>
            <strong>Email:</strong> {searchedUser.email}
          </p>
          <p>
            <strong>Has Paid:</strong> {searchedUser.has_paid ? "Yes" : "No"}
          </p>
          <p>
            <strong>First Login:</strong>{" "}
            {searchedUser.is_first_login ? "Yes" : "No"}
          </p>
          <p>
            <strong>Created:</strong>{" "}
            {new Date(searchedUser.createdAt).toLocaleDateString()}
          </p>
          {!searchedUser.has_paid && (
            <button
              className="confirm-btn"
              onClick={handleConfirmPayment}
              disabled={confirming}
            >
              {confirming ? "Confirming..." : "Confirm User"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;
const API_URL = process.env.REACT_APP_API_URL;

function AdminPage() {
  const { username: urlUsername } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useGlobalContext();
  const [effectiveUsername, setEffectiveUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Payment and trial states
  const [showPaymentNotice, setShowPaymentNotice] = useState(false);
  const [trialTimeLeft, setTrialTimeLeft] = useState(30);
  const [trialActive, setTrialActive] = useState(false);
  const [editingLocked, setEditingLocked] = useState(false);
  const trialTimerRef = useRef(null);

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

  // Initialize trial and payment logic
  useEffect(() => {
    if (user) {
      // Check if user is first-time login and hasn't paid
      const isFirstTimeUser = user.is_first_login && !user.has_paid;

      if (isFirstTimeUser) {
        // Start 30-second trial
        setTrialActive(true);
        setTrialTimeLeft(30);

        trialTimerRef.current = setInterval(() => {
          setTrialTimeLeft((prev) => {
            if (prev <= 1) {
              // Trial ended
              setTrialActive(false);
              setEditingLocked(true);
              setShowPaymentNotice(true);
              clearInterval(trialTimerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (!user.has_paid) {
        // User has logged in before but hasn't paid - lock editing immediately
        setEditingLocked(true);
        setShowPaymentNotice(true);
      }
      // If user has paid, no restrictions
    }

    return () => {
      if (trialTimerRef.current) {
        clearInterval(trialTimerRef.current);
      }
    };
  }, [user]);

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
        setContacts({ ...data.contacts } || {});
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
          setContacts({ ...portfolio.contacts } || {});
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
          setResumeFile(null); // Ensure resumeFile is cleared on update
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
    } else {
      setError("No file selected");
    }
  };

  // Handle resume deletion
  const handleDeleteResume = async () => {
    console.log("🗑️ Deleting resume");
    if (window.confirm("Are you sure you want to delete the resume?")) {
      // Store current state before clearing
      const currentContacts = contacts;
      const currentSkills = skills.filter((s) => s?.trim());
      const currentProjects = projects;
      const currentTestimonials = testimonials;

      // Clear both file and URL immediately
      setResumeFile(null);
      setResumeUrl("");

      // Force a save with empty resume data using direct fetch
      try {
        const tempFormData = new FormData();
        tempFormData.append("contacts", JSON.stringify(currentContacts));
        tempFormData.append("skills", JSON.stringify(currentSkills));
        tempFormData.append("projects", JSON.stringify(currentProjects));
        tempFormData.append(
          "testimonials",
          JSON.stringify(currentTestimonials)
        );
        tempFormData.append("displayName", displayName || "");
        tempFormData.append("title", title || "");
        tempFormData.append("bio", bio || "");
        tempFormData.append("theme", theme);
        tempFormData.append("isPublished", isPublished);

        // CRITICAL: Force empty resume URL
        tempFormData.append("resumeUrl", "");

        console.log("🗑️ Sending DELETE request with empty resumeUrl");

        const res = await fetch(`${API_URL}/portfolio/update`, {
          method: "PUT",
          credentials: "include",
          body: tempFormData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `HTTP ${res.status}`);
        }

        // FIXED VERSION - remove the unused 'data' variable
        await res.json(); // Just await the response without storing it
        console.log("✅ Resume deleted and portfolio saved");
      } catch (err) {
        console.error("❌ Error deleting resume:", err);
        setError("Failed to delete resume. Please try again.");
      }
    }
  };

  // Save portfolio
  // Modified to accept optional parameters for immediate saving without waiting for state updates
  // This fixes the issue where pressing OK directly after typing data would not save due to async state updates
  const savePortfolio = async (overrideData = {}) => {
    try {
      setIsSaving(true);
      setSaveStatus("Saving...");
      setError("");
      const formData = new FormData();

      // Use override data if provided, otherwise use current state
      const dataToSave = {
        contacts: overrideData.contacts || contacts,
        skills: overrideData.skills || skills.filter((s) => s?.trim()),
        projects: overrideData.projects || projects,
        testimonials: overrideData.testimonials || testimonials,
        displayName: overrideData.displayName || displayName || "",
        title: overrideData.title || title || "",
        bio: overrideData.bio || bio || "",
        theme: overrideData.theme || theme,
        isPublished:
          overrideData.isPublished !== undefined
            ? overrideData.isPublished
            : isPublished,
      };

      formData.append("contacts", JSON.stringify(dataToSave.contacts));
      formData.append("skills", JSON.stringify(dataToSave.skills));
      formData.append("projects", JSON.stringify(dataToSave.projects));
      formData.append("testimonials", JSON.stringify(dataToSave.testimonials));
      formData.append("displayName", dataToSave.displayName);
      formData.append("title", dataToSave.title);
      formData.append("bio", dataToSave.bio);
      formData.append("theme", dataToSave.theme);
      formData.append("isPublished", dataToSave.isPublished);
      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }
      if (resumeFile) {
        formData.append("resumeFile", resumeFile);
      } else {
        formData.append("resumeUrl", resumeUrl || "");
      }

      console.log(
        "📡 Sending portfolio save with contacts:",
        dataToSave.contacts
      );
      console.log("📄 Sending resumeUrl:", resumeUrl);

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
      console.log("✅ Portfolio saved:", data);
      setSaveStatus("Saved ✓");
      setTimeout(() => setSaveStatus(""), 2000);
      setError("");

      setProfilePictureUrl(data.portfolio.profilePicture || profilePictureUrl);
      setProjects(data.portfolio.projects || projects);
      setContacts({ ...data.portfolio.contacts } || {});
      socketRef.current?.emit("portfolioUpdated", {
        username: effectiveUsername,
        portfolio: data.portfolio,
      });

      return data;
    } catch (err) {
      console.error("💥 Save error:", err);
      setError(`Failed to save portfolio: ${err.message}`);
      setSaveStatus("");
      throw err;
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
      console.log("🔄 Adding contact to state:", {
        [newKey]: newContact.value,
      });
      setContacts((prev) => {
        const updated = { ...prev, [newKey]: newContact.value || "" };
        console.log("🔄 Updated contacts state:", updated);
        return updated;
      });
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
      console.log("✅ Saving contact:", { [newKey]: newContact.value });

      // Modified: Save immediately with override data instead of relying on state updates
      // This fixes the issue where pressing OK directly after typing would not save data
      const updatedContacts = { ...contacts, [newKey]: newContact.value || "" };
      try {
        await savePortfolio({ contacts: updatedContacts });
        setContacts(updatedContacts);
        setNewContact({ key: "", value: "" });
        setAddingContact(false);
      } catch (err) {
        console.log("❌ Save failed, keeping form open");
        // Keep form open on error as per requirements
      }
    } else {
      setNewContact({ key: "", value: "" });
      setAddingContact(false);
    }
  };

  const handleEditContact = (key, value) => {
    console.log("✏️ Editing contact:", { [key]: value });
    setContacts((prev) => {
      const updated = { ...prev, [key]: value };
      console.log("✏️ Updated contacts state:", updated);
      return updated;
    });
  };

  const handleDeleteContact = (key) => {
    console.log("🗑️ Deleting contact:", key);
    setContacts((prev) => {
      const updated = { ...prev };
      delete updated[key];
      console.log("🗑️ Updated contacts state:", updated);
      return updated;
    });
  };

  // Skills handlers
  const handleAddSkill = () => setAddingSkill(true);
  const handleNextSkill = () => {
    if (newSkill?.trim()) {
      console.log("🔄 Adding skill:", newSkill);
      setSkills((prev) => {
        const updated = [...prev, newSkill];
        console.log("🔄 Updated skills state:", updated);
        return updated;
      });
      setNewSkill("");
    }
  };

  const handleSaveSkill = async () => {
    if (newSkill?.trim()) {
      console.log("✅ Saving skill:", newSkill);

      // Modified: Save immediately with override data instead of relying on state updates
      // This fixes the issue where pressing OK directly after typing would not save data
      const updatedSkills = [...skills, newSkill];
      try {
        await savePortfolio({ skills: updatedSkills });
        setSkills(updatedSkills);
        setNewSkill("");
        setAddingSkill(false);
      } catch (err) {
        console.log("❌ Save failed, keeping form open");
        // Keep form open on error as per requirements
      }
    } else {
      setNewSkill("");
      setAddingSkill(false);
    }
  };

  const handleEditSkill = (index, value) => {
    console.log("✏️ Editing skill at index", index, ":", value);
    setSkills((prev) => {
      const updated = [...prev];
      updated[index] = value;
      console.log("✏️ Updated skills state:", updated);
      return updated;
    });
  };

  const handleDeleteSkill = (index) => {
    console.log("🗑️ Deleting skill at index:", index);
    setSkills((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      console.log("🗑️ Updated skills state:", updated);
      return updated;
    });
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
      console.log("🔄 Adding project:", newProject);
      setProjects((prev) => {
        const updated = [...prev, newProject];
        console.log("🔄 Updated projects state:", updated);
        return updated;
      });
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
      console.log("✅ Saving project:", newProject);

      // Modified: Save immediately with override data instead of relying on state updates
      // This fixes the issue where pressing OK directly after typing would not save data
      const updatedProjects = [...projects, newProject];
      try {
        await savePortfolio({ projects: updatedProjects });
        setProjects(updatedProjects);
        setNewProject({ name: "", description: "", github: "", liveDemo: "" });
        setAddingProject(false);
      } catch (err) {
        console.log("❌ Save failed, keeping form open");
        // Keep form open on error as per requirements
      }
    } else {
      setNewProject({ name: "", description: "", github: "", liveDemo: "" });
      setAddingProject(false);
    }
  };

  const handleEditProject = (index, field, value) => {
    console.log("✏️ Editing project at index", index, ":", { [field]: value });
    setProjects((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      console.log("✏️ Updated projects state:", updated);
      return updated;
    });
  };

  const handleDeleteProject = (index) => {
    console.log("🗑️ Deleting project at index:", index);
    setProjects((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      console.log("🗑️ Updated projects state:", updated);
      return updated;
    });
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
      console.log("🔄 Adding testimonial:", newTestimonial);
      setTestimonials((prev) => {
        const updated = [...prev, newTestimonial];
        console.log("🔄 Updated testimonials state:", updated);
        return updated;
      });
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
      console.log("✅ Saving testimonial:", newTestimonial);

      // Modified: Save immediately with override data instead of relying on state updates
      // This fixes the issue where pressing OK directly after typing would not save data
      const updatedTestimonials = [...testimonials, newTestimonial];
      try {
        await savePortfolio({ testimonials: updatedTestimonials });
        setTestimonials(updatedTestimonials);
        setNewTestimonial({
          clientName: "",
          comment: "",
          position: "",
          company: "",
          profilePicture: "",
        });
        setAddingTestimonial(false);
      } catch (err) {
        console.log("❌ Save failed, keeping form open");
        // Keep form open on error as per requirements
      }
    } else {
      setNewTestimonial({
        clientName: "",
        comment: "",
        position: "",
        company: "",
        profilePicture: "",
      });
      setAddingTestimonial(false);
    }
  };

  const handleEditTestimonial = (index, field, value) => {
    console.log("✏️ Editing testimonial at index", index, ":", {
      [field]: value,
    });
    setTestimonials((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      console.log("✏️ Updated testimonials state:", updated);
      return updated;
    });
  };

  const handleDeleteTestimonial = (index) => {
    console.log("🗑️ Deleting testimonial at index:", index);
    setTestimonials((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      console.log("🗑️ Updated testimonials state:", updated);
      return updated;
    });
  };

  // Profile handlers for components
  const handleProfileChange = (field, value) => {
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
  };

  // Debug contacts state before rendering
  console.log("🎨 Rendering with contacts:", contacts);

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

  // Check if user is admin
  const isAdmin = user?.email === "clintonochieng072@gmail.com";

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

      {/* Trial Timer */}
      {trialActive && (
        <div className={`trial-timer ${trialTimeLeft <= 10 ? "warning" : ""}`}>
          ⏰ Editing Trial: {trialTimeLeft} seconds remaining
        </div>
      )}

      {/* Payment Notice */}
      {showPaymentNotice && (
        <PaymentNotice onClose={() => setShowPaymentNotice(false)} />
      )}

      {/* Admin Mini Panel - Only for admin */}
      {isAdmin && <AdminMiniPanel />}
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
          disabled={isSaving || editingLocked}
          title={
            editingLocked ? "Editing is locked. Please pay to unlock." : ""
          }
        >
          {isSaving
            ? "Saving..."
            : editingLocked
            ? "Editing Locked"
            : "Save Portfolio"}
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
          onDeleteResume={handleDeleteResume}
        />
        <div>
          <h3>Theme</h3>
          <select
            value={theme}
            onChange={(e) => (editingLocked ? null : setTheme(e.target.value))}
            disabled={editingLocked}
          >
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
              onChange={(e) =>
                editingLocked ? null : setIsPublished(e.target.checked)
              }
              disabled={editingLocked}
            />
            Make Portfolio Public
          </label>
        </div>
      </section>

      {/* Contacts Section */}
      <section>
        <h2>
          Contacts
          <button
            className="add-btn"
            onClick={handleAddContact}
            disabled={editingLocked}
            title={
              editingLocked ? "Editing is locked. Please pay to unlock." : ""
            }
          >
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
        {Object.keys(contacts).length === 0 ? (
          <p>No contacts added yet.</p>
        ) : (
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
                    if (editingLocked) return;
                    const newKey = e.target.value.trim();
                    if (newKey && newKey !== key && !contacts[newKey]) {
                      const updated = { ...contacts };
                      delete updated[key];
                      updated[newKey] = value;
                      console.log("✏️ Renaming contact key:", {
                        [newKey]: value,
                      });
                      setContacts({ ...updated });
                    }
                  }}
                  placeholder="Field name"
                  style={{ flex: "1", minWidth: "150px" }}
                  disabled={editingLocked}
                />
                <input
                  className="editable-item"
                  value={value}
                  onChange={(e) =>
                    editingLocked
                      ? null
                      : handleEditContact(key, e.target.value)
                  }
                  placeholder="Value"
                  style={{ flex: "2", minWidth: "200px" }}
                  disabled={editingLocked}
                />
                <FiTrash2
                  onClick={() =>
                    editingLocked ? null : handleDeleteContact(key)
                  }
                  className={`delete-icon ${editingLocked ? "disabled" : ""}`}
                  style={{
                    cursor: editingLocked ? "not-allowed" : "pointer",
                    opacity: editingLocked ? 0.5 : 1,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Skills Section */}
      <section>
        <h2>
          Skills
          <button
            className="add-btn"
            onClick={handleAddSkill}
            disabled={editingLocked}
            title={
              editingLocked ? "Editing is locked. Please pay to unlock." : ""
            }
          >
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
        {skills.length === 0 ? (
          <p>No skills added yet.</p>
        ) : (
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {skills.map(
              (skill, index) =>
                skill && (
                  <div
                    key={`${skill}-${index}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <input
                      className="editable-item"
                      type="text"
                      value={skill}
                      onChange={(e) =>
                        editingLocked
                          ? null
                          : handleEditSkill(index, e.target.value)
                      }
                      style={{ flex: 1 }}
                      disabled={editingLocked}
                    />
                    <FiTrash2
                      onClick={() =>
                        editingLocked ? null : handleDeleteSkill(index)
                      }
                      className={`delete-icon ${
                        editingLocked ? "disabled" : ""
                      }`}
                      style={{
                        cursor: editingLocked ? "not-allowed" : "pointer",
                        opacity: editingLocked ? 0.5 : 1,
                      }}
                    />
                  </div>
                )
            )}
          </div>
        )}
      </section>

      {/* Projects Section */}
      <section>
        <h2>
          Projects
          <button
            className="add-btn"
            onClick={handleAddProject}
            disabled={editingLocked}
            title={
              editingLocked ? "Editing is locked. Please pay to unlock." : ""
            }
          >
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
        {projects.length === 0 ? (
          <p>No projects added yet.</p>
        ) : (
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
                  onChange={(e) =>
                    editingLocked
                      ? null
                      : handleEditProject(i, "name", e.target.value)
                  }
                  placeholder="Project Name"
                  style={{ width: "100%", margin: "5px 0" }}
                  disabled={editingLocked}
                />
                <textarea
                  className="editable-item"
                  value={p.description}
                  onChange={(e) =>
                    editingLocked
                      ? null
                      : handleEditProject(i, "description", e.target.value)
                  }
                  placeholder="Description"
                  style={{ width: "100%", minHeight: "60px", margin: "5px 0" }}
                  disabled={editingLocked}
                />
                <input
                  className="editable-item"
                  value={p.github}
                  onChange={(e) =>
                    editingLocked
                      ? null
                      : handleEditProject(i, "github", e.target.value)
                  }
                  placeholder="GitHub Link"
                  style={{ width: "100%", margin: "5px 0" }}
                  disabled={editingLocked}
                />
                <input
                  className="editable-item"
                  value={p.liveDemo}
                  onChange={(e) =>
                    editingLocked
                      ? null
                      : handleEditProject(i, "liveDemo", e.target.value)
                  }
                  placeholder="Live Demo Link"
                  style={{ width: "100%", margin: "5px 0" }}
                  disabled={editingLocked}
                />
                <FiTrash2
                  onClick={() =>
                    editingLocked ? null : handleDeleteProject(i)
                  }
                  className={`delete-icon ${editingLocked ? "disabled" : ""}`}
                  style={{
                    cursor: editingLocked ? "not-allowed" : "pointer",
                    opacity: editingLocked ? 0.5 : 1,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Testimonials Section */}
      <section>
        <h2>
          Testimonials
          <button
            className="add-btn"
            onClick={handleAddTestimonial}
            disabled={editingLocked}
            title={
              editingLocked ? "Editing is locked. Please pay to unlock." : ""
            }
          >
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
        {testimonials.length === 0 ? (
          <p>No testimonials added yet.</p>
        ) : (
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
                    editingLocked
                      ? null
                      : handleEditTestimonial(i, "clientName", e.target.value)
                  }
                  placeholder="Client Name"
                  style={{ width: "100%", margin: "5px 0" }}
                  disabled={editingLocked}
                />
                <textarea
                  className="editable-item"
                  value={t.comment}
                  onChange={(e) =>
                    editingLocked
                      ? null
                      : handleEditTestimonial(i, "comment", e.target.value)
                  }
                  placeholder="Client Comment"
                  style={{ width: "100%", minHeight: "80px", margin: "5px 0" }}
                  disabled={editingLocked}
                />
                <input
                  className="editable-item"
                  value={t.position}
                  onChange={(e) =>
                    editingLocked
                      ? null
                      : handleEditTestimonial(i, "position", e.target.value)
                  }
                  placeholder="Client Position"
                  style={{ width: "100%", margin: "5px 0" }}
                  disabled={editingLocked}
                />
                <input
                  className="editable-item"
                  value={t.company}
                  onChange={(e) =>
                    editingLocked
                      ? null
                      : handleEditTestimonial(i, "company", e.target.value)
                  }
                  placeholder="Client Company"
                  style={{ width: "100%", margin: "5px 0" }}
                  disabled={editingLocked}
                />
                <input
                  className="editable-item"
                  value={t.profilePicture}
                  onChange={(e) =>
                    editingLocked
                      ? null
                      : handleEditTestimonial(
                          i,
                          "profilePicture",
                          e.target.value
                        )
                  }
                  placeholder="Profile Picture URL"
                  style={{ width: "100%", margin: "5px 0" }}
                  disabled={editingLocked}
                />
                <FiTrash2
                  onClick={() =>
                    editingLocked ? null : handleDeleteTestimonial(i)
                  }
                  className={`delete-icon ${editingLocked ? "disabled" : ""}`}
                  style={{
                    cursor: editingLocked ? "not-allowed" : "pointer",
                    opacity: editingLocked ? 0.5 : 1,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default AdminPage;
