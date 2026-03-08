import axiosClient from '../api/axiosClient.js';

export const attendanceService = {
  async getDailyRows(params) {
    const { data } = await axiosClient.get('/attendance/daily', { params });
    return data;
  },

  async getSummary(params) {
    const { data } = await axiosClient.get('/attendance/summary', { params });
    return data;
  },

  async submit(payload) {
    const { data } = await axiosClient.post('/attendance', payload);
    return data;
  }
};
