import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  CheckCircle,
  ChevronDown,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getUploads } from "../../api/api";

// Cache configuration
const CACHE_KEY = "flowRunsCache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in ms

// Get cached data if valid
const getCachedData = () => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  const isExpired = Date.now() - timestamp > CACHE_TTL;

  if (isExpired) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }

  return data;
};

// Save data to cache
const setCacheData = (data) => {
  const cacheEntry = {
    data,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
  } catch (e) {
    // localStorage might fail (quota exceeded), ignore silently
    console.warn("Failed to save to cache", e);
  }
};

const getStatusConfig = (status) => {
  const configs = {
    Success: {
      color: "text-green-700 bg-green-50 border-green-200",
      icon: <CheckCircle className="w-3 h-3" />,
      label: "Completed",
    },
    Failed: {
      color: "text-red-700 bg-red-50 border-red-200",
      icon: <XCircle className="w-3 h-3" />,
      label: "Failed",
    },
  };
  return configs[status] || configs.Success;
};

const getRunStatus = (run) => {
  if (!run.finalResult?.allStepsSucceeded) {
    return "Failed";
  }
  return "Success";
};

const getDuration = (run) => {
  if (!run.logicAppTimestamp || !run.Steps || run.Steps.length === 0) {
    return "N/A";
  }

  const startTime = new Date(run.Steps[0].email.receivedAt);
  const endTime = new Date(run.logicAppTimestamp);

  if (isNaN(startTime) || isNaN(endTime)) {
    return "N/A";
  }

  const durationMs = endTime - startTime;
  const seconds = Math.floor(durationMs / 1000);

  return `${seconds}s`;
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
  const itemsPerPage = 10;

  // Fetch data with caching
  const fetchData = async (force = false) => {
    if (!force) {
      const cached = getCachedData();
      if (cached) {
        setFlowRunsData(cached);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    if (force) setIsRefreshing(true);

    try {
      const data = await getUploads("");
      console.log("Fetched data:", data);
      const validData = Array.isArray(data) ? data : [];

      // Update state and cache
      setFlowRunsData(validData);
      setCacheData(validData);
    } catch (error) {
      console.error("Failed to fetch uploads:", error);
      // On error, fall back to cache if available
      const cached = getCachedData();
      setFlowRunsData(cached || []);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData(); // Try cache first
  }, []);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchData(true); // Force reload
  };

  // Transform and sort data: newest first
  const transformedData = useMemo(() => {
    return flowRunsData
      .map((run) => ({
        id: run.runId,
        projectName: run.companyName,
        triggerTime: run.logicAppTimestamp,
        status: getRunStatus(run),
        duration: getDuration(run),
        createdBy: run.finalResult?.checker || "Unknown",
        rawData: run,
      }))
      .sort((a, b) => new Date(b.triggerTime) - new Date(a.triggerTime)); // Newest first
  }, [flowRunsData]);

  // Get unique values for filters
  const uniqueProjects = [...new Set(transformedData.map((run) => run.projectName))];
  const uniqueStatuses = [...new Set(transformedData.map((run) => run.status))];

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = transformedData;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (run) =>
          run.id.toLowerCase().includes(term) ||
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
      {Array(5)
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
              <h2 className="text-2xl font-semibold text-[#1A1A1A]">Flow Runs</h2>
              <p className="text-[#6B6B6B] text-sm mt-1">
                {filteredData.length} total runs •{" "}
                <span className="text-[#1A1A1A] font-medium">
                  {paginatedData.length} shown
                </span>
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
                  className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
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
                placeholder="Search runs, projects, or users..."
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

              {(searchTerm || selectedProject || selectedStatus || timeRange !== "all") && (
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
                  Run ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider border-b border-[#EAEAEA]">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider border-b border-[#EAEAEA]">
                  Triggered At
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider border-b border-[#EAEAEA]">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider border-b border-[#EAEAEA]">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#EAEAEA]">
              {isLoading ? (
                // Skeleton loader
                Array.from({ length: itemsPerPage }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((run) => {
                  const statusConfig = getStatusConfig(run.status);
                  return (
                    <tr
                      key={run.id}
                      onClick={() => onSelectRun(run.rawData)}
                      className="cursor-pointer hover:bg-blue-50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-[#E54C37] rounded-full mr-3"></div>
                          <span className="text-sm font-medium text-[#1A1A1A] group-hover:text-[#E54C37] transition-colors">
                            {run.id.substring(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#1A1A1A]">
                          {run.projectName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6B6B]">
                        {new Date(run.triggerTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}
                        >
                          {statusConfig.icon}
                          <span className="ml-1">{statusConfig.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6B6B]">
                        {run.duration}
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
                      There are no test runs to display. Try adjusting your filters or trigger a new run.
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
              Showing {startIndex + 1} to {endIndex} of {filteredData.length} results
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
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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