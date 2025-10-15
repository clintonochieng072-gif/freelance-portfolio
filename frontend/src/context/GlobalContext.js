import React, { createContext, useContext, useState, useEffect } from "react";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [contacts, setContacts] = useState({});
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);

  // ✅ FIXED: Check auth using cookies (no token needed)
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const API_URL =
          process.env.REACT_APP_API_URL ||
          "https://portfolio-backend-clinton.onrender.com/api";

        console.log("🔍 Checking initial auth status...");

        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: "include", // ✅ Use cookies, not Authorization header
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Initial auth restored:", data.user.username);
          setUser(data.user);
        } else {
          console.log("❌ No active session found");
          const authData = await response.json();
          console.log("Auth check response:", authData);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // ✅ FIXED: Login accepts user only (no token needed)
  const login = (userData) => {
    console.log("🔐 Context login:", userData.username);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    // Backend clears httpOnly cookie
    setContacts({});
    setSkills([]);
    setProjects([]);
  };

  console.log("🌍 GlobalContext:", { user: !!user, loading });

  return (
    <GlobalContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        contacts,
        setContacts,
        skills,
        setSkills,
        projects,
        setProjects,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};
