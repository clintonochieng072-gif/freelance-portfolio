// Create API client with credentials
const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://portfolio-backend-clinton.onrender.com/api";

export const apiFetch = async (url, options = {}) => {
  const config = {
    ...options,
    credentials: "include", // Always include cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${url}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "API request failed");
  }

  return data;
};

// For protected routes that need auth check
export const checkAuth = async () => {
  try {
    const { user } = await apiFetch("/auth/me");
    return user;
  } catch (error) {
    // Clear local storage on auth failure
    localStorage.removeItem("user");
    throw error;
  }
};
