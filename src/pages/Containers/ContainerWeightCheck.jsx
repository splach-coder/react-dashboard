import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Scale,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  X,
} from "lucide-react";

const API_BASE_URL = "https://functionapp-python-api-atfnhbf0b7c2b0ds.westeurope-01.azurewebsites.net/api/ContainerWeightCheck";
const API_CODE = import.meta.env.VITE_API_MAIN_KEY;

// Cache helpers
const CACHE_KEY = "containerWeightCache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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
    return data;
  } catch (e) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const setCacheData = (data) => {
  const cacheEntry = { data, timestamp: Date.now() };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
  } catch (e) {
    console.warn("Failed to save to cache", e);
  }
};

// 40 soft pastel colors with better contrast
const generateDistinctColors = () => {
  return [
    { bg: "#FEE2E2", text: "#991B1B", name: "red" },
    { bg: "#FFEDD5", text: "#9A3412", name: "orange" },
    { bg: "#FEF3C7", text: "#92400E", name: "amber" },
    { bg: "#FEF9C3", text: "#854D0E", name: "yellow" },
    { bg: "#ECFCCB", text: "#3F6212", name: "lime" },
    { bg: "#D1FAE5", text: "#065F46", name: "green" },
    { bg: "#D1FAE5", text: "#047857", name: "emerald" },
    { bg: "#CCFBF1", text: "#115E59", name: "teal" },
    { bg: "#CFFAFE", text: "#155E75", name: "cyan" },
    { bg: "#E0F2FE", text: "#075985", name: "sky" },
    { bg: "#DBEAFE", text: "#1E40AF", name: "blue" },
    { bg: "#E0E7FF", text: "#3730A3", name: "indigo" },
    { bg: "#EDE9FE", text: "#5B21B6", name: "violet" },
    { bg: "#F3E8FF", text: "#6B21A8", name: "purple" },
    { bg: "#FAE8FF", text: "#86198F", name: "fuchsia" },
    { bg: "#FCE7F3", text: "#9F1239", name: "pink" },
    { bg: "#FFE4E6", text: "#9F1239", name: "rose" },
    { bg: "#FECACA", text: "#7F1D1D", name: "light-red" },
    { bg: "#FED7AA", text: "#7C2D12", name: "light-orange" },
    { bg: "#FDE68A", text: "#78350F", name: "light-amber" },
    { bg: "#D9F99D", text: "#365314", name: "light-lime" },
    { bg: "#BBF7D0", text: "#14532D", name: "light-green" },
    { bg: "#A7F3D0", text: "#064E3B", name: "light-emerald" },
    { bg: "#99F6E4", text: "#134E4A", name: "light-teal" },
    { bg: "#A5F3FC", text: "#164E63", name: "light-cyan" },
    { bg: "#BAE6FD", text: "#0C4A6E", name: "light-sky" },
    { bg: "#BFDBFE", text: "#1E3A8A", name: "light-blue" },
    { bg: "#C7D2FE", text: "#312E81", name: "light-indigo" },
    { bg: "#DDD6FE", text: "#4C1D95", name: "light-violet" },
    { bg: "#E9D5FF", text: "#581C87", name: "light-purple" },
    { bg: "#F5D0FE", text: "#701A75", name: "light-fuchsia" },
    { bg: "#FBCFE8", text: "#831843", name: "light-pink" },
    { bg: "#FECDD3", text: "#881337", name: "light-rose" },
    { bg: "#D6D3D1", text: "#44403C", name: "stone" },
    { bg: "#E7E5E4", text: "#57534E", name: "light-stone" },
    { bg: "#E0E7FF", text: "#1E3A8A", name: "navy" },
    { bg: "#FCE7F3", text: "#831843", name: "burgundy" },
    { bg: "#D1FAE5", text: "#064E3B", name: "forest" },
    { bg: "#FED7AA", text: "#713F12", name: "bronze" },
    { bg: "#BFDBFE", text: "#1E3A8A", name: "deep-blue" },
  ];
};

const getCompanyColor = (companyName, allCompanies) => {
  const colors = generateDistinctColors();
  const sortedCompanies = [...allCompanies].sort();
  const index = sortedCompanies.indexOf(companyName);
  return colors[index % colors.length];
};

