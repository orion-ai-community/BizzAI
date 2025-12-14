const PageHeader = ({
    title,
    description,
    actions = null,
    backButton = null,
    breadcrumbs = null
}) => {
    return (
        <div className="mb-8">
            {backButton && (
                <div className="mb-4">
                    {backButton}
                </div>
            )}

            {breadcrumbs && (
                <nav className="flex mb-4" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-3">
                        {breadcrumbs.map((crumb, index) => (
                            <li key={index} className="inline-flex items-center">
                                {index > 0 && (
                                    <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {crumb.link ? (
                                    <a href={crumb.link} className="text-gray-600 hover:text-indigo-600">
                                        {crumb.label}
                                    </a>
                                ) : (
                                    <span className="text-gray-900 font-medium">{crumb.label}</span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                    {description && <p className="text-gray-600">{description}</p>}
                </div>
                {actions && (
                    <div className="flex flex-wrap gap-3">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
