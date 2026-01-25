const handleExport = async (format) => {
    if (exportLoading) return;

    setExportLoading(true);
    const toastId = toast.loading(`Generating ${format.toUpperCase()} export...`);

    try {
        const params = {
            dateFilter: salesFilters.dateFilter || 'this_month',
            format,
        };

        if (salesFilters.customStartDate) params.startDate = salesFilters.customStartDate;
        if (salesFilters.customEndDate) params.endDate = salesFilters.customEndDate;
        if (salesFilters.invoiceNo) params.invoiceNo = salesFilters.invoiceNo;
        if (salesFilters.paymentStatus?.length > 0) params.paymentStatus = salesFilters.paymentStatus.join(',');
        if (salesFilters.paymentMethod?.length > 0) params.paymentMethod = salesFilters.paymentMethod.join(',');
        if (salesFilters.customerId) params.customerId = salesFilters.customerId;
        if (salesFilters.itemCategory) params.itemCategory = salesFilters.itemCategory;
        if (salesFilters.itemSku) params.itemSku = salesFilters.itemSku;

        // Use axios api instance which handles auth automatically
        const response = await api.get('/api/reports/sales/export', {
            params,
            responseType: 'blob', // Important for file download
        });

        const blob = response.data;

        if (blob.size === 0) {
            throw new Error('Export file is empty. Please try again.');
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);

        toast.update(toastId, {
            render: `${format.toUpperCase()} exported successfully!`,
            type: 'success',
            isLoading: false,
            autoClose: 3000,
        });
    } catch (error) {
        console.error('Export error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to export report. Please try again.';
        toast.update(toastId, {
            render: errorMessage,
            type: 'error',
            isLoading: false,
            autoClose: 5000,
        });
    } finally {
        setExportLoading(false);
    }
};
