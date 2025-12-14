import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL + "/api/pos";

// Get token from state
const getConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const initialState = {
  invoices: [],
  invoice: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Create invoice
export const createInvoice = createAsyncThunk(
  'pos/createInvoice',
  async (invoiceData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await axios.post(`${API_URL}/invoice`, invoiceData, getConfig(token));
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

// Get all invoices
export const getAllInvoices = createAsyncThunk(
  'pos/getAll',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await axios.get(`${API_URL}/invoices`, getConfig(token));
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

// Get invoice by ID
export const getInvoiceById = createAsyncThunk(
  'pos/getById',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await axios.get(`${API_URL}/invoice/${id}`, getConfig(token));
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

// Delete invoice
export const deleteInvoice = createAsyncThunk(
  'pos/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      await axios.delete(`${API_URL}/invoice/${id}`, getConfig(token));
      return id;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearInvoice: (state) => {
      state.invoice = null;
      state.isSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create invoice
      .addCase(createInvoice.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.invoice = action.payload.invoice;
        state.invoices.unshift(action.payload.invoice);
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get all invoices
      .addCase(getAllInvoices.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.invoices = action.payload;
      })
      .addCase(getAllInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get invoice by ID
      .addCase(getInvoiceById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getInvoiceById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.invoice = action.payload;
      })
      .addCase(getInvoiceById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete invoice
      .addCase(deleteInvoice.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.invoices = state.invoices.filter((inv) => inv._id !== action.payload);
      })
      .addCase(deleteInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearInvoice } = posSlice.actions;
export default posSlice.reducer;