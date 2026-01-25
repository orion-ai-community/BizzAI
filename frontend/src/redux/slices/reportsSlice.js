import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const API_URL = "/api/reports";

// Get token from state
const getConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const initialState = {
  salesReport: null,
  stockReport: null,
  customerReport: null,
  dashboardStats: null,
  // New Sales Report State
  salesData: [],
  salesSummary: null,
  salesCharts: null,
  salesFilters: {
    dateFilter: 'this_month',
    customStartDate: null,
    customEndDate: null,
    invoiceNo: '',
    paymentStatus: [],
    paymentMethod: [],
    customerId: null,
  },
  salesPagination: {
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 50,
  },
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Get sales report
export const getSalesReport = createAsyncThunk(
  'reports/getSales',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.get(`${API_URL}/sales`, getConfig(token));
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

// Get stock report
export const getStockReport = createAsyncThunk(
  'reports/getStock',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.get(`${API_URL}/stock`, getConfig(token));
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

// Get customer report
export const getCustomerReport = createAsyncThunk(
  'reports/getCustomers',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.get(`${API_URL}/customers`, getConfig(token));
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

// Get dashboard stats
export const getDashboardStats = createAsyncThunk(
  'reports/getDashboardStats',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await api.get(`${API_URL}/dashboard-stats`, getConfig(token));
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

// Get sales report data with filters
export const getSalesReportData = createAsyncThunk(
  'reports/getSalesData',
  async ({ filters, page, limit }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const params = new URLSearchParams({
        dateFilter: filters.dateFilter || 'this_month',
        page: page || 1,
        limit: limit || 50,
      });

      if (filters.customStartDate) params.append('startDate', filters.customStartDate);
      if (filters.customEndDate) params.append('endDate', filters.customEndDate);
      if (filters.invoiceNo) params.append('invoiceNo', filters.invoiceNo);
      if (filters.paymentStatus?.length > 0) params.append('paymentStatus', filters.paymentStatus.join(','));
      if (filters.paymentMethod?.length > 0) params.append('paymentMethod', filters.paymentMethod.join(','));
      if (filters.customerId) params.append('customerId', filters.customerId);

      const response = await api.get(`${API_URL}/sales/data?${params.toString()}`, getConfig(token));
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

// Get sales report summary
export const getSalesReportSummary = createAsyncThunk(
  'reports/getSalesSummary',
  async (filters, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const params = new URLSearchParams({
        dateFilter: filters.dateFilter || 'this_month',
      });

      if (filters.customStartDate) params.append('startDate', filters.customStartDate);
      if (filters.customEndDate) params.append('endDate', filters.customEndDate);
      if (filters.invoiceNo) params.append('invoiceNo', filters.invoiceNo);
      if (filters.paymentStatus?.length > 0) params.append('paymentStatus', filters.paymentStatus.join(','));
      if (filters.paymentMethod?.length > 0) params.append('paymentMethod', filters.paymentMethod.join(','));
      if (filters.customerId) params.append('customerId', filters.customerId);

      const response = await api.get(`${API_URL}/sales/summary?${params.toString()}`, getConfig(token));
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

// Get sales report charts
export const getSalesReportCharts = createAsyncThunk(
  'reports/getSalesCharts',
  async (filters, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const params = new URLSearchParams({
        dateFilter: filters.dateFilter || 'this_month',
      });

      if (filters.customStartDate) params.append('startDate', filters.customStartDate);
      if (filters.customEndDate) params.append('endDate', filters.customEndDate);
      if (filters.invoiceNo) params.append('invoiceNo', filters.invoiceNo);
      if (filters.paymentStatus?.length > 0) params.append('paymentStatus', filters.paymentStatus.join(','));
      if (filters.paymentMethod?.length > 0) params.append('paymentMethod', filters.paymentMethod.join(','));
      if (filters.customerId) params.append('customerId', filters.customerId);

      const response = await api.get(`${API_URL}/sales/charts?${params.toString()}`, getConfig(token));
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

export const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    updateSalesFilters: (state, action) => {
      state.salesFilters = { ...state.salesFilters, ...action.payload };
    },
    resetSalesFilters: (state) => {
      state.salesFilters = initialState.salesFilters;
      state.salesPagination = initialState.salesPagination;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get sales report
      .addCase(getSalesReport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSalesReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.salesReport = action.payload;
      })
      .addCase(getSalesReport.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get stock report
      .addCase(getStockReport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStockReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.stockReport = action.payload;
      })
      .addCase(getStockReport.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get customer report
      .addCase(getCustomerReport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCustomerReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.customerReport = action.payload;
      })
      .addCase(getCustomerReport.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get dashboard stats
      .addCase(getDashboardStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.dashboardStats = action.payload;
      })
      .addCase(getDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get sales report data
      .addCase(getSalesReportData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSalesReportData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.salesData = action.payload.data;
        state.salesPagination = action.payload.pagination;
      })
      .addCase(getSalesReportData.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get sales report summary
      .addCase(getSalesReportSummary.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSalesReportSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.salesSummary = action.payload;
      })
      .addCase(getSalesReportSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get sales report charts
      .addCase(getSalesReportCharts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSalesReportCharts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.salesCharts = action.payload;
      })
      .addCase(getSalesReportCharts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, updateSalesFilters, resetSalesFilters } = reportsSlice.actions;
export default reportsSlice.reducer;
