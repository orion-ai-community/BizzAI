import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const API_URL = "/api/expenses";

// Get token from state
const getConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const initialState = {
  expenses: [],
  expense: null,
  summary: null,
  analytics: null,
  recurringExpenses: [],
  pagination: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
  budgetWarnings: [],
};

// Get all expenses with filters
export const getAllExpenses = createAsyncThunk(
  'expense/getAll',
  async (filters = {}, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `${API_URL}?${queryParams}` : API_URL;
      const response = await api.get(url, getConfig(token));
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

// Get expense summary
export const getExpenseSummary = createAsyncThunk(
  'expense/getSummary',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.get(`${API_URL}/summary`, getConfig(token));
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

// Get expense analytics
export const getExpenseAnalytics = createAsyncThunk(
  'expense/getAnalytics',
  async (period = 'year', thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.get(`${API_URL}/analytics?period=${period}`, getConfig(token));
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

// Get recurring expenses
export const getRecurringExpenses = createAsyncThunk(
  'expense/getRecurring',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.get(`${API_URL}/recurring`, getConfig(token));
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

// Create expense
export const createExpense = createAsyncThunk(
  'expense/create',
  async (expenseData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.post(API_URL, expenseData, getConfig(token));
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

// Get expense by ID
export const getExpenseById = createAsyncThunk(
  'expense/getById',
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

// Update expense
export const updateExpense = createAsyncThunk(
  'expense/update',
  async ({ id, expenseData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.put(`${API_URL}/${id}`, expenseData, getConfig(token));
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

// Delete expense
export const deleteExpense = createAsyncThunk(
  'expense/delete',
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

// Restore expense
export const restoreExpense = createAsyncThunk(
  'expense/restore',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.post(`${API_URL}/${id}/restore`, {}, getConfig(token));
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

// Bulk delete expenses
export const bulkDeleteExpenses = createAsyncThunk(
  'expense/bulkDelete',
  async (expenseIds, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.post(`${API_URL}/bulk-delete`, { expenseIds }, getConfig(token));
      return { expenseIds, ...response.data };
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Bulk update category
export const bulkUpdateCategory = createAsyncThunk(
  'expense/bulkUpdateCategory',
  async ({ expenseIds, newCategory }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.put(
        `${API_URL}/bulk-update-category`,
        { expenseIds, newCategory },
        getConfig(token)
      );
      return { expenseIds, newCategory, ...response.data };
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Export expenses
export const exportExpenses = createAsyncThunk(
  'expense/export',
  async ({ format, filters = {} }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const queryParams = new URLSearchParams({ format, ...filters }).toString();
      const response = await api.get(`${API_URL}/export?${queryParams}`, {
        ...getConfig(token),
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const extensions = { pdf: 'pdf', excel: 'xlsx', csv: 'csv' };
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `expenses_${timestamp}.${extensions[format] || 'pdf'}`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, format };
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const expenseSlice = createSlice({
  name: 'expense',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
      state.budgetWarnings = [];
    },
    clearExpense: (state) => {
      state.expense = null;
      state.isSuccess = false;
    },
    clearBudgetWarnings: (state) => {
      state.budgetWarnings = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all expenses
      .addCase(getAllExpenses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllExpenses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.expenses = action.payload.expenses || action.payload;
        state.pagination = action.payload.pagination || null;
        state.summary = action.payload.summary || null;
      })
      .addCase(getAllExpenses.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get expense summary
      .addCase(getExpenseSummary.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getExpenseSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.summary = action.payload;
      })
      .addCase(getExpenseSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get expense analytics
      .addCase(getExpenseAnalytics.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getExpenseAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.analytics = action.payload;
      })
      .addCase(getExpenseAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get recurring expenses
      .addCase(getRecurringExpenses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getRecurringExpenses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.recurringExpenses = action.payload.recurring || [];
      })
      .addCase(getRecurringExpenses.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Create expense
      .addCase(createExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.budgetWarnings = action.payload.budgetWarnings || [];
        // Don't add to expenses array - will refetch with filters
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get expense by ID
      .addCase(getExpenseById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getExpenseById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.expense = action.payload.expense || action.payload;
      })
      .addCase(getExpenseById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update expense
      .addCase(updateExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Will refetch with filters
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete expense
      .addCase(deleteExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Will refetch with filters
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Restore expense
      .addCase(restoreExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restoreExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Will refetch with filters
      })
      .addCase(restoreExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Bulk delete
      .addCase(bulkDeleteExpenses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(bulkDeleteExpenses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Will refetch with filters
      })
      .addCase(bulkDeleteExpenses.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Bulk update category
      .addCase(bulkUpdateCategory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(bulkUpdateCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Will refetch with filters
      })
      .addCase(bulkUpdateCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Export expenses
      .addCase(exportExpenses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(exportExpenses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(exportExpenses.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearExpense, clearBudgetWarnings } = expenseSlice.actions;
export default expenseSlice.reducer;