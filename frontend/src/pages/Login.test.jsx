import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../redux/slices/authSlice';
import Login from './Login';

// Create a mock store for testing
const createMockStore = (preloadedState) => configureStore({
    reducer: {
        auth: authReducer,
    },
    preloadedState,
});

describe('Login Component', () => {
    it('renders login form', () => {
        const store = createMockStore({
            auth: {
                user: null,
                isLoading: false,
                isError: false,
                isSuccess: false,
                message: '',
            },
        });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <Login />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });
});
