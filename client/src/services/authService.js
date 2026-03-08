import axiosClient from '../api/axiosClient.js';

export const authService = {
  async login(payload) {
    const { data } = await axiosClient.post('/auth/login', payload);
    return data;
  },

  async loginLabour(payload) {
    const { data } = await axiosClient.post('/auth/labour/login', payload);
    return data;
  },

  async getMe() {
    const { data } = await axiosClient.get('/auth/me');
    return data;
  },

  async updateProfileImage(payload) {
    const { data } = await axiosClient.put('/auth/me/profile-image', payload);
    return data;
  },

  async getAdmins() {
    const { data } = await axiosClient.get('/auth/admins');
    return data;
  },

  async createAdmin(payload) {
    const { data } = await axiosClient.post('/auth/admins', payload);
    return data;
  },

  async deleteAdmin(id) {
    const { data } = await axiosClient.delete(`/auth/admins/${id}`);
    return data;
  }
};
