import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Package, 
  FileText, 
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  ArrowUp, 
  ArrowDown,
  Plus,
  X
} from 'lucide-react';
import { getMasterRecords, addOutbound } from '../../api/api';

const OutboundsTable = () => {
  const { mrn } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    mrn: '',
    nombre_total_des_conditionnements: '',
    type_de_declaration: 'IM',
    document_precedent: '',
    document_d_accompagnement: '',
    numero_de_reference: '',
    date_acceptation: ''
  });
  const [formError, setFormError] = useState(null);

  // ✨ React Query - Uses cached data from ArrivalsTable (NO API CALL if cached!)
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['arrivals'],
    queryFn: getMasterRecords,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Mutation for adding outbound
  const addOutboundMutation = useMutation({
    mutationFn: (outboundData) => addOutbound(mrn, outboundData),
    onSuccess: () => {
      // Invalidate and refetch arrivals data
      queryClient.invalidateQueries({ queryKey: ['arrivals'] });
      setShowAddForm(false);
      setFormData({
        mrn: '',
        nombre_total_des_conditionnements: '',
        type_de_declaration: 'IM',
        document_precedent: '',
        document_d_accompagnement: '',
        numero_de_reference: '',
        date_acceptation: ''
      });
      setFormError(null);
    },
    onError: (error) => {
      setFormError(error.message || 'Failed to add outbound. Please try again.');
    }
  });

  const arrivals = data?.records || [];
  const inboundData = arrivals.find(a => a.MRN === mrn);
  const outbounds = inboundData?.Outbounds || [];

  // Sorting logic
  const sortedOutbounds = [...outbounds].sort((a, b) => {
    if (!sortConfig.key) return 0; // No sorting if no key is selected

    const aValue = a[sortConfig.key] || '';
    const bValue = b[sortConfig.key] || '';
    
    // Check if the values are numeric (for packages, mass, etc.)
    const isNumeric = typeof aValue === 'number' && typeof bValue === 'number';

    let comparison = 0;
    if (aValue < bValue) {
      comparison = -1;
    } else if (aValue > bValue) {
      comparison = 1;
    }

    // Special handling for number sorting to ensure consistency
    if (isNumeric) {
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
    }
    
    return sortConfig.direction === 'asc' ? comparison : comparison * -1;
  });

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Helper function to render the sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    if (sortConfig.direction === 'asc') {
        return <ArrowUp className="w-3 h-3 ml-1" />;
    }
    return <ArrowDown className="w-3 h-3 ml-1" />;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
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

  const handleRefresh = () => {
    refetch();
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text || '');
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormError(null);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.mrn.trim()) {
      setFormError('MRN is required');
      return;
    }
    if (!formData.nombre_total_des_conditionnements.trim()) {
      setFormError('Nombre total des conditionnements is required');
      return;
    }

    // Format document_precedent with inbound MRN if not already formatted
    let documentPrecedent = formData.document_precedent.trim();
    if (documentPrecedent && !documentPrecedent.includes(mrn)) {
      documentPrecedent = `N821 ${mrn}`;
    } else if (!documentPrecedent) {
      documentPrecedent = `N821 ${mrn}`;
    }

    const outboundData = {
      mrn: formData.mrn.trim(),
      nombre_total_des_conditionnements: formData.nombre_total_des_conditionnements.trim(),
      type_de_declaration: formData.type_de_declaration || 'IM',
      document_precedent: documentPrecedent,
      document_d_accompagnement: formData.document_d_accompagnement.trim() || '',
      numero_de_reference: formData.numero_de_reference.trim() || '',
      date_acceptation: formData.date_acceptation.trim() || ''
    };

    addOutboundMutation.mutate(outboundData);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setFormData({
      mrn: '',
      nombre_total_des_conditionnements: '',
      type_de_declaration: 'IM',
      document_precedent: '',
      document_d_accompagnement: '',
      numero_de_reference: '',
      date_acceptation: ''
    });
    setFormError(null);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showAddForm) {
        handleCancelForm();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAddForm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-lg">Loading outbound records...</p>
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
            onClick={() => navigate('/arrivals')}
            className="px-6 py-2 bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Back to Arrivals
          </button>
        </div>
      </div>
    );
  }

  if (!inboundData) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center max-w-md bg-surface p-8 border border-border">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-text-primary mb-2">Record Not Found</h2>
          <p className="text-text-muted mb-6">Inbound record with MRN {mrn} was not found.</p>
          <button
            onClick={() => navigate('/arrivals')}
            className="px-6 py-2 bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Back to Arrivals
          </button>
        </div>
      </div>
    );
  }

  // Calculate saldo status
  const saldoStatus = inboundData.saldo === 0 
    ? { label: 'Complete', color: 'success', icon: CheckCircle }
    : inboundData.saldo > 0 
    ? { label: 'Incomplete', color: 'error', icon: XCircle }
    : null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/arrivals')}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-6 border border-border px-4 py-2 bg-surface hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Arrivals
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-semibold text-text-primary mb-1">
                Inbound Details
              </h1>
              <p className="text-text-muted">
                MRN: {mrn}
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
        </div>

        {/* Inbound Info Card */}
        <div className="bg-surface border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Inbound Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Declaration ID</p>
              <p className="font-medium text-text-primary">{inboundData?.DECLARATIONID || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Commercial Reference</p>
              <p className="font-medium text-text-primary">{inboundData?.COMMERCIALREFERENCE || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Message Status</p>
              <p className="font-medium text-text-primary">{inboundData?.MESSAGESTATUS || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Total Packages</p>
              <p className="font-medium text-text-primary">{formatNumber(inboundData?.TOTAL_PACKAGES)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Gross Mass (kg)</p>
              <p className="font-medium text-text-primary">{formatNumber(Math.round(inboundData?.TOTAL_ITEM_GROSSMASS || 0))}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Net Mass (kg)</p>
              <p className="font-medium text-text-primary">{formatNumber(Math.round(inboundData?.TOTAL_ITEM_NETMASS || 0))}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Arrival Date</p>
              <p className="font-medium text-text-primary">{formatDate(inboundData?.ARR_NOT_DATETIME)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Release Date</p>
              <p className="font-medium text-text-primary">{formatDate(inboundData?.GDSREL_DATETIME)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Outbounds Count</p>
              <p className="font-medium text-text-primary">{outbounds.length}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Saldo</p>
              <p className={`font-semibold ${
                inboundData?.saldo === 0 ? 'text-success' : 
                inboundData?.saldo > 0 ? 'text-error' : 
                'text-text-muted'
              }`}>
                {inboundData?.saldo !== undefined ? formatNumber(inboundData.saldo) : 'N/A'}
              </p>
            </div>
            {saldoStatus && (
              <div>
                <p className="text-xs text-text-muted uppercase mb-1">Status</p>
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 border text-xs font-medium ${
                  saldoStatus.color === 'success' 
                    ? 'border-success text-success bg-green-50' 
                    : 'border-error text-error bg-red-50'
                }`}>
                  <saldoStatus.icon className="w-3.5 h-3.5" />
                  {saldoStatus.label}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Outbounds Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Outbound Documents ({outbounds.length})
            </h2>
            <p className="text-text-muted text-sm mt-1">
              Documents extracted and linked to this arrival
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Outbound
          </button>
        </div>

        {/* Add Outbound Modal */}
        {showAddForm && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelForm();
              }
            }}
          >
            <div 
              className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Outbound
                </h3>
                <button
                  onClick={handleCancelForm}
                  disabled={addOutboundMutation.isPending}
                  className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                {formError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    {formError}
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        MRN <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        name="mrn"
                        value={formData.mrn}
                        onChange={handleFormChange}
                        required
                        className="w-full px-3 py-2 border border-border bg-white focus:outline-none focus:border-primary transition-colors"
                        placeholder="e.g., 25BEH1000001CADYR4"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Nombre total des conditionnements <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        name="nombre_total_des_conditionnements"
                        value={formData.nombre_total_des_conditionnements}
                        onChange={handleFormChange}
                        required
                        className="w-full px-3 py-2 border border-border bg-white focus:outline-none focus:border-primary transition-colors"
                        placeholder="e.g., 7"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Type de déclaration
                      </label>
                      <select
                        name="type_de_declaration"
                        value={formData.type_de_declaration}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-border bg-white focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="IM">IM</option>
                        <option value="EX">EX</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Document précédent
                      </label>
                      <input
                        type="text"
                        name="document_precedent"
                        value={formData.document_precedent}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-border bg-white focus:outline-none focus:border-primary transition-colors"
                        placeholder={`N821 ${mrn}`}
                      />
                      <p className="text-xs text-text-muted mt-1">
                        Leave empty to auto-generate: N821 {mrn}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Document d'accompagnement
                      </label>
                      <input
                        type="text"
                        name="document_d_accompagnement"
                        value={formData.document_d_accompagnement}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-border bg-white focus:outline-none focus:border-primary transition-colors"
                        placeholder="e.g., N325 EMCU8612798-03"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Numéro de référence
                      </label>
                      <input
                        type="text"
                        name="numero_de_reference"
                        value={formData.numero_de_reference}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-border bg-white focus:outline-none focus:border-primary transition-colors"
                        placeholder="e.g., EMCU8612798-03"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        Date d'acceptation
                      </label>
                      <input
                        type="text"
                        name="date_acceptation"
                        value={formData.date_acceptation}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-border bg-white focus:outline-none focus:border-primary transition-colors"
                        placeholder="e.g., 05/12/2025"
                      />
                      <p className="text-xs text-text-muted mt-1">
                        Format: DD/MM/YYYY
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      disabled={addOutboundMutation.isPending}
                      className="px-6 py-2 border border-border bg-surface hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addOutboundMutation.isPending}
                      className="px-6 py-2 bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {addOutboundMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add Outbound
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Summary Info Bar - Moved Above Table */}
        {outbounds.length > 0 && (
          <div className="mb-4 px-6 py-4 bg-surface border border-border">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-semibold text-text-primary">
                  Total: {outbounds.length} outbound {outbounds.length === 1 ? 'document' : 'documents'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Saldo:</span>
                <span className={`font-semibold ${
                  inboundData?.saldo === 0 ? 'text-success' : 
                  inboundData?.saldo > 0 ? 'text-error' : 
                  'text-text-muted'
                }`}>
                  {inboundData?.saldo !== undefined ? formatNumber(inboundData.saldo) : 'N/A'} packages remaining
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Outbounds Table */}
        <div className="bg-surface border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  #
                </th>
                {/* Sortable Column: MRN */}
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('mrn')}
                >
                  <div className="flex items-center">
                    MRN
                    {getSortIcon('mrn')}
                  </div>
                </th>
                {/* Sortable Column: Nombre total des conditionnements */}
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('nombre_total_des_conditionnements')}
                >
                  <div className="flex items-center">
                    Nombre total des conditionnements
                    {getSortIcon('nombre_total_des_conditionnements')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Document précédent
                </th>
                {/* Sortable Column: Date d'acceptation */}
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('date_acceptation')}
                >
                  <div className="flex items-center">
                    Date d'acceptation
                    {getSortIcon('date_acceptation')}
                  </div>
                </th>
                {/* Sortable Column: Numéro de référence */}
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('numero_de_reference')}
                >
                  <div className="flex items-center">
                    Numéro de référence
                    {getSortIcon('numero_de_reference')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Type de déclaration
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Document d'accompagnement
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedOutbounds.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                    <p className="text-text-muted mb-2">No outbound records found for this arrival.</p>
                    <p className="text-sm text-text-muted">
                      Outbound documents will appear here once processed.
                    </p>
                  </td>
                </tr>
              ) : (
                sortedOutbounds.map((outbound, index) => (
                  <tr key={index} className="border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-text-muted">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(outbound.mrn, `mrn-${index}`);
                        }}
                        className={`inline-block px-2 py-1 rounded transition-all duration-300 ${
                          copiedId === `mrn-${index}` 
                            ? 'bg-primary text-white' 
                            : 'hover:bg-primary hover:text-white hover:shadow-sm'
                        }`}
                      >
                        {copiedId === `mrn-${index}` ? '✓ Copied!' : outbound.mrn || 'N/A'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">
                      {formatNumber(outbound.nombre_total_des_conditionnements || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">
                      {outbound.document_precedent || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">
                      {outbound.date_acceptation || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(outbound.numero_de_reference, `ref-${index}`);
                        }}
                        className={`inline-block px-2 py-1 rounded transition-all duration-300 ${
                          copiedId === `ref-${index}` 
                            ? 'bg-primary text-white' 
                            : 'hover:bg-primary hover:text-white hover:shadow-sm'
                        }`}
                      >
                        {copiedId === `ref-${index}` ? '✓ Copied!' : outbound.numero_de_reference || 'N/A'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">
                      {outbound.type_de_declaration || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">
                      {outbound.document_d_accompagnement || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OutboundsTable;