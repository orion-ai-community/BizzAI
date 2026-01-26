import { useState, useEffect } from 'react';

/**
 * Custom hook for auto-saving form data to localStorage
 * Prevents data loss when navigating between pages
 * 
 * @param {string} key - Unique localStorage key for this form
 * @param {object} initialData - Initial form data structure
 * @param {object} options - Configuration options
 * @returns {[data, setData, clearDraft, hasDraft]} - Form data, setter, clear function, and draft status
 */
const useDraftSave = (key, initialData, options = {}) => {
    const { autoSave = true, debounceMs = 500 } = options;

    // Initialize state from localStorage or use initial data
    const [data, setData] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with initial data to handle schema changes
                return { ...initialData, ...parsed };
            }
        } catch (error) {
            console.error(`Error loading draft from ${key}:`, error);
        }
        return initialData;
    });

    const [hasDraft, setHasDraft] = useState(() => {
        return localStorage.getItem(key) !== null;
    });

    // Auto-save to localStorage with debouncing
    useEffect(() => {
        if (!autoSave) return;

        const timeoutId = setTimeout(() => {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                setHasDraft(true);
            } catch (error) {
                console.error(`Error saving draft to ${key}:`, error);
            }
        }, debounceMs);

        return () => clearTimeout(timeoutId);
    }, [data, key, autoSave, debounceMs]);

    // Clear draft from localStorage
    const clearDraft = () => {
        try {
            localStorage.removeItem(key);
            setHasDraft(false);
        } catch (error) {
            console.error(`Error clearing draft from ${key}:`, error);
        }
    };

    // Reset to initial data
    const resetToInitial = () => {
        setData(initialData);
        clearDraft();
    };

    return [data, setData, clearDraft, hasDraft, resetToInitial];
};

export default useDraftSave;
