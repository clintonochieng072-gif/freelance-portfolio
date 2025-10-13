import React from "react";
import { Navigate } from "react-router-dom";
import { useGlobalContext } from "../context/GlobalContext";

function ProtectedRoute({ children }) {
  const { token, loading } = useGlobalContext();

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

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
