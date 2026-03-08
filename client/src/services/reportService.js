import axiosClient from '../api/axiosClient.js';

export const reportService = {
  async getMonthly(month, year) {
    const { data } = await axiosClient.get('/reports/monthly', {
      params: { month, year }
    });
    return data;
  }
};
