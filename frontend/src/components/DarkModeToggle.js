import React from "react";
import { FiMoon, FiSun } from "react-icons/fi";

const DarkModeToggle = ({ darkMode, setDarkMode }) => {
  return (
    <button
      className="dark-mode-toggle"
      onClick={() => setDarkMode(!darkMode)}
      aria-label="Toggle dark mode"
    >
      {darkMode ? <FiSun /> : <FiMoon />}
    </button>
  );
};

export default DarkModeToggle;
