import React from "react";
import { Navigate } from "react-router-dom";
import { useGlobalContext } from "../context/GlobalContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useGlobalContext();

  console.log("🔒 ProtectedRoute:", {
    user: !!user,
    loading,
    username: user?.username,
  });

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
        }}
      >
        Checking authentication...
      </div>
    );
  }

  // ✅ ENHANCED: Multiple checks for user validity
  const isAuthenticated =
    user &&
    user.username &&
    typeof user.username === "string" &&
    user.username.trim() !== "";

  if (!isAuthenticated) {
    console.log("🚫 Redirecting to login - no valid user");
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
