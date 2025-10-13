import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const [contacts, setContacts] = useState({});
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const savedToken = Cookies.get("token");

      if (savedToken) {
        try {
          const API_URL =
            process.env.REACT_APP_API_URL || "http://localhost:5000/api";
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(savedToken);
          } else {
            // Token invalid, clear it
            Cookies.remove("token");
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          Cookies.remove("token");
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    Cookies.set("token", jwtToken, { expires: 7 });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setContacts({});
    setSkills([]);
    setProjects([]);
    Cookies.remove("token");
  };

  return (
    <GlobalContext.Provider
      value={{
        user,
        token,
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
