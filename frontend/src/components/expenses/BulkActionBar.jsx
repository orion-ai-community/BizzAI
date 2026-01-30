import { useState } from 'react';
import { FiTrash2, FiX, FiTag } from 'react-icons/fi';

const BulkActionBar = ({ selectedCount, onDelete, onClear, categories, onUpdateCategory }) => {
    const [showCategoryMenu, setShowCategoryMenu] = useState(false);

    const handleCategorySelect = (categoryName) => {
        onUpdateCategory(categoryName);
        setShowCategoryMenu(false);
    };

    return (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-indigo-900">
                        {selectedCount} {selectedCount === 1 ? 'expense' : 'expenses'} selected
                    </span>

                    <div className="flex items-center gap-2">
                        {/* Update Category */}
                        <div className="relative">
                            <button
                                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"
                            >
                                <FiTag className="w-4 h-4" />
                                Update Category
                            </button>

                            {showCategoryMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowCategoryMenu(false)}
                                    />
                                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-64 overflow-y-auto">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat._id}
                                                onClick={() => handleCategorySelect(cat.name)}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                                            >
                                                <span className="mr-2">{cat.icon}</span>
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Delete */}
                        <button
                            onClick={onDelete}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <FiTrash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Clear Selection */}
                <button
                    onClick={onClear}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-700 hover:text-indigo-900 transition-colors"
                >
                    <FiX className="w-4 h-4" />
                    Clear Selection
                </button>
            </div>
        </div>
    );
};

export default BulkActionBar;