const ContainerWeightCheck = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");

  const [selectedDetail, setSelectedDetail] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async (force = false) => {
    if (force) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    const cached = getCachedData();

    try {
      const res = await fetch(`${API_BASE_URL}?code=${API_CODE}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const result = await res.json();

      const freshData = result.data || [];

      if (force && cached) {
        const cachedIds = new Set(cached.map((v) => v.declarationId));
        const freshIds = new Set(freshData.map((v) => v.declarationId));
        const hasChanges =
          cachedIds.size !== freshIds.size ||
          [...freshIds].some((id) => !cachedIds.has(id));

        if (!hasChanges) {
          setIsRefreshing(false);
          return;
        }
      }

      const sortedData = freshData.sort(
        (a, b) => b.declarationId - a.declarationId
      );
      setViolations(sortedData);
      setCacheData(sortedData);
    } catch (error) {
      console.error("Failed to fetch violations:", error);
      if (cached) {
        const sortedCache = cached.sort(
          (a, b) => b.declarationId - a.declarationId
        );
        setViolations(sortedCache);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const deleteViolation = async (declarationId) => {
    if (!confirm(`Are you sure you want to delete violation for Declaration ${declarationId}?`)) {
      return;
    }
  
    try {
      const response = await fetch(
        `${API_BASE_URL}?declarationId=${declarationId}&code=${API_CODE}`,
        { method: 'DELETE' }
      );
  
      const result = await response.json();
  
      if (result.success) {
        // Update state using callback to access current violations
        setViolations(prevViolations => {
          const updatedViolations = prevViolations.filter(v => v.declarationId !== declarationId);
          // Update cache with new data
          setCacheData(updatedViolations);
          return updatedViolations;
        });
        
        // Show success message
        alert(`✅ Violation deleted successfully! Remaining: ${result.remainingViolations}`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert(`❌ Failed to delete: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredViolations = useMemo(() => {
    let filtered = violations.filter((v) => v.violation?.hasViolation);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.declarationId.toString().includes(term) ||
          v.company.toLowerCase().includes(term)
      );
    }

    if (selectedCompany) {
      filtered = filtered.filter((v) => v.company === selectedCompany);
    }

    return filtered;
  }, [violations, searchTerm, selectedCompany]);

  const uniqueCompanies = [...new Set(violations.map((v) => v.company))];

  const companyColorMap = useMemo(() => {
    const map = new Map();
    uniqueCompanies.forEach((company) => {
      map.set(company, getCompanyColor(company, uniqueCompanies));
    });
    return map;
  }, [uniqueCompanies]);

  const summaryStats = useMemo(() => {
    const totalViolations = filteredViolations.length;
    const criticalViolations = filteredViolations.filter(
      (v) => v.violation.exceedsBy > 10000
    ).length;
    const avgExcess =
      filteredViolations.length > 0
        ? filteredViolations.reduce(
            (sum, v) => sum + v.violation.exceedsBy,
            0
          ) / filteredViolations.length
        : 0;

    return { totalViolations, criticalViolations, avgExcess };
  }, [filteredViolations]);

  // Pagination
  const totalPages = Math.ceil(filteredViolations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    filteredViolations.length
  );
  const paginatedViolations = filteredViolations.slice(startIndex, endIndex);

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;

    if (totalPages <= 1) return null;

    buttons.push(
      <button
        key={1}
        onClick={() => setCurrentPage(1)}
        className={`px-3 py-1 text-sm font-medium rounded ${
          currentPage === 1 ? "text-white" : "hover:bg-white"
        }`}
        style={{
          backgroundColor: currentPage === 1 ? "#0078d4" : "transparent",
          color: currentPage === 1 ? "#ffffff" : "#6B6B6B",
        }}
      >
        1
      </button>
    );

    if (currentPage > 3 && totalPages > maxVisibleButtons) {
      buttons.push(
        <span key="left-ellipsis" style={{ color: "#6B6B6B" }}>
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
            currentPage === i ? "text-white" : "hover:bg-white"
          }`}
          style={{
            backgroundColor: currentPage === i ? "#0078d4" : "transparent",
            color: currentPage === i ? "#ffffff" : "#6B6B6B",
          }}
        >
          {i}
        </button>
      );
    }

    if (currentPage < totalPages - 2 && totalPages > maxVisibleButtons) {
      buttons.push(
        <span key="right-ellipsis" style={{ color: "#6B6B6B" }}>
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
            currentPage === totalPages ? "text-white" : "hover:bg-white"
          }`}
          style={{
            backgroundColor:
              currentPage === totalPages ? "#0078d4" : "transparent",
            color: currentPage === totalPages ? "#ffffff" : "#6B6B6B",
          }}
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#faf9f8" }}
      >
        <div className="text-center space-y-4">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: "#0078d4" }}
          ></div>
          <p className="text-base font-medium" style={{ color: "#323130" }}>
            Loading container weight data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 md:p-6"
      style={{ backgroundColor: "#faf9f8" }}
    >
      {/* Detail Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            style={{ border: "1px solid #e1e1e1" }}
          >
            <div
              className="sticky top-0 bg-white p-4 border-b flex justify-between items-center"
              style={{ borderColor: "#e1e1e1" }}
            >
              <div>
                <h2
                  className="text-xl font-semibold"
                  style={{ color: "#323130" }}
                >
                  Declaration #{selectedDetail.declarationId}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border"
                    style={{
                      backgroundColor: companyColorMap.get(
                        selectedDetail.company
                      )?.bg,
                      color: companyColorMap.get(selectedDetail.company)?.text,
                      borderColor:
                        companyColorMap.get(selectedDetail.company)?.text +
                        "20",
                    }}
                  >
                    {selectedDetail.company}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" style={{ color: "#605e5c" }} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "#605e5c" }}
                  >
                    Total Weight
                  </p>
                  <p
                    className="text-lg font-semibold"
                    style={{ color: "#323130" }}
                  >
                    {(selectedDetail.totalGrossMass / 1000).toFixed(1)} tons
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "#605e5c" }}
                  >
                    Containers
                  </p>
                  <p
                    className="text-lg font-semibold"
                    style={{ color: "#323130" }}
                  >
                    {selectedDetail.containerCount}
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "#605e5c" }}
                  >
                    Avg per Container
                  </p>
                  <p
                    className="text-lg font-semibold"
                    style={{ color: "#d83b01" }}
                  >
                    {(selectedDetail.avgWeightPerContainer / 1000).toFixed(1)}{" "}
                    tons
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "#605e5c" }}
                  >
                    Exceeds Limit By
                  </p>
                  <p
                    className="text-lg font-semibold"
                    style={{ color: "#dc2626" }}
                  >
                    +{(selectedDetail.violation.exceedsBy / 1000).toFixed(1)}{" "}
                    tons
                  </p>
                </div>
              </div>

              <div className="border-t pt-4" style={{ borderColor: "#e1e1e1" }}>
                <h3 className="font-semibold mb-3" style={{ color: "#323130" }}>
                  Items Breakdown
                </h3>
                <div className="space-y-3">
                  {selectedDetail.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 p-4 rounded"
                      style={{ border: "1px solid #e1e1e1" }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p
                            className="font-medium"
                            style={{ color: "#323130" }}
                          >
                            Item #{item.itemSequence}
                          </p>
                          <p className="text-sm" style={{ color: "#605e5c" }}>
                            Weight: {(item.grossMass / 1000).toFixed(1)} tons
                          </p>
                        </div>
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: "#deecf9",
                            color: "#0078d4",
                          }}
                        >
                          {item.containers.length} container(s)
                        </span>
                      </div>
                      <div className="space-y-2">
                        {item.containers.map((container, cidx) => (
                          <div
                            key={cidx}
                            className="flex items-center text-sm bg-white p-2 rounded"
                            style={{ border: "1px solid #e1e1e1" }}
                          >
                            <Package
                              className="w-4 h-4 mr-2"
                              style={{ color: "#0078d4" }}
                            />
                            <span style={{ color: "#323130" }}>
                              {container.containerNumber}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1
              className="text-2xl md:text-3xl font-semibold"
              style={{ color: "#323130" }}
            >
              Container Weight Violations
            </h1>
            <p className="text-sm md:text-base" style={{ color: "#605e5c" }}>
              Declarations exceeding 25-ton container limit
            </p>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:bg-gray-400"
            style={{ backgroundColor: "#0078d4" }}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="bg-white p-4 rounded"
            style={{ border: "1px solid #e1e1e1" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "#605e5c" }}>
                  Total Violations
                </p>
                <p
                  className="text-2xl font-semibold"
                  style={{ color: "#323130" }}
                >
                  {summaryStats.totalViolations}
                </p>
              </div>
              <div
                className="p-2 rounded-sm"
                style={{ backgroundColor: "#fef2f2" }}
              >
                <AlertTriangle
                  className="h-5 w-5"
                  style={{ color: "#dc2626" }}
                />
              </div>
            </div>
          </div>

          <div
            className="bg-white p-4 rounded"
            style={{ border: "1px solid #e1e1e1" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "#605e5c" }}>
                  Critical (over 10 tons excess)
                </p>
                <p
                  className="text-2xl font-semibold"
                  style={{ color: "#d83b01" }}
                >
                  {summaryStats.criticalViolations}
                </p>
              </div>
              <div
                className="p-2 rounded-sm"
                style={{ backgroundColor: "#fff4ce" }}
              >
                <Scale className="h-5 w-5" style={{ color: "#d83b01" }} />
              </div>
            </div>
          </div>

          <div
            className="bg-white p-4 rounded"
            style={{ border: "1px solid #e1e1e1" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "#605e5c" }}>
                  Avg Excess Weight
                </p>
                <p
                  className="text-2xl font-semibold"
                  style={{ color: "#323130" }}
                >
                  {(summaryStats.avgExcess / 1000).toFixed(1)} tons
                </p>
              </div>
              <div
                className="p-2 rounded-sm"
                style={{ backgroundColor: "#deecf9" }}
              >
                <TrendingUp className="h-5 w-5" style={{ color: "#0078d4" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div
          className="bg-white p-4 rounded"
          style={{ border: "1px solid #e1e1e1" }}
        >
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: "#605e5c" }}
            />
            <input
              type="text"
              placeholder="Search by declaration ID or company..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
              style={{
                border: "1px solid #e1e1e1",
                backgroundColor: "#ffffff",
                color: "#323130",
              }}
            />
          </div>
        </div>

        {/* Violations Table */}
        <div
          className="bg-white rounded overflow-hidden"
          style={{ border: "1px solid #e1e1e1" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: "#f3f2f1" }}>
                <tr style={{ borderBottom: "1px solid #e1e1e1" }}>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "#323130" }}
                  >
                    Declaration ID
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "#323130" }}
                  >
                    Company
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "#323130" }}
                  >
                    Total Weight
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "#323130" }}
                  >
                    Containers
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "#323130" }}
                  >
                    Avg/Container
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "#323130" }}
                  >
                    Exceeds By
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "#323130" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedViolations.map((violation) => {
                  const isCritical = violation.violation.exceedsBy > 10000;
                  return (
                    <tr
                      key={violation.declarationId}
                      className="cursor-pointer transition-colors"
                      style={{
                        borderBottom: "1px solid #edebe9",
                        background: isCritical
                          ? "linear-gradient(to right, #fef2f2 0%, #fee2e2 50%, #fef2f2 100%)"
                          : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isCritical) {
                          e.currentTarget.style.backgroundColor = "#f9fafb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCritical) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <td
                        className="px-6 py-4 text-sm font-medium"
                        style={{ color: "#0078d4" }}
                      >
                        {violation.declarationId}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border"
                          style={{
                            backgroundColor: companyColorMap.get(
                              violation.company
                            )?.bg,
                            color: companyColorMap.get(violation.company)?.text,
                            borderColor:
                              companyColorMap.get(violation.company)?.text +
                              "20",
                          }}
                        >
                          {violation.company}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ color: "#323130" }}
                        onClick={() => setSelectedDetail(violation)}
                      >
                        {(violation.totalGrossMass / 1000).toFixed(1)} tons
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ color: "#323130" }}
                        onClick={() => setSelectedDetail(violation)}
                      >
                        {violation.containerCount}
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-semibold"
                        style={{ color: isCritical ? "#dc2626" : "#d83b01" }}
                        onClick={() => setSelectedDetail(violation)}
                      >
                        {(violation.avgWeightPerContainer / 1000).toFixed(1)}{" "}
                        tons
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        onClick={() => setSelectedDetail(violation)}
                      >
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: isCritical ? "#fef2f2" : "#fff4ce",
                            color: isCritical ? "#dc2626" : "#d83b01",
                            border: isCritical
                              ? "1px solid #fecaca"
                              : "1px solid #fde68a",
                          }}
                        >
                          +{(violation.violation.exceedsBy / 1000).toFixed(1)}{" "}
                          tons
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            deleteViolation(violation.declarationId);
                          }}
                          className="p-2 rounded hover:bg-red-100 transition-colors"
                          title="Delete violation"
                        >
                          <X className="w-4 h-4" style={{ color: "#dc2626" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {paginatedViolations.length === 0 && (
            <div className="px-6 py-16 text-center">
              <CheckCircle
                className="w-12 h-12 mx-auto mb-2"
                style={{ color: "#107c10" }}
              />
              <h3 className="text-lg font-medium" style={{ color: "#323130" }}>
                No Violations Found
              </h3>
              <p className="text-sm mt-1" style={{ color: "#605e5c" }}>
                All declarations are within the 25-ton container limit.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="px-6 py-4 border-t"
              style={{ borderColor: "#e1e1e1", backgroundColor: "#faf9f8" }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm" style={{ color: "#6B6B6B" }}>
                  Showing {startIndex + 1} to {endIndex} of{" "}
                  {filteredViolations.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: "#6B6B6B" }}
                  >
                    Previous
                  </button>

                  {renderPaginationButtons()}

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: "#6B6B6B" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContainerWeightCheck;
