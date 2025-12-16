import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL + "/api/sales-invoice";

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

// Get all sales invoices
export const getAllSalesInvoices = createAsyncThunk(
    'salesInvoice/getAll',
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

// Get sales invoice by ID
export const getSalesInvoiceById = createAsyncThunk(
    'salesInvoice/getById',
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

// Delete sales invoice
export const deleteSalesInvoice = createAsyncThunk(
    'salesInvoice/delete',
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

export const salesInvoiceSlice = createSlice({
    name: 'salesInvoice',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearSalesInvoice: (state) => {
            state.invoice = null;
            state.isSuccess = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // Get all sales invoices
            .addCase(getAllSalesInvoices.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllSalesInvoices.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.invoices = action.payload;
            })
            .addCase(getAllSalesInvoices.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get sales invoice by ID
            .addCase(getSalesInvoiceById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSalesInvoiceById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.invoice = action.payload;
            })
            .addCase(getSalesInvoiceById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Delete sales invoice
            .addCase(deleteSalesInvoice.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteSalesInvoice.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.invoices = state.invoices.filter((inv) => inv._id !== action.payload);
            })
            .addCase(deleteSalesInvoice.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset, clearSalesInvoice } = salesInvoiceSlice.actions;
export default salesInvoiceSlice.reducer;
