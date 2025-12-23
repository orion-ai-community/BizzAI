const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    footer = null
}) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-full mx-4'
    };

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-2xl border dark:border-[rgb(var(--color-border))] ${sizeClasses[size]} w-full max-h-[90vh] flex flex-col`}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[rgb(var(--color-border))]">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">{title}</h3>
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 dark:text-[rgb(var(--color-text-muted))] hover:text-gray-600 dark:hover:text-[rgb(var(--color-text))] transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="border-t border-gray-200 dark:border-[rgb(var(--color-border))] p-6">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
