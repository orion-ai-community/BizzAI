import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL + "/api/customers";

// Get token from state
const getConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const initialState = {
  customers: [],
  customer: null,
  transactions: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Get all customers
export const getAllCustomers = createAsyncThunk(
  'customers/getAll',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await axios.get(API_URL, getConfig(token));
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

// Get customer by ID
export const getCustomerById = createAsyncThunk(
  'customers/getById',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await axios.get(`${API_URL}/${id}`, getConfig(token));
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

// Add customer
export const addCustomer = createAsyncThunk(
  'customers/add',
  async (customerData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await axios.post(API_URL, customerData, getConfig(token));
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

// Update customer
export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ id, customerData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await axios.put(
        `${API_URL}/${id}`,
        customerData,
        getConfig(token)
      );
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

// Delete customer
export const deleteCustomer = createAsyncThunk(
  'customers/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      await axios.delete(`${API_URL}/${id}`, getConfig(token));
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

// Get customer transactions
export const getCustomerTransactions = createAsyncThunk(
  'customers/getTransactions',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await axios.get(
        `${API_URL}/${id}/transactions`,
        getConfig(token)
      );
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

export const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearCustomer: (state) => {
      state.customer = null;
      state.transactions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all customers
      .addCase(getAllCustomers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllCustomers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.customers = action.payload;
      })
      .addCase(getAllCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get customer by ID
      .addCase(getCustomerById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCustomerById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.customer = action.payload;
      })
      .addCase(getCustomerById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Add customer
      .addCase(addCustomer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.customers.push(action.payload);
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update customer
      .addCase(updateCustomer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.customers = state.customers.map((customer) =>
          customer._id === action.payload._id ? action.payload : customer
        );
        state.customer = action.payload;
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete customer
      .addCase(deleteCustomer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.customers = state.customers.filter(
          (customer) => customer._id !== action.payload
        );
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get customer transactions
      .addCase(getCustomerTransactions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCustomerTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.transactions = action.payload.transactions || [];
      })
      .addCase(getCustomerTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearCustomer } = customerSlice.actions;
export default customerSlice.reducer;