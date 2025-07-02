import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  CheckCircle,
  ChevronDown,
  Download,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { getUploads } from "../../api/api";

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
    }
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
  const itemsPerPage = 10;

  useEffect(() => {
    getUploadsData();
    

    async function getUploadsData() {
      try {
        const data = await getUploads("");
        console.log(data);
        setFlowRunsData(data);
      } catch {
        setFlowRunsData([]);
      }
    }
  }, []);

  // Transform data
  const transformedData = useMemo(() => {
    return flowRunsData.map(run => ({
      id: run.runId,
      projectName: run.companyName,
      triggerTime: run.logicAppTimestamp,
      status: getRunStatus(run),
      duration: getDuration(run),
      createdBy: run.finalResult?.checker || "Unknown",
      rawData: run
    }));
  }, [flowRunsData]);

  // Get unique values for filters
  const uniqueProjects = [...new Set(transformedData.map(run => run.projectName))];
  const uniqueStatuses = [...new Set(transformedData.map(run => run.status))];

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = transformedData;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(run =>
        run.id.toLowerCase().includes(term) ||
        run.projectName.toLowerCase().includes(term) ||
        run.createdBy.toLowerCase().includes(term)
      );
    }

    if (selectedProject) {
      filtered = filtered.filter(run => run.projectName === selectedProject);
    }

    if (selectedStatus) {
      filtered = filtered.filter(run => run.status === selectedStatus);
    }

    if (timeRange !== "all") {
      const now = new Date();
      const cutoff = new Date();

      switch (timeRange) {
        case "today":
          cutoff.setDate(now.getDate());
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

      filtered = filtered.filter(run => new Date(run.triggerTime) >= cutoff);
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

    // Always show first page
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

    // Show ellipsis if needed
    if (currentPage > 3 && totalPages > maxVisibleButtons) {
      buttons.push(
        <span key="left-ellipsis" className="text-[#6B6B6B]">
          ...
        </span>
      );
    }

    // Calculate range of pages to show
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    if (totalPages <= maxVisibleButtons) {
      startPage = 2;
      endPage = totalPages - 1;
    }

    // Add middle pages
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

    // Show ellipsis if needed
    if (currentPage < totalPages - 2 && totalPages > maxVisibleButtons) {
      buttons.push(
        <span key="right-ellipsis" className="text-[#6B6B6B]">
          ...
        </span>
      );
    }

    // Always show last page if there is one
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

  return (
    <div className="w-full h-full bg-[#FDF9F8]">
      <div className="bg-white shadow-sm border border-[#EAEAEA] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAEAEA]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Flow Runs</h2>
              <p className="text-[#6B6B6B] text-sm mt-1">
                {filteredData.length} Total • Showing {paginatedData.length} of {filteredData.length} results
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center px-3 py-2 text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#EAEAEA] rounded-lg hover:bg-gray-50 transition-colors">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button className="flex items-center px-3 py-2 text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#EAEAEA] rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider border-b border-[#EAEAEA]">
                  Run ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider border-b border-[#EAEAEA]">
                  Project Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider border-b border-[#EAEAEA]">
                  Trigger Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider border-b border-[#EAEAEA]">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider border-b border-[#EAEAEA]">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#EAEAEA]">
              {paginatedData.length > 0 ? (
                paginatedData.map((run) => {
                  const statusConfig = getStatusConfig(run.status);
                  return (
                    <tr
                      key={run.id}
                      onClick={() => onSelectRun(run.rawData)}
                      className="cursor-pointer hover:bg-[#FDF9F8] transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-[#E54C37] rounded-full mr-3"></div>
                          <span className="text-sm font-medium text-[#1A1A1A]">
                            {run.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#1A1A1A] font-medium">
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
                    <p className="text-sm text-[#6B6B6B]">
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
              Showing {startIndex + 1} to {endIndex} of {filteredData.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {renderPaginationButtons()}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
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