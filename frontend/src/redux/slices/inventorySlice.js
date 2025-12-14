import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL + "/api/inventory";

// Get token from state
const getConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const initialState = {
  items: [],
  item: null,
  lowStockItems: [],
  alerts: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Get all items
export const getAllItems = createAsyncThunk(
  'inventory/getAll',
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

// Get item by ID
export const getItemById = createAsyncThunk(
  'inventory/getById',
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

// Add item
export const addItem = createAsyncThunk(
  'inventory/add',
  async (itemData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await axios.post(API_URL, itemData, getConfig(token));
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

// Update item
export const updateItem = createAsyncThunk(
  'inventory/update',
  async ({ id, itemData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await axios.put(
        `${API_URL}/${id}`,
        itemData,
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

// Delete item
export const deleteItem = createAsyncThunk(
  'inventory/delete',
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

// Get low stock items
export const getLowStockItems = createAsyncThunk(
  'inventory/getLowStock',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await axios.get(`${API_URL}/low-stock`, getConfig(token));
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

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearItem: (state) => {
      state.item = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all items
      .addCase(getAllItems.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.items = action.payload;
      })
      .addCase(getAllItems.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get item by ID
      .addCase(getItemById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getItemById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.item = action.payload;
      })
      .addCase(getItemById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Add item
      .addCase(addItem.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.items.push(action.payload.item);
        state.alerts = action.payload.alerts || [];
      })
      .addCase(addItem.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update item
      .addCase(updateItem.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.items = state.items.map((item) =>
          item._id === action.payload.updated._id ? action.payload.updated : item
        );
        state.item = action.payload.updated;
        state.alerts = action.payload.alerts || [];
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete item
      .addCase(deleteItem.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.items = state.items.filter((item) => item._id !== action.payload);
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get low stock items
      .addCase(getLowStockItems.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getLowStockItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.lowStockItems = action.payload;
      })
      .addCase(getLowStockItems.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearItem } = inventorySlice.actions;
export default inventorySlice.reducer;