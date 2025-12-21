import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import dueService from "../../services/dueService";

const initialState = {
    adjustments: [],
    adjustment: null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: "",
};

// Create due adjustment
export const createDueAdjustment = createAsyncThunk(
    "due/createAdjustment",
    async (adjustmentData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await dueService.createDueAdjustment(adjustmentData, token);
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get all due adjustments
export const getDueAdjustments = createAsyncThunk(
    "due/getAll",
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await dueService.getDueAdjustments(token);
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get customer due adjustments
export const getCustomerDueAdjustments = createAsyncThunk(
    "due/getCustomerAdjustments",
    async (customerId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await dueService.getCustomerDueAdjustments(customerId, token);
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const dueSlice = createSlice({
    name: "due",
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = "";
        },
        clearAdjustment: (state) => {
            state.adjustment = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create due adjustment
            .addCase(createDueAdjustment.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createDueAdjustment.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.adjustment = action.payload.adjustment;
                state.adjustments.unshift(action.payload.adjustment);
            })
            .addCase(createDueAdjustment.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get all due adjustments
            .addCase(getDueAdjustments.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getDueAdjustments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.adjustments = action.payload;
            })
            .addCase(getDueAdjustments.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get customer due adjustments
            .addCase(getCustomerDueAdjustments.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getCustomerDueAdjustments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.adjustments = action.payload.adjustments;
            })
            .addCase(getCustomerDueAdjustments.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset, clearAdjustment } = dueSlice.actions;
export default dueSlice.reducer;
