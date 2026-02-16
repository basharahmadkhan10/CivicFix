import { createContext, useState, useContext, useEffect } from "react";
const AuthContext = createContext();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = "https://civicfix-backend01.onrender.com/api"; 

  useEffect(() => {
    console.log("AuthProvider: Checking localStorage for user data");

    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    console.log("AuthProvider: Token exists?", !!token);
    console.log("AuthProvider: Saved user exists?", !!savedUser);

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log(
          "AuthProvider: Setting user from localStorage:",
          parsedUser,
        );
        setUser(parsedUser);
      } catch (error) {
        console.error("AuthProvider: Error parsing user data:", error);
        clearAuthData();
      }
    } else {
      console.log("AuthProvider: No auth data found in localStorage");
    }

    setLoading(false);
  }, []);

  const clearAuthData = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

const signup = async (userData) => {
  console.log("AuthContext.signup called with:", userData);

  try {
    const response = await fetch(`${API_BASE_URL}/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
      console.log("AuthContext.signup JSON response:", data);
    } else {
      const text = await response.text();
      console.error(
        "AuthContext.signup non-JSON response:",
        text.substring(0, 200),
      );
      throw new Error(`Server error (${response.status}). Please try again.`);
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
          data.error ||
          `Registration failed (${response.status})`,
      );
    }
    if (data.token && data.user) {
      console.log("AuthContext: Auto-login after registration");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);

      return {
        success: true,
        message: data.message || "Account created successfully!",
        token: data.token,
        user: data.user,
      };
    }
    return {
      success: true,
      message: data.message || "Account created successfully! Please login.",
      data: data,
    };
  } catch (error) {
    console.error("AuthContext.signup error:", error);

    return {
      success: false,
      error: error.message || "Registration failed. Please try again.",
    };
  }
};
  const login = (token, userData) => {
    console.log("AuthContext.login called with:", { token, userData });
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    console.log("AuthContext: User set in state:", userData);
    console.log("AuthContext: Token saved in localStorage:", !!token);
    console.log("AuthContext: User saved in localStorage:", !!userData);
    return { success: true };
  };

  const logout = () => {
    console.log("AuthContext.logout called");
    clearAuthData();
    window.location.href = "/login";
  };
  const value = {
    user,
    loading,
    signup, 
    login,
    logout,
    isAuthenticated: !!user,
  };
  console.log("AuthProvider: Rendering with state:", {
    user,
    loading,
    isAuthenticated: !!user,
  });
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

};
