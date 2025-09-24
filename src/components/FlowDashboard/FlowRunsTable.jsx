import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  CheckCircle,
  ChevronDown,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { getUploads } from "../../api/api";

// Project color mapping - 20 different color schemes
const getProjectColor = (projectName) => {
  const colors = [
    { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
    { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
    { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
    {
      bg: "bg-purple-100",
      text: "text-purple-700",
      border: "border-purple-200",
    },
    { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
    {
      bg: "bg-indigo-100",
      text: "text-indigo-700",
      border: "border-indigo-200",
    },
    {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      border: "border-yellow-200",
    },
    { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200" },
    {
      bg: "bg-orange-100",
      text: "text-orange-700",
      border: "border-orange-200",
    },
    { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200" },
    {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    {
      bg: "bg-violet-100",
      text: "text-violet-700",
      border: "border-violet-200",
    },
    {
      bg: "bg-fuchsia-100",
      text: "text-fuchsia-700",
      border: "border-fuchsia-200",
    },
    { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" },
    { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200" },
    { bg: "bg-lime-100", text: "text-lime-700", border: "border-lime-200" },
    { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
    { bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-200" },
    { bg: "bg-stone-100", text: "text-stone-700", border: "border-stone-200" },
  ];

  // Generate consistent color index based on project name
  const hash = projectName.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};

// Cache configuration
const CACHE_KEY = "flowRunsCache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in ms

// Get cached data if valid
const getCachedData = () => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  try {
    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_TTL;

    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data; // Return the full cached response
  } catch (e) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

// Save data to cache
const setCacheData = (data) => {
  const cacheEntry = {
    data: data, // Store the full response object
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
  } catch (e) {
    console.warn("Failed to save to cache", e);
  }
};

const getStatusConfig = (status) => {
  const configs = {
    success: {
      color: "text-green-700 bg-green-50 border-green-200",
      rowBg: "bg-gradient-to-r from-white via-green-50 to-green-50",
      icon: <CheckCircle className="w-3 h-3" />,
      label: "Completed",
    },
    failed: {
      color: "text-red-700 bg-red-50 border-red-200",
      rowBg: "bg-gradient-to-r from-white via-red-50 to-red-50",
      icon: <XCircle className="w-3 h-3" />,
      label: "Failed",
    },
    pending: {
      color: "text-amber-700 bg-amber-50 border-amber-200",
      rowBg: "bg-gradient-to-r from-white via-amber-50 to-amber-50",
      icon: <Clock className="w-3 h-3" />,
      label: "Pending",
    },
  };
  return configs[status] || configs.success;
};

// Updated to use workflowStatus from API
const getRunStatus = (run) => {
  // Use workflowStatus from API if available
  if (run.finalResult?.workflowStatus) {
    return run.finalResult.workflowStatus;
  }

  // Fallback to old logic
  if (!run.finalResult?.allStepsSucceeded) {
    return "failed";
  }
  return "success";
};

export default function FlowRunsTable({ onSelectRun }) {
  const [flowRunsData, setFlowRunsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [timeRange, setTimeRange] = useState("today");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedRef, setCopiedRef] = useState(null);
  const [timedOutWorkflows, setTimedOutWorkflows] = useState([]);
  const [copiedDeclarationId, setCopiedDeclarationId] = useState(null);
  const itemsPerPage = 10;

  // Copy to clipboard handler
  const handleCopyRef = async (fileRef, event) => {
    event.stopPropagation(); // Prevent row click
    try {
      const cleanRef = fileRef.replace(/\.[^/.]+$/, "");
      await navigator.clipboard.writeText(cleanRef);
      setCopiedRef(fileRef);
      setTimeout(() => setCopiedRef(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  // Fetch data with optimized API calls
  const fetchData = async (force = false) => {
    // Skip cache check if force refresh
    if (!force) {
      const cached = getCachedData();
      if (cached) {
        const cachedData = cached.logs || cached;
        if (Array.isArray(cachedData) && cachedData.length > 0) {
          setFlowRunsData(cachedData);
          setIsLoading(false);
          return;
        }
      }
    }

    // DON'T clear existing data immediately - keep showing old data while loading
    const startTime = performance.now();
    if (force) setIsRefreshing(true);
    // Remove this line: setIsLoading(true); - only show loading for initial load
    if (!flowRunsData.length) setIsLoading(true); // Only show skeleton on first load

    try {
      const data = await getUploads("", {
        limit: 100,
        recent: true,
        status: selectedStatus || null,
      });

      console.log("Fetched optimized data:", data);

      const freshData = data.logs || [];

      // Remove duplicates
      const uniqueData = freshData.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.fileRef === item.fileRef)
      );

      // Smart update: only update if data actually changed
      if (JSON.stringify(uniqueData) !== JSON.stringify(flowRunsData)) {
        setFlowRunsData(uniqueData);
        console.log("Data updated with changes");
      } else {
        console.log("No changes detected, keeping existing data");
      }

      // Handle timeouts
      if (data.timedOut && data.timedOut.length > 0) {
        console.log(
          `${data.timedOut.length} workflows timed out:`,
          data.timedOut
        );
        setTimedOutWorkflows(data.timedOut);
      }

      // Update cache
      setCacheData({ logs: uniqueData, ...data });
    } catch (error) {
      console.error("Failed to fetch uploads:", error);
      // On error, DON'T clear existing data - keep showing what we have
      console.log("Error occurred, keeping existing data visible");
    } finally {
      setIsLoading(false); // Always clear loading state
      setIsRefreshing(false);
      const endTime = performance.now();
      console.log(`API call took ${endTime - startTime} milliseconds`);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData(); // Initial load

    const interval = setInterval(() => {
      fetchData(true); // Auto-refresh every 15 seconds
    }, 15000); // Reduced from 30 seconds for more real-time feel

    return () => clearInterval(interval);
  }, [selectedStatus]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchData(true); // Force reload
  };

  // copy handler for declaration ID
  const handleCopyDeclarationId = async (declarationId, event) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(declarationId.toString());
      setCopiedDeclarationId(declarationId);
      setTimeout(() => setCopiedDeclarationId(null), 2000);
    } catch (err) {
      console.error("Failed to copy declaration ID: ", err);
    }
  };

  // Transform and sort data: newest first
  const transformedData = useMemo(() => {
    return flowRunsData
      .map((run) => ({
        id: run.runId,
        fileRef: run.fileRef || run.runId, // Use fileRef as reference
        projectName: run.companyName,
        triggerTime: run.logicAppTimestamp || run.createdAt,
        status: getRunStatus(run),
        createdBy: run.finalResult?.checker || "Unknown",
        rawData: run,
      }))
      .sort((a, b) => new Date(b.triggerTime) - new Date(a.triggerTime)); // Newest first
  }, [flowRunsData]);

  // Get unique values for filters
  const uniqueProjects = [
    ...new Set(transformedData.map((run) => run.projectName)),
  ];
  const uniqueStatuses = [...new Set(transformedData.map((run) => run.status))];

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = transformedData;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (run) =>
          run.id.toLowerCase().includes(term) ||
          run.fileRef.toLowerCase().includes(term) ||
          run.projectName.toLowerCase().includes(term) ||
          run.createdBy.toLowerCase().includes(term)
      );
    }

    if (selectedProject) {
      filtered = filtered.filter((run) => run.projectName === selectedProject);
    }

    if (selectedStatus) {
      filtered = filtered.filter((run) => run.status === selectedStatus);
    }

    if (timeRange !== "all") {
      const now = new Date();
      const cutoff = new Date();

      switch (timeRange) {
        case "today":
          cutoff.setHours(0, 0, 0, 0);
          break;
        case "week":
          cutoff.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoff.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }

      filtered = filtered.filter((run) => new Date(run.triggerTime) >= cutoff);
    }

    return filtered;
  }, [searchTerm, selectedProject, selectedStatus, timeRange, transformedData]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedProject("");
    setSelectedStatus("");
    setTimeRange("today");
    setCurrentPage(1);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;

    if (totalPages <= 1) return null;

    buttons.push(
      <button
        key={1}
        onClick={() => setCurrentPage(1)}
        className={`px-3 py-1 text-sm font-medium rounded ${
          currentPage === 1
            ? "bg-[#E54C37] text-white"
            : "text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-white"
        }`}
      >
        1
      </button>
    );

    if (currentPage > 3 && totalPages > maxVisibleButtons) {
      buttons.push(
        <span key="left-ellipsis" className="text-[#6B6B6B]">
          ...
        </span>
      );
    }

    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    if (totalPages <= maxVisibleButtons) {
      startPage = 2;
      endPage = totalPages - 1;
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 text-sm font-medium rounded ${
            currentPage === i
              ? "bg-[#E54C37] text-white"
              : "text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-white"
          }`}
        >
          {i}
        </button>
      );
    }

    if (currentPage < totalPages - 2 && totalPages > maxVisibleButtons) {
      buttons.push(
        <span key="right-ellipsis" className="text-[#6B6B6B]">
          ...
        </span>
      );
    }

    if (totalPages > 1) {
      buttons.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className={`px-3 py-1 text-sm font-medium rounded ${
            currentPage === totalPages
              ? "bg-[#E54C37] text-white"
              : "text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-white"
          }`}
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  // Skeleton loader component
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {Array(5) // Changed from 4 to 5
        .fill()
        .map((_, i) => (
          <td key={i} className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded"></div>
          </td>
        ))}
    </tr>
  );

  return (
    <div className="w-full h-full bg-[#FDF9F8]">
      <div className="bg-white shadow-sm border border-[#EAEAEA] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#EAEAEA]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold text-[#1A1A1A]">
                  Flow Runs
                </h2>
                <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  Live
                </div>
              </div>
              <p className="text-[#6B6B6B] text-sm mt-1">
                {filteredData.length} total runs • Auto-refresh every 15s
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center px-3 py-2 text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#EAEAEA] rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>

              {isLoading && !isRefreshing && (
                <div className="flex items-center text-[#E54C37] text-sm">
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Loading
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-[#EAEAEA] bg-[#FDF9F8]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B6B6B] w-4 h-4" />
              <input
                type="text"
                placeholder="Search runs, projects, file refs, or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-[#EAEAEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E54C37] focus:border-transparent bg-white"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#EAEAEA] rounded-lg hover:bg-white transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                <ChevronDown
                  className={`w-4 h-4 ml-2 transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </button>

              {(searchTerm ||
                selectedProject ||
                selectedStatus ||
                timeRange !== "all") && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 text-sm font-medium text-[#E54C37] hover:text-[#C23D2E] transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                  Project
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#EAEAEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E54C37] focus:border-transparent bg-white"
                >
                  <option value="">All Projects</option>
                  {uniqueProjects.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#EAEAEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E54C37] focus:border-transparent bg-white"
                >
                  <option value="">All Statuses</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#EAEAEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E54C37] focus:border-transparent bg-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FDF9F8]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider border-b border-[#EAEAEA]">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider border-b border-[#EAEAEA]">
                  Declaration ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider border-b border-[#EAEAEA]">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider border-b border-[#EAEAEA]">
                  Triggered At
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider border-b border-[#EAEAEA]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {isLoading ? (
                // Skeleton loader
                Array.from({ length: itemsPerPage }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array(5)
                      .fill()
                      .map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </td>
                      ))}
                  </tr>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((run) => {
                  const statusConfig = getStatusConfig(run.status);
                  const projectColor = getProjectColor(run.projectName);
                  return (
                    <tr
                      key={run.fileRef}
                      onClick={() => onSelectRun(run.rawData)}
                      className={`cursor-pointer hover:shadow-sm transition-all duration-200 group ${statusConfig.rowBg}`}
                    >
                      {/* File Reference Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-between group">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-[#E54C37] rounded-full mr-3"></div>
                            <span className="text-sm font-medium text-[#1A1A1A] group-hover:text-[#E54C37] transition-colors">
                              {run.fileRef.replace(/\.[^/.]+$/, "")}
                            </span>
                          </div>
                          <button
                            onClick={(e) => handleCopyRef(run.fileRef, e)}
                            className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-gray-400 hover:text-gray-600 transition-all duration-200 rounded"
                            title={
                              copiedRef === run.fileRef
                                ? "Copied!"
                                : "Copy reference"
                            }
                          >
                            {copiedRef === run.fileRef ? (
                              <div className="flex items-center text-green-600">
                                <Check className="w-3 h-3 mr-1" />
                                <span className="text-xs font-medium">
                                  Copied
                                </span>
                              </div>
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Declaration ID Column - NEW */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {run.rawData.declarationId ? (
                          <div className="flex items-center justify-between group">
                            <span className="text-sm font-medium text-[#1A1A1A] group-hover:text-[#E54C37] transition-colors">
                              {run.rawData.declarationId}
                            </span>
                            <button
                              onClick={(e) =>
                                handleCopyDeclarationId(
                                  run.rawData.declarationId,
                                  e
                                )
                              }
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-gray-400 hover:text-gray-600 transition-all duration-200 rounded"
                              title={
                                copiedDeclarationId ===
                                run.rawData.declarationId
                                  ? "Copied!"
                                  : "Copy Declaration ID"
                              }
                            >
                              {copiedDeclarationId ===
                              run.rawData.declarationId ? (
                                <div className="flex items-center text-green-600">
                                  <Check className="w-3 h-3 mr-1" />
                                  <span className="text-xs font-medium">
                                    Copied
                                  </span>
                                </div>
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>

                      {/* Project Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${projectColor.bg} ${projectColor.text} ${projectColor.border}`}
                          >
                            {run.projectName}
                          </span>
                        </div>
                      </td>

                      {/* Triggered At Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6B6B]">
                        {new Date(run.triggerTime).toLocaleString()}
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}
                        >
                          {statusConfig.icon}
                          <span className="ml-1">{statusConfig.label}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-6 py-16 text-center" colSpan="5">
                    <h3 className="text-lg font-medium text-[#1A1A1A]">
                      No runs found
                    </h3>
                    <p className="text-sm text-[#6B6B6B] mt-1">
                      There are no test runs to display. Try adjusting your
                      filters or trigger a new run.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-[#EAEAEA] bg-[#FDF9F8]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#6B6B6B]">
              Showing {startIndex + 1} to {endIndex} of {filteredData.length}{" "}
              results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-3 py-1 text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {renderPaginationButtons()}

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages || isLoading}
                className="px-3 py-1 text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
