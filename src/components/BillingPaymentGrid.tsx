import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { Search, Download } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { transactionService } from '../services/transactionService';
import { useAuth } from '../store/useAuth';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface BillingRecord {
  date: string;
  document: string;
  number: string;
  service: string;
  order: string;
  currency: string;
  total: number;
  orderDetails?: {
    id: string;
    number: string;
    status: string;
  };
  paymentDetails?: {
    method: string;
    status: string;
  };
}

// Download Cell Renderer Component
const DownloadCellRenderer = (props: any) => {
  const documentUrl = props.data.document;
  
  const handleDownload = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  if (!documentUrl) {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <button
      onClick={handleDownload}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title="Download Document"
    >
      <Download className="w-4 h-4 text-blue-600 hover:text-blue-800" />
    </button>
  );
};

// Order Tooltip Component
const OrderTooltip = ({ orderDetails, paymentDetails, currency, amount }: {
  orderDetails?: { id: string; number: string; status: string };
  paymentDetails?: { method: string; status: string };
  currency: string;
  amount: number;
}) => {
  if (!orderDetails) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'cancelled':
        return 'text-red-600 dark:text-red-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatPaymentMethod = (method: string) => {
    switch (method.toLowerCase()) {
      case 'upi':
        return 'UPI';
      case 'credit_card':
        return 'Credit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'wallet':
        return 'Wallet';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 min-w-[250px] max-w-[300px]">
      <div className="space-y-2">
        <div className="border-b border-gray-100 dark:border-gray-700 pb-2">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Order Details</h4>
        </div>
        
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Order ID:</span>
            <span className="font-mono text-gray-900 dark:text-white">{orderDetails.number}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Status:</span>
            <span className={`font-medium ${getStatusColor(orderDetails.status)}`}>
              {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Amount:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {amount.toLocaleString('en-US', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              })}
            </span>
          </div>
          
          {paymentDetails && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Payment Method:</span>
                <span className="text-gray-900 dark:text-white">{formatPaymentMethod(paymentDetails.method)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Payment Status:</span>
                <span className={`font-medium ${getStatusColor(paymentDetails.status)}`}>
                  {paymentDetails.status.charAt(0).toUpperCase() + paymentDetails.status.slice(1)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Order Cell Renderer Component
const OrderCellRenderer = (props: any) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const cellRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const orderDetails = props.data.orderDetails;
  const paymentDetails = props.data.paymentDetails;
  const currency = props.data.currency;
  const amount = props.data.total;

  const handleMouseEnter = (event: React.MouseEvent) => {
    if (!orderDetails) return;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    setTooltipPosition({
      x: rect.left + scrollX + rect.width / 2,
      y: rect.top + scrollY - 10
    });
    
    // Add a small delay to prevent flickering
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    // Clear timeout if mouse leaves before delay
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowTooltip(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!orderDetails) {
    return <span className="text-gray-400">-</span>;
  }

  return (
    <>
      <div
        ref={cellRef}
        className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-mono text-xs truncate w-full h-full flex items-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title="Hover to view order details"
      >
        {orderDetails.number}
      </div>

      {showTooltip && createPortal(
        <div 
          className="order-tooltip animate-in"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <OrderTooltip
            orderDetails={orderDetails}
            paymentDetails={paymentDetails}
            currency={currency}
            amount={amount}
          />
        </div>,
        document.body
      )}
    </>
  );
};

const BillingPaymentGrid = () => {
  const { isDarkMode } = useTheme();
  const { userContext: user, idToken } = useAuth();

  // Component state
  const gridRef = useRef<AgGridReact>(null);
  const [searchText, setSearchText] = useState('');
  const [rowData, setRowData] = useState<BillingRecord[]>([]);
  const [filteredData, setFilteredData] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add CSS styles for total row
  useEffect(() => {
    const styleId = 'billing-grid-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .total-row-service {
          font-weight: bold !important;
          font-size: 14px !important;
          background-color: #f8fafc !important;
          color: #1f2937 !important;
          border-top: 2px solid #e5e7eb !important;
        }
        .total-row-amount {
          font-weight: bold !important;
          font-size: 15px !important;
          background-color: #f8fafc !important;
          color: #059669 !important;
          border-top: 2px solid #e5e7eb !important;
        }
        .ag-theme-alpine-dark .total-row-service,
        .ag-theme-alpine-dark .total-row-amount {
          background-color: #374151 !important;
          color: #10b981 !important;
        }
        .ag-theme-alpine-dark .total-row-service {
          color: #f9fafb !important;
        }
        
        /* Tooltip animation styles */
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -100%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -100%) scale(1); }
        }
        
        .animate-in {
          animation: fadeIn 0.2s ease-out;
        }
        
        /* Ensure tooltip appears above everything */
        .order-tooltip {
          z-index: 99999 !important;
          position: fixed !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);
  
  // Mobile responsive hook
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set user context for transactionService with id from localStorage (unchanged, but could be refactored to use API if needed)
  useEffect(() => {
    if (user && user.sub && user.email) {
      const actualUserId = localStorage.getItem(`auth0_${user.sub}`);
      if (actualUserId) {
        transactionService.setUserContext({
          id: actualUserId,
          email: user.email,
          name: user.name
        });
      }
    }
  }, [user]);




  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!idToken) {
          setError('ID token not found. Please authenticate.');
          setLoading(false);
          return;
        }
        // Pass idToken to transactionService (assumes it forwards to API layer)
        const result = await transactionService.getTransactions({}, { idToken });
        // Map Transaction[] to BillingRecord[]
        const records = result?.data?.records || [];

        const mapped = records.map((tx: any) => ({
          date: tx.date,
          document: tx.document?.downloadUrl || '',
          number: tx.id,
          service: tx.service?.name || 'Service',
          order: tx.order?.number || tx.order?.id || '',
          currency: tx.payment?.currency || 'INR',
          total: tx.payment?.amount || 0,
          orderDetails: tx.order ? {
            id: tx.order.id,
            number: tx.order.number,
            status: tx.order.status
          } : undefined,
          paymentDetails: tx.payment ? {
            method: tx.payment.method,
            status: tx.payment.status
          } : undefined
        }));
        setRowData(mapped);
        setFilteredData(mapped);
      } catch (err: any) {
        setError(err.message || 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [idToken]);

  // Filter data based on search text and date range
  useEffect(() => {
    let filtered = rowData;

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          value.toString().toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }

    setFilteredData(filtered);
  }, [rowData, searchText]);

  // Calculate total amount from filtered data
  const totalAmount = filteredData.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalCurrency = filteredData.length > 0 ? filteredData[0].currency : 'USD';

  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    flex: 1,
    minWidth: 80,
    suppressSizeToFit: false,
    cellStyle: { 
      fontSize: isMobile ? '13px' : '14px',
      padding: isMobile ? '4px 8px' : '6px 12px'
    },
    headerClass: isMobile ? 'mobile-header' : ''
  };

  const [columnDefs] = useState<ColDef[]>([
    { 
      field: 'date', 
      headerName: 'Date',
      minWidth: 110,
      width: 130,
      flex: 0,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => {
        // Return empty string for total row or empty dates
        if (!params.value || params.node?.rowPinned) {
          return '';
        }
        return new Date(params.value).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: '2-digit'
        });
      },
      filterParams: {
        comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
          const dateAsString = cellValue;
          const dateParts = dateAsString.split('-');
          const cellDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
          if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
            return 0;
          }
          if (cellDate < filterLocalDateAtMidnight) {
            return -1;
          }
          if (cellDate > filterLocalDateAtMidnight) {
            return 1;
          }
          return 0;
        }
      }
    },
    { 
      field: 'order', 
      headerName: 'Order',
      minWidth: 80,
      width: 120,
      flex: 0,
      hide: false, 
      cellStyle: { fontSize: '12px' },
      cellRenderer: OrderCellRenderer,
      sortable: true,
      filter: true
    },
    { 
      field: 'service', 
      headerName: 'Service',
      minWidth: 120,
      flex: 2,
      cellStyle: { fontSize: '13px' },
      cellClass: (params) => {
        return params.node.rowPinned ? 'total-row-service' : '';
      },
      tooltipField: 'service'
    },
    { 
      field: 'total', 
      headerName: 'Amount',
      minWidth: 100,
      width: 120,
      flex: 0,
      filter: 'agNumberColumnFilter',
      cellStyle: { fontWeight: 'bold', textAlign: 'right' },
      cellClass: (params) => {
        return params.node.rowPinned ? 'total-row-amount' : '';
      },
      valueFormatter: (params) => {
        const currency = params.data?.currency || 'INR';
        return params.value.toLocaleString('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });
      }
    },
    { 
      field: 'document', 
      headerName: 'Document',
      minWidth: 90,
      width: 100,
      flex: 0,
      cellStyle: { textAlign: 'center', padding: '8px' },
      cellRenderer: DownloadCellRenderer,
      sortable: false,
      filter: false
    },
    { 
      field: 'number', 
      headerName: 'ID',
      minWidth: 90,
      width: 110,
      flex: 0,
      hide: true, // Hidden by default
      cellStyle: { fontSize: '12px', color: '#666' },
      valueFormatter: (params) => {
        // Show only last 8 characters of transaction ID
        return params.value ? `...${params.value.slice(-8)}` : '';
      },
      tooltipField: 'number'
    },
  
    { 
      field: 'currency', 
      headerName: 'Curr',
      minWidth: 60,
      width: 70,
      flex: 0,
      hide: true, // Hidden by default on mobile
      cellStyle: { fontSize: '11px' }
    }
  ]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();

    const handleResize = () => {
      setTimeout(() => {
        params.api.sizeColumnsToFit();
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onSearchChange = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  // Your existing rowData...

  return (
    <div className="w-full">
      <div className="mb-4 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search transactions..."
            className="pl-10 pr-4 py-3 border rounded-lg w-full text-sm sm:text-base dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        
        
        {/* Results count */}
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
            {filteredData.length} of {rowData.length} transactions
        </div>
      </div>

      {error && (
        <div className="text-red-600 mb-2">{error}</div>
      )}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : (
        <div className={`billing-grid-responsive ${isDarkMode ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'} w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700`} 
             style={{ 
               height: isMobile ? 'calc(100vh - 450px)' : 'calc(100vh - 400px)',
               minHeight: '300px'
             }}>
          <AgGridReact
            ref={gridRef}
            rowData={filteredData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            pagination={true}
            paginationPageSize={isMobile ? 10 : 10}
            paginationPageSizeSelector={isMobile ? [5, 10, 15] : [5, 10, 20, 50]}
            suppressMovableColumns={true}
            animateRows={true}
            theme="legacy"
            enableCellTextSelection={true}
            ensureDomOrder={true}
            suppressColumnVirtualisation={false}
            suppressMenuHide={false}
            overlayNoRowsTemplate="<div class='flex flex-col items-center justify-center p-8'><span class='text-gray-500 text-lg mb-2'>📄</span><span class='text-gray-500'>No transactions found</span></div>"
            rowHeight={isMobile ? 50 : 35}
            headerHeight={isMobile ? 45 : 35}
            suppressHorizontalScroll={false}
            alwaysShowHorizontalScroll={false}
            
            tooltipShowDelay={500}
            pinnedBottomRowData={[
              {
                date: '',
                service: 'TOTAL',
                total: totalAmount,
                currency: totalCurrency,
                document: '',
                number: '',
                order: '',
                orderDetails: undefined,
                paymentDetails: undefined
              }
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default BillingPaymentGrid;