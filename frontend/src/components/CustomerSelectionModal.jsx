import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllCustomers } from '../redux/slices/customerSlice';
import Modal from './Modal';

const CustomerSelectionModal = ({ isOpen, onClose, onSelect }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { customers, isLoading } = useSelector((state) => state.customers);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            dispatch(getAllCustomers());
        }
    }, [isOpen, dispatch]);

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Select Customer"
            size="lg"
        >
            <div className="space-y-4">
                {/* Header Actions */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-[rgb(var(--color-border))] bg-white dark:bg-[rgb(var(--color-input))] text-gray-900 dark:text-[rgb(var(--color-text))] placeholder:text-gray-400 dark:placeholder:text-[rgb(var(--color-placeholder))] rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[rgb(var(--color-primary))]"
                        />
                    </div>
                    <button
                        onClick={() => {
                            onClose();
                            navigate('/customers/add');
                        }}
                        className="px-4 py-2 bg-indigo-600 dark:bg-[rgb(var(--color-primary))] text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-primary-hover))] whitespace-nowrap"
                    >
                        + Add New Customer
                    </button>
                </div>

                {/* Customer List */}
                <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-[rgb(var(--color-primary))] mx-auto"></div>
                            <p className="mt-2 text-gray-500 dark:text-[rgb(var(--color-text-secondary))]">Loading customers...</p>
                        </div>
                    ) : filteredCustomers.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredCustomers.map((customer) => (
                                <div
                                    key={customer._id}
                                    onClick={() => {
                                        onSelect(customer);
                                        onClose();
                                    }}
                                    className="p-4 bg-gray-50 dark:bg-[rgb(var(--color-input))] border border-gray-200 dark:border-[rgb(var(--color-border))] rounded-lg hover:bg-indigo-50 dark:hover:bg-[rgb(var(--color-card))] hover:border-indigo-300 dark:hover:border-[rgb(var(--color-primary))] cursor-pointer transition flex justify-between items-center group shadow-sm"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-[rgb(var(--color-text))] group-hover:text-indigo-700 dark:group-hover:text-[rgb(var(--color-primary))]">{customer.name}</p>
                                        <div className="text-sm text-gray-500 dark:text-[rgb(var(--color-text-secondary))] space-x-4">
                                            <span>{customer.phone}</span>
                                            <span>{customer.email}</span>
                                        </div>
                                    </div>
                                    <div className="text-indigo-600 dark:text-[rgb(var(--color-primary))] opacity-0 group-hover:opacity-100 font-medium text-sm">
                                        Select
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-[rgb(var(--color-text-secondary))]">
                            {searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default CustomerSelectionModal;
