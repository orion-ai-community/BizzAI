const StatsCard = ({
    title,
    value,
    icon,
    iconBgColor = 'bg-blue-100',
    iconColor = 'text-blue-600',
    trend = null,
    trendUp = true,
    onClick = null
}) => {
    return (
        <div
            className={`bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-6 ${onClick ? 'cursor-pointer hover:shadow-md dark:hover:shadow-xl transition' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-gray-500 dark:text-[rgb(var(--color-text-secondary))] text-sm font-medium mb-2">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">{value}</p>
                    {trend && (
                        <div className={`flex items-center mt-2 text-sm ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={trendUp ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"}
                                />
                            </svg>
                            <span>{trend}</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 ${iconBgColor} dark:bg-opacity-20 rounded-lg`}>
                    <div className={`w-8 h-8 ${iconColor}`}>
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
