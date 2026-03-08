import { createContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const token = localStorage.getItem('labour_token');

  const logout = () => {
    localStorage.removeItem('labour_token');
    setAdmin(null);
  };

  const fetchProfile = async () => {
    try {
      const response = await authService.getMe();
      setAdmin(response.data.admin);
    } catch (error) {
      logout();
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setIsAuthLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const { mode = 'admin', ...loginPayload } = credentials;
    const response =
      mode === 'labour'
        ? await authService.loginLabour(loginPayload)
        : await authService.login(loginPayload);
    const payload = response.data;

    localStorage.setItem('labour_token', payload.token);
    setAdmin(payload.admin);
    toast.success('Login successful');
  };

  const updateProfileImage = async (profileImage) => {
    const response = await authService.updateProfileImage({ profileImage });
    setAdmin(response.data.admin);
    return response;
  };

  const value = useMemo(
    () => ({
      admin,
      token,
      isAuthLoading,
      isAuthenticated: Boolean(admin && token),
      login,
      logout,
      refreshProfile: fetchProfile,
      updateProfileImage
    }),
    [admin, token, isAuthLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
