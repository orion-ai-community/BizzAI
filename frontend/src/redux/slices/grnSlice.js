import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

const initialState = {
    grns: [],
    currentGRN: null,
    filters: {
        status: "",
        supplier: "",
        purchaseOrder: "",
        startDate: "",
        endDate: "",
    },
    pagination: {
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
    },
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: "",
};

// Create GRN
export const createGRN = createAsyncThunk(
    "grn/create",
    async (grnData, thunkAPI) => {
        try {
            const response = await api.post("/api/grns", grnData);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to create GRN";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get all GRNs
export const getAllGRNs = createAsyncThunk(
    "grn/getAll",
    async (params = {}, thunkAPI) => {
        try {
            const queryParams = new URLSearchParams();
            Object.keys(params).forEach((key) => {
                if (params[key]) queryParams.append(key, params[key]);
            });

            const response = await api.get(`/api/grns?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to fetch GRNs";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get GRN by ID
export const getGRNById = createAsyncThunk(
    "grn/getById",
    async (id, thunkAPI) => {
        try {
            const response = await api.get(`/api/grns/${id}`);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to fetch GRN";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Finalize GRN
export const finalizeGRN = createAsyncThunk(
    "grn/finalize",
    async (id, thunkAPI) => {
        try {
            const response = await api.post(`/api/grns/${id}/finalize`);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to finalize GRN";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const grnSlice = createSlice({
    name: "grn",
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = "";
        },
        clearCurrentGRN: (state) => {
            state.currentGRN = null;
        },
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
            state.filters = initialState.filters;
        },
        setPagination: (state, action) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },
    },
    extraReducers: (builder) => {
        builder
            // Create
            .addCase(createGRN.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createGRN.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentGRN = action.payload.grn;
                state.message = action.payload.message;
            })
            .addCase(createGRN.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get all
            .addCase(getAllGRNs.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllGRNs.fulfilled, (state, action) => {
                state.isLoading = false;
                state.grns = action.payload.grns;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllGRNs.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get by ID
            .addCase(getGRNById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getGRNById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentGRN = action.payload;
            })
            .addCase(getGRNById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Finalize
            .addCase(finalizeGRN.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(finalizeGRN.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentGRN = action.payload.grn;
                state.message = action.payload.message;
            })
            .addCase(finalizeGRN.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset, clearCurrentGRN, setFilters, clearFilters, setPagination } = grnSlice.actions;
export default grnSlice.reducer;
