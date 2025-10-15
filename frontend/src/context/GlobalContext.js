import React, { createContext, useContext, useState, useEffect } from "react";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState({});
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);

  // ✅ FIXED: API_URL moved inside useEffect - ESLint compliant
  useEffect(() => {
    const API_URL =
      process.env.REACT_APP_API_URL ||
      "https://portfolio-backend-clinton.onrender.com/api";

    const checkAuthStatus = async () => {
      try {
        console.log("🔍 Checking auth status...");

        const response = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        console.log("🔍 Auth response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Auth success:", data.user?.username);
          setUser(data.user);

          if (data.user) {
            localStorage.setItem("cachedUser", JSON.stringify(data.user));
          }
        } else {
          // Fallback to cached user
          const cachedUser = localStorage.getItem("cachedUser");
          if (cachedUser) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              console.log("✅ Using cached user:", parsedUser.username);
              setUser(parsedUser);
            } catch (parseErr) {
              console.error("Cached user parse error:", parseErr);
            }
          } else {
            console.log("❌ No auth, no cache");
            setUser(null);
          }
        }
      } catch (error) {
        console.error("💥 Auth check failed:", error);

        // Ultimate fallback: cached user
        try {
          const cachedUser = localStorage.getItem("cachedUser");
          if (cachedUser) {
            const parsedUser = JSON.parse(cachedUser);
            console.log("✅ Fallback to cached user:", parsedUser.username);
            setUser(parsedUser);
          }
        } catch (cacheErr) {
          console.error("Cache fallback failed:", cacheErr);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []); // ✅ Clean dependency array - ESLint happy

  const login = (userData) => {
    console.log("🔐 Login:", userData.username);
    setUser(userData);
    localStorage.setItem("cachedUser", JSON.stringify(userData));
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("cachedUser");
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
