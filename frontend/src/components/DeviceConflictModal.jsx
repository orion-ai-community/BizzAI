import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { forceLogout, login, reset } from '../redux/slices/authSlice';

const DeviceConflictModal = ({ email, password, onClose }) => {
    const dispatch = useDispatch();
    const { isLoading } = useSelector((state) => state.auth);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleForceLogout = async () => {
        if (isProcessing) return; // Prevent multiple calls

        setIsProcessing(true);
        try {
            // First, force logout from previous device
            await dispatch(forceLogout({ email, password })).unwrap();

            // If successful, automatically attempt login again
            await dispatch(login({ email, password })).unwrap();

            // Close modal on success
            onClose();
        } catch {
            // Error will be handled by authSlice state
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        dispatch(reset());
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-2xl shadow-2xl max-w-md w-full p-6 border dark:border-[rgb(var(--color-border))]">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                        <svg
                            className="w-8 h-8 text-yellow-600 dark:text-yellow-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-center text-gray-900 dark:text-[rgb(var(--color-text))] mb-2">
                    Device Already Logged In
                </h2>

                {/* Message */}
                <p className="text-center text-gray-600 dark:text-[rgb(var(--color-text-secondary))] mb-6">
                    This account is currently active on another device.
                </p>



                {/* Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleForceLogout}
                        disabled={isLoading || isProcessing}
                        className="w-full bg-indigo-600 dark:bg-[rgb(var(--color-primary))] text-white py-3 rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-primary-hover))] focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2 dark:focus:ring-offset-[rgb(var(--color-card))] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading || isProcessing ? (
                            <span className="flex items-center justify-center">
                                <svg
                                    className="animate-spin h-5 w-5 mr-2"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Logging out previous device...
                            </span>
                        ) : (
                            'Log out from previous device and continue'
                        )}
                    </button>

                    <button
                        onClick={handleCancel}
                        disabled={isLoading || isProcessing}
                        className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-[rgb(var(--color-card))] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeviceConflictModal;
