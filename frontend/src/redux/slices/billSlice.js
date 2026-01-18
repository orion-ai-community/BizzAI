import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const API_URL = "/api/bills";

// Get token from state
const getConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const initialState = {
  bills: [],
  bill: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Get all bills
export const getAllBills = createAsyncThunk(
  'bill/getAll',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.get(API_URL, getConfig(token));
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

// Create bill
export const createBill = createAsyncThunk(
  'bill/create',
  async (billData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.post(API_URL, billData, getConfig(token));
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

// Get bill by ID
export const getBillById = createAsyncThunk(
  'bill/getById',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.get(`${API_URL}/${id}`, getConfig(token));
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

// Update bill
export const updateBill = createAsyncThunk(
  'bill/update',
  async ({ id, billData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.put(`${API_URL}/${id}`, billData, getConfig(token));
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

// Delete bill
export const deleteBill = createAsyncThunk(
  'bill/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      await api.delete(`${API_URL}/${id}`, getConfig(token));
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

export const billSlice = createSlice({
  name: 'bill',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearBill: (state) => {
      state.bill = null;
      state.isSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all bills
      .addCase(getAllBills.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllBills.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.bills = action.payload;
      })
      .addCase(getAllBills.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Create bill
      .addCase(createBill.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createBill.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.bills.unshift(action.payload);
      })
      .addCase(createBill.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get bill by ID
      .addCase(getBillById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBillById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.bill = action.payload;
      })
      .addCase(getBillById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update bill
      .addCase(updateBill.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateBill.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.bills.findIndex(bill => bill._id === action.payload._id);
        if (index !== -1) {
          state.bills[index] = action.payload;
        }
      })
      .addCase(updateBill.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete bill
      .addCase(deleteBill.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteBill.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.bills = state.bills.filter((bill) => bill._id !== action.payload);
      })
      .addCase(deleteBill.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearBill } = billSlice.actions;
export default billSlice.reducer;