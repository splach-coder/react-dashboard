import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Copy,
  ChevronDown,
  Pause,
  Maximize2,
  Minimize2,
  ArrowRight,
  TrendingUp,
  Activity,
  AlertTriangle,
  X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getUploads } from "../../api/api";

// --- Utility Functions ---

const ProjectColors = [
  { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
  { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200" },
  { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200" },
  { bg: "bg-lime-100", text: "text-lime-700", border: "border-lime-200" },
  { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-700", border: "border-fuchsia-200" },
  { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" },
  { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200" },
  { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
  { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  { bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-200" },
  { bg: "bg-stone-100", text: "text-stone-700", border: "border-stone-200" },
];

const getProjectColor = (projectName = "default") => {
  let hash = 0;
  for (let i = 0; i < projectName.length; i++) {
    hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ProjectColors[Math.abs(hash) % ProjectColors.length];
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const getStatusConfig = (status) => {
  switch (status?.toLowerCase()) {
    case 'success':
    case 'completed':
    case 'succeeded':
      return {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        label: "Success"
      };
    case 'failed':
    case 'error':
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: <XCircle className="w-3.5 h-3.5" />,
        label: "Failed"
      };
    default:
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        icon: <Clock className="w-3.5 h-3.5" />,
        label: "Pending"
      };
  }
};

const getRunStatus = (run) => {
  if (run.finalResult?.workflowStatus) return run.finalResult.workflowStatus;
  if (run.status) return run.status;
  if (run.finalResult?.allStepsSucceeded === false) return "failed";
  if (run.finalResult?.allStepsSucceeded === true) return "success";
  return "pending";
};

// --- Main Component ---

export default function FlowRunsTable({ onSelectRun }) {
  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [dateRange, setDateRange] = useState("all"); // 'all', 'today', 'week'
  const [currentPage, setCurrentPage] = useState(1);
  const [isLive, setIsLive] = useState(true); // Toggle auto-refresh
  const [isCompact, setIsCompact] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [copiedId, setCopiedId] = useState(null);

  const PAGE_SIZE = 9;

  // React Query
  const {
    data: apiData,
    isLoading,
    isRefetching,
    refetch
  } = useQuery({
    queryKey: ['flowRuns'],
    queryFn: () => getUploads("", { limit: 200, recent: true }),
    refetchInterval: isLive ? 60000 : false, // 1 minute refresh
    staleTime: 60000,
    keepPreviousData: true,
  });

  // --- Data Processing ---

  const processedData = useMemo(() => {
    if (!apiData) return [];
    const rawLogs = apiData.logs || (Array.isArray(apiData) ? apiData : []);
    const uniqueMap = new Map();

    // 1. First Pass: Dedupe by ID (Exact API duplicates)
    rawLogs.forEach(item => {
      const id = item.runId || item.id || `fallback-${item.fileRef}-${item.createdAt}`;
      if (!uniqueMap.has(id)) {
        uniqueMap.set(id, {
          id: id,
          fileRef: item.fileRef || "Unknown Ref",
          projectName: item.companyName || "Unknown Project",
          timestamp: item.logicAppTimestamp || item.createdAt || new Date().toISOString(),
          status: getRunStatus(item),
          errorMessage: item.finalResult?.error || item.error || null,
          user: item.finalResult?.checker || "System",
          declarationId: item.declarationId,
          raw: item
        });
      }
    });

    const initialItems = Array.from(uniqueMap.values()).sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    // 2. Second Pass: Advanced De-duplication for "Shadow" Pending runs
    // Issues: The backend may create a NEW record for the 'failed/success' state, leaving the 'pending' record behind.
    // Solution: If we find a 'pending' record, check if a 'failed/success' record exists for the same FileRef/Project within 30 minutes.
    // If so, we hide the pending one as it's just a ghost.

    const finalItems = [];

    for (const item of initialItems) {
      if (item.status === 'pending') {
        const hasBetterVersion = finalItems.find(existing =>
          existing.fileRef === item.fileRef &&
          existing.projectName === item.projectName &&
          existing.status !== 'pending' &&
          // Check if timestamps are reasonably close (e.g. within 30 mins) to consider them the "Same Run"
          Math.abs(new Date(existing.timestamp) - new Date(item.timestamp)) < 30 * 60 * 1000
        );

        if (hasBetterVersion) {
          // Skip adding this pending item because we already have the final result for it
          continue;
        }
      }
      finalItems.push(item);
    }

    return finalItems;
  }, [apiData]);

  // Global Stats
  const stats = useMemo(() => {
    const total = processedData.length;
    const success = processedData.filter(i => getStatusConfig(i.status).label === 'Success').length;
    const failed = processedData.filter(i => getStatusConfig(i.status).label === 'Failed').length;
    const pending = total - success - failed;
    const rate = total > 0 ? Math.round((success / total) * 100) : 0;

    return { total, success, failed, pending, rate };
  }, [processedData]);

  // Derived Filter Options
  const uniqueProjects = useMemo(() =>
    [...new Set(processedData.map(item => item.projectName))].sort()
    , [processedData]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    let res = processedData;

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      res = res.filter(item =>
        item.fileRef.toLowerCase().includes(lowerTerm) ||
        item.projectName.toLowerCase().includes(lowerTerm) ||
        item.id.toLowerCase().includes(lowerTerm) ||
        (item.declarationId && item.declarationId.toString().includes(lowerTerm)) ||
        (item.user && item.user.toLowerCase().includes(lowerTerm))
      );
    }

    if (selectedStatus !== 'all') {
      res = res.filter(item => {
        const s = item.status.toLowerCase();
        if (selectedStatus === 'failed') return s === 'failed' || s === 'error';
        if (selectedStatus === 'success') return s === 'success' || s === 'completed';
        if (selectedStatus === 'pending') return s === 'pending' || s === 'running';
        return true;
      });
    }

    if (selectedProject !== 'all') {
      res = res.filter(item => item.projectName === selectedProject);
    }

    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (dateRange === 'today') cutoff.setHours(0, 0, 0, 0);
      if (dateRange === 'week') cutoff.setDate(now.getDate() - 7);
      res = res.filter(item => new Date(item.timestamp) >= cutoff);
    }

    return res;
  }, [processedData, searchTerm, selectedStatus, selectedProject, dateRange]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedItems = useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedProject, dateRange]);


  // --- Handlers ---

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  // --- Render ---

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* 1. Header & Stats */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col gap-4">
          {/* Title Row */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Flow Runs
              </h2>
              <p className="text-sm text-gray-500">Execution history & monitoring</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLive(!isLive)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${isLive
                    ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                    : "bg-gray-100 text-gray-600 ring-1 ring-gray-200"
                  }`}
              >
                {isLive ? <Pause className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                {isLive ? "Live" : "Paused"}
              </button>
              <div className="h-4 w-px bg-gray-200 mx-1"></div>
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                className={`p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all ${isRefetching ? 'text-primary border-primary' : ''}`}
                title="Force Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsCompact(!isCompact)}
                className={`p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 ${isCompact ? 'bg-gray-100 text-primary border-primary/30' : ''}`}
                title={isCompact ? "Comfortable View" : "Compact View"}
              >
                {isCompact ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Global Stats Bar */}
          <div className="grid grid-cols-4 gap-4 pt-2">
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-semibold text-gray-400">Total Runs</p>
                <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              </div>
              <Activity className="w-5 h-5 text-gray-300" />
            </div>
            <div className="bg-green-50/50 rounded-lg p-2 border border-green-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-semibold text-green-600/70">Success Rate</p>
                <p className="text-lg font-bold text-green-700">{stats.rate}%</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-300" />
            </div>
            <div className="bg-red-50/50 rounded-lg p-2 border border-red-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-semibold text-red-600/70">Failed</p>
                <p className="text-lg font-bold text-red-700">{stats.failed}</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-red-300" />
            </div>
            <div className="bg-amber-50/50 rounded-lg p-2 border border-amber-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-semibold text-amber-600/70">Pending</p>
                <p className="text-lg font-bold text-amber-700">{stats.pending}</p>
              </div>
              <Clock className="w-5 h-5 text-amber-300" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-col md:flex-row gap-4 items-center justify-between shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] z-20">

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex p-0.5 bg-gray-100/80 rounded-md border border-gray-200 flex-shrink-0">
            {['all', 'success', 'failed'].map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 text-sm font-medium rounded-sm transition-all capitalize ${selectedStatus === status
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors flex-shrink-0 ${showFilters ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in relative z-10 text-sm">
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm"
            >
              <option value="all">All Projects</option>
              {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Time Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedProject('all');
                setDateRange('all');
                setSelectedStatus('all');
              }}
              className="text-primary text-sm font-medium hover:underline"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* 3. Table */}
      <div className="flex-1 overflow-auto bg-white relative">
        {isLoading && processedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-gray-500 font-medium">Loading execution history...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 mb-2">
              <Search className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-900 font-medium">No matching runs</p>
            <button
              onClick={() => { setSearchTerm(""); setSelectedStatus("all"); setSelectedProject("all"); setDateRange("all"); }}
              className="text-sm text-primary hover:underline"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F9FAFB] sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Declaration ID</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Triggered</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedItems.map((run) => {
                const status = getStatusConfig(run.status);
                const projectColor = getProjectColor(run.projectName);

                return (
                  <tr
                    key={run.id}
                    className="group bg-white hover:bg-gray-50/80 transition-colors duration-150"
                  >
                    {/* Reference */}
                    <td className={`px-6 py-3 ${isCompact ? 'py-1.5' : ''}`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(run.fileRef, `ref-${run.id}`); }}
                        className={`relative text-left px-2 py-0.5 rounded transition-all duration-300 text-sm font-medium
                           ${copiedId === `ref-${run.id}`
                            ? 'bg-primary text-white'
                            : 'text-gray-900 hover:bg-primary hover:text-white hover:shadow-sm'
                          }`}
                      >
                        {copiedId === `ref-${run.id}` ? '✓ Copied!' : run.fileRef}
                      </button>
                    </td>

                    {/* Declaration ID */}
                    <td className={`px-6 py-3 hidden md:table-cell ${isCompact ? 'py-1.5' : ''}`}>
                      {run.declarationId ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(run.declarationId, `dec-${run.id}`); }}
                          className={`relative text-left px-2 py-0.5 rounded transition-all duration-300 text-sm font-mono
                             ${copiedId === `dec-${run.id}`
                              ? 'bg-primary text-white'
                              : 'text-gray-800 hover:bg-primary hover:text-white hover:shadow-sm'
                            }`}
                        >
                          {copiedId === `dec-${run.id}` ? '✓ Copied!' : run.declarationId}
                        </button>
                      ) : (
                        <span className="text-gray-300 px-2">-</span>
                      )}
                    </td>

                    {/* Project - Smaller, Not Bold */}
                    <td className={`px-6 py-3 ${isCompact ? 'py-1.5' : ''}`}>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border ${projectColor.bg} ${projectColor.text} ${projectColor.border}`}>
                        {run.projectName}
                      </span>
                    </td>

                    {/* Date */}
                    <td className={`px-6 py-3 hidden lg:table-cell text-sm text-gray-500 whitespace-nowrap ${isCompact ? 'py-1.5' : ''}`}>
                      {formatDate(run.timestamp)}
                    </td>

                    {/* Status - Moved after Triggered */}
                    <td className={`px-6 py-3 ${isCompact ? 'py-1.5' : ''}`}>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.bg} ${status.text} ${status.border}`}>
                        {status.icon}
                        <span className="capitalize">{status.label}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className={`px-6 py-3 text-right ${isCompact ? 'py-1.5' : ''}`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectRun(run.raw); }}
                        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Details <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Pagination */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{filteredData.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * PAGE_SIZE, filteredData.length)}</span> of <span className="font-medium text-gray-900">{filteredData.length}</span> results
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>

          <div className="hidden sm:flex items-center gap-1 px-2">
            <span className="text-sm text-gray-600 font-medium bg-gray-100 w-6 h-6 flex items-center justify-center rounded-md">{currentPage}</span>
            <span className="text-gray-400 text-sm">/ {totalPages || 1}</span>
          </div>

          <button
            onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-2.5 py-1 border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
