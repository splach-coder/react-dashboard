import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, 
  Search,
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter 
} from 'lucide-react';
import { getMasterRecords } from '../../api/api';

const StatusFilterOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'complete', label: 'Complete (Saldo 0)', color: 'text-success' },
  { value: 'incomplete', label: 'Incomplete (Saldo > 0)', color: 'text-error' },
  { value: 'unknown', label: 'Unknown', color: 'text-warning' },
];

const ArrivalsTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // NOUVEL ÉTAT DE FILTRE
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();
  const rowsPerPage = 8;

  // ✨ React Query - Automatic caching, loading, error handling
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['arrivals'],
    queryFn: getMasterRecords,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const arrivals = data?.records || [];
  
  // Get status based on saldo
  const getStatus = (saldo) => {
    if (saldo === 0) {
      return { 
        label: 'Complete', 
        value: 'complete', // Added value for filtering
        color: 'success',
        icon: CheckCircle
      };
    } else if (saldo > 0) {
      return { 
        label: 'Incomplete', 
        value: 'incomplete', // Added value for filtering
        color: 'error',
        icon: XCircle
      };
    } else {
      return { 
        label: 'Unknown', 
        value: 'unknown', // Added value for filtering
        color: 'warning',
        icon: AlertCircle
      };
    }
  };

  // Filter logic (UPDATED)
  const filteredArrivals = arrivals.filter(arrival => {
    const searchLower = searchTerm.toLowerCase();
    
    // 1. Filter by Search Term
    const matchesSearch = (
      arrival.MRN?.toLowerCase().includes(searchLower) ||
      arrival.COMMERCIALREFERENCE?.toLowerCase().includes(searchLower) ||
      arrival.DECLARATIONID?.toString().includes(searchLower)
    );
    
    if (!matchesSearch) return false;

    // 2. Filter by Status
    const status = getStatus(arrival.saldo);
    if (statusFilter === 'all') {
      return true;
    }
    
    return status.value === statusFilter;
  });

  // Sort: Errors first (saldo !== 0), then by ID descending
  const sortedArrivals = [...filteredArrivals].sort((a, b) => {
    // First, sort by error status (saldo !== 0 comes first)
    const aHasError = a.saldo !== 0 && a.saldo !== undefined;
    const bHasError = b.saldo !== 0 && b.saldo !== undefined;
    
    if (aHasError && !bHasError) return -1;
    if (!aHasError && bHasError) return 1;
    
    // Then sort by ID descending
    const aId = a.DECLARATIONID || 0;
    const bId = b.DECLARATIONID || 0;
    return bId - aId;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedArrivals.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedArrivals = sortedArrivals.slice(startIndex, endIndex);

  // Reset to page 1 when search or filter changes (UPDATED)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]); 

  // Statistics
  const stats = {
    total: arrivals.length,
    complete: arrivals.filter(a => a.saldo === 0).length,
    incomplete: arrivals.filter(a => a.saldo !== 0 && a.saldo !== undefined).length,
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const handleRowClick = (mrn) => {
    navigate(`/arrivals/outbounds/${mrn}`);
  };

  // Manual refresh
  const handleRefresh = () => {
    refetch();
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text || '');
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-lg">Loading arrivals data...</p>
          <p className="text-text-muted text-sm mt-2">Fetching from server...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center max-w-md bg-surface p-8 border border-border">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-text-primary mb-2">Error Loading Data</h2>
          <p className="text-text-muted mb-6">{error.message}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-2 bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-text-primary mb-1">
                Arrivals
              </h1>
              <p className="text-text-muted">
                Manage customs declarations and track shipment status
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2 border border-border bg-surface hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-8 py-4 px-6 bg-surface border border-border mb-6">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-text-muted" />
              <span className="text-text-muted">Total:</span>
              <span className="font-semibold text-text-primary">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-text-muted">Complete:</span>
              <span className="font-semibold text-success">{stats.complete}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-error" />
              <span className="text-text-muted">Incomplete:</span>
              <span className="font-semibold text-error">{stats.incomplete}</span>
            </div>
            {isFetching && (
              <div className="ml-auto flex items-center gap-2 text-sm text-text-muted">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Updating...
              </div>
            )}
          </div>

          {/* Search and Filter Bar (UPDATED) */}
          <div className="flex gap-4">
            {/* Search Bar */}
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search by ID, MRN, or Commercial Reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface border border-border focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            
            {/* Status Filter (NEW) */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none w-full pl-10 pr-8 py-2 bg-surface border border-border focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                {StatusFilterOptions.map(option => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    className={option.color} // Tailwind class for color is typically applied to text
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  MRN
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Commercial Ref
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Packages
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Gross Mass (kg)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Released Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Outbounds
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Saldo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedArrivals.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                    <p className="text-text-muted">
                      {searchTerm || statusFilter !== 'all'
                        ? 'No arrivals found matching your current filters.' 
                        : 'No arrivals data available.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedArrivals.map((arrival, index) => {
                  const status = getStatus(arrival.saldo);
                  const StatusIcon = status.icon;
                  
                  return (
                    <tr
                      key={arrival.MRN || index}
                      onClick={() => handleRowClick(arrival.MRN)}
                      className="border-b border-border hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-text-primary">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(arrival.DECLARATIONID, `id-${arrival.DECLARATIONID}`);
                          }}
                          className={`relative px-2 py-1 rounded transition-all duration-300 text-left ${
                            copiedId === `id-${arrival.DECLARATIONID}` 
                              ? 'bg-primary text-white' 
                              : 'hover:bg-primary hover:text-white hover:shadow-sm'
                          }`}
                        >
                          {copiedId === `id-${arrival.DECLARATIONID}` ? '✓ Copied!' : arrival.DECLARATIONID || 'N/A'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-text-primary">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(arrival.MRN, `mrn-${arrival.MRN}`);
                          }}
                          className={`relative px-2 py-1 rounded transition-all duration-300 text-left ${
                            copiedId === `mrn-${arrival.MRN}` 
                              ? 'bg-primary text-white' 
                              : 'hover:bg-primary hover:text-white hover:shadow-sm'
                          }`}
                        >
                          {copiedId === `mrn-${arrival.MRN}` ? '✓ Copied!' : arrival.MRN || 'N/A'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-primary">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(arrival.COMMERCIALREFERENCE, `ref-${arrival.COMMERCIALREFERENCE}`);
                          }}
                          className={`relative px-2 py-1 rounded transition-all duration-300 text-left ${
                            copiedId === `ref-${arrival.COMMERCIALREFERENCE}` 
                              ? 'bg-primary text-white' 
                              : 'hover:bg-primary hover:text-white hover:shadow-sm'
                          }`}
                        >
                          {copiedId === `ref-${arrival.COMMERCIALREFERENCE}` ? '✓ Copied!' : arrival.COMMERCIALREFERENCE || 'N/A'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-text-primary">
                        {formatNumber(arrival.TOTAL_PACKAGES)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-text-primary">
                          {formatNumber(Math.round(arrival.TOTAL_ITEM_GROSSMASS || 0))}
                        </div>
                        {arrival.TOTAL_ITEM_NETMASS > 0 && (
                          <div className="text-xs text-text-muted">
                            Net: {formatNumber(Math.round(arrival.TOTAL_ITEM_NETMASS))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-text-primary">
                          {formatDate(arrival.GDSREL_DATETIME)}
                        </div>
                        {arrival.ARR_NOT_DATETIME && (
                          <div className="text-xs text-text-muted">
                            Arr: {formatDate(arrival.ARR_NOT_DATETIME)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">
                            {arrival.Outbounds ? arrival.Outbounds.length : 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${
                          arrival.saldo === 0 
                            ? 'text-success' 
                            : arrival.saldo > 0 
                            ? 'text-error' 
                            : 'text-text-muted'
                        }`}>
                          {arrival.saldo !== undefined ? formatNumber(arrival.saldo) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 border text-xs font-medium ${
                          status.color === 'success' 
                            ? 'border-success text-success bg-green-50' 
                            : status.color === 'error'
                            ? 'border-error text-error bg-red-50'
                            : 'border-gray-300 text-text-muted bg-gray-50'
                        }`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <div className="mt-4 px-6 py-3 bg-surface border border-border">
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>
              Showing {startIndex + 1}-{Math.min(endIndex, sortedArrivals.length)} of {sortedArrivals.length} arrivals
              {sortedArrivals.length !== arrivals.length && ` (filtered from ${arrivals.length})`}
            </span>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1 border border-border bg-surface hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <span className="px-3 py-1">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1 border border-border bg-surface hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                  <ChevronRight className="w-4 h-4" />
              </div>
            )}
            
            <span>
              {isFetching ? 'Updating...' : `Last updated: ${new Date().toLocaleTimeString()}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArrivalsTable;