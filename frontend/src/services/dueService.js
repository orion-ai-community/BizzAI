import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL + "/api/due/";

// Create due adjustment
const createDueAdjustment = async (adjustmentData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL + "adjust", adjustmentData, config);
  return response.data;
};

// Get all due adjustments
const getDueAdjustments = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + "adjustments", config);
  return response.data;
};

// Get customer due adjustments
const getCustomerDueAdjustments = async (customerId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(
    API_URL + `customer/${customerId}/adjustments`,
    config
  );
  return response.data;
};

const dueService = {
  createDueAdjustment,
  getDueAdjustments,
  getCustomerDueAdjustments,
};

export default dueService;
