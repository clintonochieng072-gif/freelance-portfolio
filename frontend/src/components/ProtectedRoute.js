import React from "react";
import { Navigate } from "react-router-dom";
import { useGlobalContext } from "../context/GlobalContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useGlobalContext(); // ✅ Check user, NOT token

  console.log("🔒 ProtectedRoute check:", { user: !!user, loading });

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Checking authentication...</div>
      </div>
    );
  }

  if (!user) {
    // ✅ Check user object, not token
    console.log("🚫 No user - redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
