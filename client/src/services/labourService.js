import axiosClient from '../api/axiosClient.js';

export const labourService = {
  async getLabours(search = '') {
    const { data } = await axiosClient.get('/labours', { params: { search } });
    return data;
  },

  async getLabourById(id) {
    const { data } = await axiosClient.get(`/labours/${id}`);
    return data;
  },

  async createLabour(payload) {
    const { data } = await axiosClient.post('/labours', payload);
    return data;
  },

  async updateLabour(id, payload) {
    const { data } = await axiosClient.put(`/labours/${id}`, payload);
    return data;
  },

  async deleteLabour(id) {
    const { data } = await axiosClient.delete(`/labours/${id}`);
    return data;
  }
};
