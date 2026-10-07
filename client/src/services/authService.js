import apiClient from "./apiClient";

export async function registerUser({ name, email, password }) {
  try {
    const response = await apiClient.post("/auth/register", {
      name,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Registration failed. Please try again.";
    throw new Error(message);
  }
}

export async function loginUser({ email, password }) {
  try {
    const response = await apiClient.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Invalid email or password.";
    throw new Error(message);
  }
}

export async function getCurrentUser() {
  try {
    const response = await apiClient.get("/auth/me");
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to retrieve user session.";
    throw new Error(message);
  }
}

export async function updateUserProfile(data) {
  try {
    const response = await apiClient.put("/auth/profile", data);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to update profile.";
    throw new Error(message);
  }
}

export async function changeUserPassword({ currentPassword, newPassword }) {
  try {
    const response = await apiClient.put("/auth/password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to change password.";
    throw new Error(message);
  }
}
