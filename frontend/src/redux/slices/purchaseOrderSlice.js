import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

const initialState = {
    purchaseOrders: [],
    currentPO: null,
    drafts: [],
    analytics: null,
    filters: {
        status: "",
        supplier: "",
        startDate: "",
        endDate: "",
        minAmount: "",
        maxAmount: "",
        warehouse: "",
        search: "",
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

// Create purchase order
export const createPurchaseOrder = createAsyncThunk(
    "purchaseOrder/create",
    async (poData, thunkAPI) => {
        try {
            const response = await api.post("/api/purchase-orders", poData);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to create purchase order";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get all purchase orders
export const getAllPurchaseOrders = createAsyncThunk(
    "purchaseOrder/getAll",
    async (params = {}, thunkAPI) => {
        try {
            const queryParams = new URLSearchParams();
            Object.keys(params).forEach((key) => {
                if (params[key]) queryParams.append(key, params[key]);
            });

            const response = await api.get(`/api/purchase-orders?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to fetch purchase orders";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get purchase order by ID
export const getPurchaseOrderById = createAsyncThunk(
    "purchaseOrder/getById",
    async (id, thunkAPI) => {
        try {
            const response = await api.get(`/api/purchase-orders/${id}`);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to fetch purchase order";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update purchase order
export const updatePurchaseOrder = createAsyncThunk(
    "purchaseOrder/update",
    async ({ id, poData }, thunkAPI) => {
        try {
            const response = await api.put(`/api/purchase-orders/${id}`, poData);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to update purchase order";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Delete purchase order
export const deletePurchaseOrder = createAsyncThunk(
    "purchaseOrder/delete",
    async (id, thunkAPI) => {
        try {
            const response = await api.delete(`/api/purchase-orders/${id}`);
            return { id, message: response.data.message };
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to delete purchase order";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Submit for approval
export const submitForApproval = createAsyncThunk(
    "purchaseOrder/submit",
    async (id, thunkAPI) => {
        try {
            const response = await api.post(`/api/purchase-orders/${id}/submit`);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to submit purchase order";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Approve purchase order
export const approvePurchaseOrder = createAsyncThunk(
    "purchaseOrder/approve",
    async ({ id, comments }, thunkAPI) => {
        try {
            const response = await api.post(`/api/purchase-orders/${id}/approve`, { comments });
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to approve purchase order";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Reject purchase order
export const rejectPurchaseOrder = createAsyncThunk(
    "purchaseOrder/reject",
    async ({ id, rejectionReason }, thunkAPI) => {
        try {
            const response = await api.post(`/api/purchase-orders/${id}/reject`, { rejectionReason });
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to reject purchase order";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Cancel purchase order
export const cancelPurchaseOrder = createAsyncThunk(
    "purchaseOrder/cancel",
    async ({ id, cancellationReason }, thunkAPI) => {
        try {
            const response = await api.post(`/api/purchase-orders/${id}/cancel`, { cancellationReason });
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to cancel purchase order";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Convert to purchase
export const convertToPurchase = createAsyncThunk(
    "purchaseOrder/convert",
    async (id, thunkAPI) => {
        try {
            const response = await api.post(`/api/purchase-orders/${id}/convert`);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to convert purchase order";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Duplicate purchase order
export const duplicatePurchaseOrder = createAsyncThunk(
    "purchaseOrder/duplicate",
    async (id, thunkAPI) => {
        try {
            const response = await api.post(`/api/purchase-orders/${id}/duplicate`);
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to duplicate purchase order";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get analytics
export const getPOAnalytics = createAsyncThunk(
    "purchaseOrder/analytics",
    async (_, thunkAPI) => {
        try {
            const response = await api.get("/api/purchase-orders/analytics");
            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to fetch analytics";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const purchaseOrderSlice = createSlice({
    name: "purchaseOrder",
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = "";
        },
        clearCurrentPO: (state) => {
            state.currentPO = null;
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
            .addCase(createPurchaseOrder.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createPurchaseOrder.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentPO = action.payload.purchaseOrder;
                state.message = action.payload.message;
            })
            .addCase(createPurchaseOrder.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get all
            .addCase(getAllPurchaseOrders.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllPurchaseOrders.fulfilled, (state, action) => {
                state.isLoading = false;
                state.purchaseOrders = action.payload.purchaseOrders;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllPurchaseOrders.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get by ID
            .addCase(getPurchaseOrderById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getPurchaseOrderById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentPO = action.payload;
            })
            .addCase(getPurchaseOrderById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update
            .addCase(updatePurchaseOrder.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updatePurchaseOrder.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentPO = action.payload.purchaseOrder;
                state.message = action.payload.message;
            })
            .addCase(updatePurchaseOrder.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Delete
            .addCase(deletePurchaseOrder.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deletePurchaseOrder.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.purchaseOrders = state.purchaseOrders.filter((po) => po._id !== action.payload.id);
                state.message = action.payload.message;
            })
            .addCase(deletePurchaseOrder.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Submit
            .addCase(submitForApproval.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(submitForApproval.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentPO = action.payload.purchaseOrder;
                state.message = action.payload.message;
            })
            .addCase(submitForApproval.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Approve
            .addCase(approvePurchaseOrder.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(approvePurchaseOrder.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentPO = action.payload.purchaseOrder;
                state.message = action.payload.message;
            })
            .addCase(approvePurchaseOrder.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Reject
            .addCase(rejectPurchaseOrder.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(rejectPurchaseOrder.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentPO = action.payload.purchaseOrder;
                state.message = action.payload.message;
            })
            .addCase(rejectPurchaseOrder.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Cancel
            .addCase(cancelPurchaseOrder.pending, (state) => {
                state.isLoading = false;
            })
            .addCase(cancelPurchaseOrder.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentPO = action.payload.purchaseOrder;
                state.message = action.payload.message;
            })
            .addCase(cancelPurchaseOrder.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Convert
            .addCase(convertToPurchase.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(convertToPurchase.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentPO = action.payload.purchaseOrder;
                state.message = action.payload.message;
            })
            .addCase(convertToPurchase.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Duplicate
            .addCase(duplicatePurchaseOrder.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(duplicatePurchaseOrder.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentPO = action.payload.purchaseOrder;
                state.message = action.payload.message;
            })
            .addCase(duplicatePurchaseOrder.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Analytics
            .addCase(getPOAnalytics.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getPOAnalytics.fulfilled, (state, action) => {
                state.isLoading = false;
                state.analytics = action.payload;
            })
            .addCase(getPOAnalytics.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset, clearCurrentPO, setFilters, clearFilters, setPagination } = purchaseOrderSlice.actions;
export default purchaseOrderSlice.reducer;
