import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllSuppliers, reset } from '../redux/slices/supplierSlice';
import Modal from './Modal';

const SupplierSelectionModal = ({ isOpen, onClose, onSelectSupplier }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { suppliers, isLoading } = useSelector((state) => state.suppliers);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      dispatch(getAllSuppliers());
    }
    return () => {
      dispatch(reset());
    };
  }, [dispatch, isOpen]);

  const filteredSuppliers = suppliers
    .filter(supplier => supplier.status === 'active')
    .filter((supplier) =>
      supplier.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactNo.includes(searchTerm)
    );

  const handleSelect = (supplier) => {
    onSelectSupplier(supplier);
    onClose();
    setSearchTerm('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Supplier"
      size="lg"
    >
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by business name, contact person, or contact number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[rgb(var(--color-border))] bg-white dark:bg-[rgb(var(--color-input))] text-gray-900 dark:text-[rgb(var(--color-text))] placeholder:text-gray-400 dark:placeholder:text-[rgb(var(--color-placeholder))] rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[rgb(var(--color-primary))]"
            />
          </div>
          <button
            onClick={() => {
              onClose();
              navigate('/suppliers/add');
            }}
            className="px-4 py-2 bg-indigo-600 dark:bg-[rgb(var(--color-primary))] text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-primary-hover))] whitespace-nowrap"
          >
            + Add New Supplier
          </button>
        </div>

        {/* Supplier List */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-[rgb(var(--color-primary))]"></div>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-[rgb(var(--color-text-secondary))]">
                {searchTerm ? 'No suppliers found matching your search' : 'No suppliers found'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier._id}
                  onClick={() => handleSelect(supplier)}
                  className="p-4 bg-gray-50 dark:bg-[rgb(var(--color-input))] border border-gray-200 dark:border-[rgb(var(--color-border))] rounded-lg hover:bg-indigo-50 dark:hover:bg-[rgb(var(--color-card))] hover:border-indigo-300 dark:hover:border-[rgb(var(--color-primary))] cursor-pointer transition flex justify-between items-center group shadow-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-[rgb(var(--color-text))] group-hover:text-indigo-700 dark:group-hover:text-[rgb(var(--color-primary))]">{supplier.businessName}</p>
                    <div className="text-sm text-gray-500 dark:text-[rgb(var(--color-text-secondary))] space-x-4">
                      <span>{supplier.contactPersonName}</span>
                      <span>{supplier.contactNo}</span>
                    </div>
                  </div>
                  <div className="text-indigo-600 dark:text-[rgb(var(--color-primary))] opacity-0 group-hover:opacity-100 font-medium text-sm">
                    Select
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SupplierSelectionModal;