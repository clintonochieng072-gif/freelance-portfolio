import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { GlobalProvider } from "./context/GlobalContext";
import AdminPage from "./components/AdminPage";
import HomePage from "./components/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import LoginPage from "./pages/LoginPage";
import DarkModeToggle from "./components/DarkModeToggle";
import "./App.css";

const AdminWrapper = () => {
  const { username } = useParams();
  return <AdminPage username={username} />;
};

const PortfolioWrapper = () => {
  const { username } = useParams();
  return <HomePage username={username} />;
};

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <GlobalProvider>
      <div className={`App ${darkMode ? "dark-mode" : ""}`}>
        <BrowserRouter>
          <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          <Routes>
            <Route path="/" element={<HomePage username="guest" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/:username" element={<AdminWrapper />} />
            <Route path="/portfolio/:username" element={<PortfolioWrapper />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </div>
    </GlobalProvider>
  );
}

export default App;
