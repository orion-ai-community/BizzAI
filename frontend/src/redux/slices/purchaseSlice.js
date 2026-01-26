import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

const initialState = {
    purchases: [],
    currentPurchase: null,
    drafts: [],
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: "",
};

// Create purchase
export const createPurchase = createAsyncThunk(
    "purchase/create",
    async (purchaseData, thunkAPI) => {
        try {
            const response = await api.post("/api/purchases", purchaseData);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to create purchase";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get all purchases
export const getAllPurchases = createAsyncThunk(
    "purchase/getAll",
    async (filters = {}, thunkAPI) => {
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append("status", filters.status);
            if (filters.supplier) params.append("supplier", filters.supplier);
            if (filters.startDate) params.append("startDate", filters.startDate);
            if (filters.endDate) params.append("endDate", filters.endDate);

            const response = await api.get(`/api/purchases?${params.toString()}`);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to fetch purchases";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get purchase by ID
export const getPurchaseById = createAsyncThunk(
    "purchase/getById",
    async (id, thunkAPI) => {
        try {
            const response = await api.get(`/api/purchases/${id}`);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to fetch purchase";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get draft purchases
export const getDrafts = createAsyncThunk(
    "purchase/getDrafts",
    async (_, thunkAPI) => {
        try {
            const response = await api.get("/api/purchases/drafts");
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to fetch drafts";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update purchase
export const updatePurchase = createAsyncThunk(
    "purchase/update",
    async ({ id, purchaseData }, thunkAPI) => {
        try {
            const response = await api.put(`/api/purchases/${id}`, purchaseData);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to update purchase";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Finalize purchase
export const finalizePurchase = createAsyncThunk(
    "purchase/finalize",
    async (id, thunkAPI) => {
        try {
            const response = await api.post(`/api/purchases/${id}/finalize`);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to finalize purchase";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Cancel purchase
export const cancelPurchase = createAsyncThunk(
    "purchase/cancel",
    async ({ id, cancelReason }, thunkAPI) => {
        try {
            const response = await api.post(`/api/purchases/${id}/cancel`, {
                cancelReason,
            });
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to cancel purchase";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const purchaseSlice = createSlice({
    name: "purchase",
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = "";
        },
        clearCurrentPurchase: (state) => {
            state.currentPurchase = null;
        },
        clearAll: (state) => {
            state.purchases = [];
            state.currentPurchase = null;
            state.drafts = [];
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = "";
        },
    },
    extraReducers: (builder) => {
        builder
            // Create purchase
            .addCase(createPurchase.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(createPurchase.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentPurchase = action.payload.purchase;
                state.message = action.payload.message;
            })
            .addCase(createPurchase.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get all purchases
            .addCase(getAllPurchases.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllPurchases.fulfilled, (state, action) => {
                state.isLoading = false;
                state.purchases = action.payload;
            })
            .addCase(getAllPurchases.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get purchase by ID
            .addCase(getPurchaseById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getPurchaseById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentPurchase = action.payload;
            })
            .addCase(getPurchaseById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get drafts
            .addCase(getDrafts.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getDrafts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.drafts = action.payload;
            })
            .addCase(getDrafts.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update purchase
            .addCase(updatePurchase.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updatePurchase.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentPurchase = action.payload.purchase;
                state.message = action.payload.message;
            })
            .addCase(updatePurchase.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Finalize purchase
            .addCase(finalizePurchase.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(finalizePurchase.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentPurchase = action.payload.purchase;
                state.message = action.payload.message;
            })
            .addCase(finalizePurchase.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Cancel purchase
            .addCase(cancelPurchase.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(cancelPurchase.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentPurchase = action.payload.purchase;
                state.message = action.payload.message;
            })
            .addCase(cancelPurchase.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset, clearCurrentPurchase, clearAll } = purchaseSlice.actions;
export default purchaseSlice.reducer;
