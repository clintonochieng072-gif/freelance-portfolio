import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { GlobalProvider } from "./context/GlobalContext";
import DarkModeToggle from "./components/DarkModeToggle";
import HomePage from "./components/HomePage";
import AdminPage from "./components/AdminPage";
import ClientAdmin from "./components/ClientAdmin";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./components/RegisterPage";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <GlobalProvider>
      <div className={`App ${darkMode ? "dark-mode" : ""}`}>
        <Router>
          <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/register" replace />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/portfolio/:username" element={<HomePage />} />

            {/* Client Admin Routes */}
            <Route path="/admin/dashboard" element={<ClientAdmin />} />
            <Route path="/admin/:username" element={<AdminPage />} />

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </div>
    </GlobalProvider>
  );
}

export default App;
