import axiosClient from '../api/axiosClient.js';

export const billingService = {
  async getMyProfileBilling(month, year) {
    const { data } = await axiosClient.get('/billing/my-profile', {
      params: { month, year }
    });
    return data;
  },

  async getLabourBilling(id, month, year) {
    const { data } = await axiosClient.get(`/billing/labour/${id}`, {
      params: { month, year }
    });
    return data;
  },

  async updatePayment(id, payload) {
    const { data } = await axiosClient.put(`/billing/labour/${id}/payment`, payload);
    return data;
  },

  async addCanteenEntry(id, payload) {
    const { data } = await axiosClient.post(`/billing/labour/${id}/adjustments/canteen`, payload);
    return data;
  },

  async addAdvanceEntry(id, payload) {
    const { data } = await axiosClient.post(`/billing/labour/${id}/adjustments/advance`, payload);
    return data;
  },

  async addExtraEntry(id, payload) {
    const { data } = await axiosClient.post(`/billing/labour/${id}/adjustments/extra`, payload);
    return data;
  }
};
