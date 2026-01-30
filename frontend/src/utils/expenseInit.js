/**
 * Expense Module Initialization Script
 * 
 * This script should be run once per user to seed default expense categories.
 * It can be integrated into the user registration flow or run manually.
 */

import api from '../services/api';

/**
 * Seed default expense categories for the current user
 * @returns {Promise<Object>} Response with created categories
 */
export const seedDefaultExpenseCategories = async () => {
    try {
        const response = await api.post('/api/expense-categories/seed-defaults');
        console.log('✅ Default expense categories seeded successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Failed to seed default categories:', error.response?.data?.message || error.message);
        throw error;
    }
};

/**
 * Check if user has any expense categories
 * @returns {Promise<boolean>} True if categories exist
 */
export const hasExpenseCategories = async () => {
    try {
        const response = await api.get('/api/expense-categories');
        return response.data && response.data.length > 0;
    } catch (error) {
        console.error('❌ Failed to check categories:', error.response?.data?.message || error.message);
        return false;
    }
};

/**
 * Initialize expense module for user (call this on first login or app init)
 */
export const initializeExpenseModule = async () => {
    try {
        const categoriesExist = await hasExpenseCategories();

        if (!categoriesExist) {
            console.log('📦 No expense categories found. Seeding defaults...');
            await seedDefaultExpenseCategories();
            console.log('✅ Expense module initialized successfully');
            return { initialized: true, seeded: true };
        } else {
            console.log('✅ Expense categories already exist');
            return { initialized: true, seeded: false };
        }
    } catch (error) {
        console.error('❌ Failed to initialize expense module:', error);
        throw error;
    }
};

export default {
    seedDefaultExpenseCategories,
    hasExpenseCategories,
    initializeExpenseModule,
};
