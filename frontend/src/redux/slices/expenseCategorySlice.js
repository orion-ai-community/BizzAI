import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const API_URL = "/api/expense-categories";

// Get token from state
const getConfig = (token) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

const initialState = {
    categories: [],
    category: null,
    budgetUtilization: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

// Get all categories
export const getAllCategories = createAsyncThunk(
    'expenseCategory/getAll',
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

// Get category by ID
export const getCategoryById = createAsyncThunk(
    'expenseCategory/getById',
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

// Create category
export const createCategory = createAsyncThunk(
    'expenseCategory/create',
    async (categoryData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const response = await api.post(API_URL, categoryData, getConfig(token));
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

// Update category
export const updateCategory = createAsyncThunk(
    'expenseCategory/update',
    async ({ id, categoryData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const response = await api.put(`${API_URL}/${id}`, categoryData, getConfig(token));
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

// Delete category
export const deleteCategory = createAsyncThunk(
    'expenseCategory/delete',
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

// Get category budget status
export const getCategoryBudgetStatus = createAsyncThunk(
    'expenseCategory/getBudgetStatus',
    async (id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const response = await api.get(`${API_URL}/${id}/budget-status`, getConfig(token));
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

// Get all budget utilization
export const getAllBudgetUtilization = createAsyncThunk(
    'expenseCategory/getAllBudgetUtilization',
    async (period = 'monthly', thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const response = await api.get(`${API_URL}/budget-utilization?period=${period}`, getConfig(token));
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

// Seed default categories
export const seedDefaultCategories = createAsyncThunk(
    'expenseCategory/seedDefaults',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const response = await api.post(`${API_URL}/seed-defaults`, {}, getConfig(token));
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

export const expenseCategorySlice = createSlice({
    name: 'expenseCategory',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearCategory: (state) => {
            state.category = null;
            state.isSuccess = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // Get all categories
            .addCase(getAllCategories.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllCategories.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.categories = action.payload;
            })
            .addCase(getAllCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get category by ID
            .addCase(getCategoryById.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getCategoryById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.category = action.payload;
            })
            .addCase(getCategoryById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Create category
            .addCase(createCategory.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createCategory.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.categories.push(action.payload);
            })
            .addCase(createCategory.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update category
            .addCase(updateCategory.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateCategory.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.categories.findIndex(cat => cat._id === action.payload._id);
                if (index !== -1) {
                    state.categories[index] = action.payload;
                }
            })
            .addCase(updateCategory.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Delete category
            .addCase(deleteCategory.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.categories = state.categories.filter(cat => cat._id !== action.payload);
            })
            .addCase(deleteCategory.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get category budget status
            .addCase(getCategoryBudgetStatus.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getCategoryBudgetStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                // Store in category object
            })
            .addCase(getCategoryBudgetStatus.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get all budget utilization
            .addCase(getAllBudgetUtilization.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllBudgetUtilization.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.budgetUtilization = action.payload;
            })
            .addCase(getAllBudgetUtilization.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Seed default categories
            .addCase(seedDefaultCategories.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(seedDefaultCategories.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.categories = action.payload.categories || [];
            })
            .addCase(seedDefaultCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset, clearCategory } = expenseCategorySlice.actions;
export default expenseCategorySlice.reducer;
