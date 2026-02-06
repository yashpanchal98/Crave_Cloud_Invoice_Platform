import axios from 'axios';

const API_URL ='http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Client APIs
export const clientAPI = {
  // Create new client
  createClient: async (clientData) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },

  // Get all clients
  getAllClients: async (search = '') => {
    const params = search ? `?search=${search}` : '';
    const response = await api.get(`/clients${params}`);
    return response.data;
  },

  // Get single client with order history
  getClient: async (id) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  // Update client
  updateClient: async (id, clientData) => {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  },

  // Delete client
  deleteClient: async (id) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },

  // Get client orders
  getClientOrders: async (id, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/clients/${id}/orders?${params.toString()}`);
    return response.data;
  },
};

// Order APIs
export const orderAPI = {
  // Create new order
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Get all orders
  getAllOrders: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.clientName) params.append('clientName', filters.clientName);
    if (filters.clientId) params.append('clientId', filters.clientId);
    
    const response = await api.get(`/orders?${params.toString()}`);
    return response.data;
  },

  // Get single order
  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Get daily statistics
  getDailyStats: async (date) => {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`/orders/stats/daily${params}`);
    return response.data;
  },

  // Download invoice
  downloadInvoice: async (id) => {
    const response = await api.get(`/orders/invoice/${id}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download consolidated invoice
  downloadConsolidatedInvoice: async (clientId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/orders/consolidated-invoice/${clientId}?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Delete order
  deleteOrder: async (id) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },
};

export default api;