import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const API_URL = "/api/delivery-challan";

// Get token from state
const getConfig = (token) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

const initialState = {
    challans: [],
    challan: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

// Create delivery challan
export const createDeliveryChallan = createAsyncThunk(
    'deliveryChallan/create',
    async (challanData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const response = await api.post(API_URL, challanData, getConfig(token));
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

// Get all delivery challans
export const getAllDeliveryChallans = createAsyncThunk(
    'deliveryChallan/getAll',
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

// Get delivery challan by ID
export const getDeliveryChallanById = createAsyncThunk(
    'deliveryChallan/getById',
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

// Update delivery challan
export const updateDeliveryChallan = createAsyncThunk(
    'deliveryChallan/update',
    async ({ id, data }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const response = await api.put(`${API_URL}/${id}`, data, getConfig(token));
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

// Convert to invoice
export const convertToInvoice = createAsyncThunk(
    'deliveryChallan/convertToInvoice',
    async (id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const response = await api.post(`${API_URL}/${id}/convert-to-invoice`, {}, getConfig(token));
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

// Delete delivery challan
export const deleteDeliveryChallan = createAsyncThunk(
    'deliveryChallan/delete',
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

export const deliveryChallanSlice = createSlice({
    name: 'deliveryChallan',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
            state.challan = null; // Clear cached challan
        },
        clearChallan: (state) => {
            state.challan = null;
            state.isSuccess = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create delivery challan
            .addCase(createDeliveryChallan.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createDeliveryChallan.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.challan = action.payload.challan;
            })
            .addCase(createDeliveryChallan.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get all delivery challans
            .addCase(getAllDeliveryChallans.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllDeliveryChallans.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.challans = action.payload;
            })
            .addCase(getAllDeliveryChallans.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get delivery challan by ID
            .addCase(getDeliveryChallanById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getDeliveryChallanById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.challan = action.payload;
            })
            .addCase(getDeliveryChallanById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update delivery challan
            .addCase(updateDeliveryChallan.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateDeliveryChallan.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.challan = action.payload.challan;
            })
            .addCase(updateDeliveryChallan.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Convert to invoice
            .addCase(convertToInvoice.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(convertToInvoice.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.challan = action.payload.challan;
            })
            .addCase(convertToInvoice.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Delete delivery challan
            .addCase(deleteDeliveryChallan.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteDeliveryChallan.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.challans = state.challans.filter((c) => c._id !== action.payload);
            })
            .addCase(deleteDeliveryChallan.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset, clearChallan } = deliveryChallanSlice.actions;
export default deliveryChallanSlice.reducer;
