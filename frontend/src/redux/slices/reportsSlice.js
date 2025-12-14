import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL + "/api/reports";

// Get token from state
const getConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const initialState = {
  salesReport: null,
  stockReport: null,
  customerReport: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Get sales report
export const getSalesReport = createAsyncThunk(
  'reports/getSales',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await axios.get(`${API_URL}/sales`, getConfig(token));
      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get stock report
export const getStockReport = createAsyncThunk(
  'reports/getStock',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await axios.get(`${API_URL}/stock`, getConfig(token));
      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get customer report
export const getCustomerReport = createAsyncThunk(
  'reports/getCustomers',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await axios.get(`${API_URL}/customers`, getConfig(token));
      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Get sales report
      .addCase(getSalesReport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSalesReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.salesReport = action.payload;
      })
      .addCase(getSalesReport.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get stock report
      .addCase(getStockReport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStockReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.stockReport = action.payload;
      })
      .addCase(getStockReport.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get customer report
      .addCase(getCustomerReport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCustomerReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.customerReport = action.payload;
      })
      .addCase(getCustomerReport.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = reportsSlice.actions;
export default reportsSlice.reducer;