const FormInput = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    placeholder = '',
    required = false,
    error = '',
    disabled = false,
    className = '',
    icon = null,
    ...props
}) => {
    return (
        <div className={`${className}`}>
            {label && (
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2 border ${error ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition`}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default FormInput;
