import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import HomePage from "./HomePage";

function PortfolioWrapper() {
  const { username } = useParams();

  console.log("PortfolioWrapper - Username from URL:", username);

  // Add debug to check if component mounts
  useEffect(() => {
    console.log("PortfolioWrapper mounted with username:", username);
  }, [username]);

  if (!username) {
    return <div>Error: No username provided in URL</div>;
  }

  return <HomePage username={username} />;
}

export default PortfolioWrapper;
