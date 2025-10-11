// src/context/GlobalContext.js
import React, { createContext, useContext, useState } from "react";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { username, email, role }
  const [token, setToken] = useState(null); // JWT token

  const [contacts, setContacts] = useState({});
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setContacts({});
    setSkills([]);
    setProjects([]);
  };

  return (
    <GlobalContext.Provider
      value={{
        user,
        token,
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

export const useGlobalContext = () => useContext(GlobalContext);
