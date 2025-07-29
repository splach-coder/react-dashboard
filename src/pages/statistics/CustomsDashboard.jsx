import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  Award,
  AlertCircle,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import UserPerformanceDashboard from "./UserPerformanceDashboard";
import { useNavigate } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CustomsDashboard = () => {
  const [activeTab, setActiveTab] = useState("import");
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [sortBy, setSortBy] = useState("total");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = `${
          import.meta.env.VITE_API_BASE_URL
        }/api/performance?code=${import.meta.env.VITE_API_CODE}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      navigate(`/statistics/performance/${selectedUser}`);
    }
  }, [selectedUser, navigate]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!data.length) return { importTotal: 0, exportTotal: 0 };

    const importTotal = data
      .filter((user) => user.team === "import")
      .reduce(
        (total, user) =>
          total +
          Object.values(user.daily_file_creations).reduce((a, b) => a + b, 0),
        0
      );

    const exportTotal = data
      .filter((user) => user.team === "export")
      .reduce(
        (total, user) =>
          total +
          Object.values(user.daily_file_creations).reduce((a, b) => a + b, 0),
        0
      );

    return { importTotal, exportTotal };
  }, [data]);

  // Calculate daily totals for chart
  const dailyTotals = useMemo(() => {
    if (!data.length) return [];

    const dates = Object.keys(data[0].daily_file_creations);
    return dates.map((date) => {
      const importCount = data
        .filter((user) => user.team === "import")
        .reduce(
          (total, user) => total + (user.daily_file_creations[date] || 0),
          0
        );

      const exportCount = data
        .filter((user) => user.team === "export")
        .reduce(
          (total, user) => total + (user.daily_file_creations[date] || 0),
          0
        );

      return { date, import: importCount, export: exportCount };
    });
  }, [data]);

  // Prepare data for Chart.js
  const chartData = {
    labels: dailyTotals.map((item) => item.date),
    datasets: [
      {
        label: "Import Team",
        data: dailyTotals.map((item) => item.import),
        backgroundColor: "rgba(0, 120, 212, 0.1)",
        borderColor: "#0078d4",
        borderWidth: 1,
      },
      {
        label: "Export Team",
        data: dailyTotals.map((item) => item.export),
        backgroundColor: "rgba(16, 124, 16, 0.1)",
        borderColor: "#107c10",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    if (!data.length) return [];

    let filtered = data.filter((user) => {
      const matchesSearch = user.user
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesTeam = teamFilter === "all" || user.team === teamFilter;
      return matchesSearch && matchesTeam;
    });

    if (sortBy === "total") {
      filtered.sort((a, b) => {
        const totalA = Object.values(a.daily_file_creations).reduce(
          (sum, val) => sum + val,
          0
        );
        const totalB = Object.values(b.daily_file_creations).reduce(
          (sum, val) => sum + val,
          0
        );
        return totalB - totalA;
      });
    } else {
      filtered.sort((a, b) => a.user.localeCompare(b.user));
    }

    return filtered;
  }, [data, searchTerm, teamFilter, sortBy]);

  const getUserStats = (user) => {
    const dailyValues = Object.values(user.daily_file_creations);
    const total = dailyValues.reduce((sum, val) => sum + val, 0);
    const maxDay = Math.max(...dailyValues);
    const maxDate = Object.keys(user.daily_file_creations).find(
      (date) => user.daily_file_creations[date] === maxDay
    );
    const hasZeroActivity = dailyValues.includes(0);

    return { total, maxDay, maxDate, hasZeroActivity };
  };

  const TeamTable = ({ users }) => {
    if (!data.length) return null;
    const dates = Object.keys(data[0].daily_file_creations);

    return (
      <div
        className="bg-white"
        style={{ borderRadius: "2px", border: "1px solid #e1e1e1" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  backgroundColor: "#f3f2f1",
                  borderBottom: "1px solid #e1e1e1",
                }}
              >
                <th
                  className="py-3 px-4 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10 min-w-[180px]"
                  style={{ backgroundColor: "#f3f2f1" }}
                >
                  User Name
                </th>
                {dates.map((date) => (
                  <th
                    key={date}
                    className="px-3 py-3 text-center text-sm font-medium min-w-[80px]"
                    style={{ color: "#323130" }}
                  >
                    {date}
                  </th>
                ))}
                <th
                  className="px-4 py-3 text-center text-sm font-medium min-w-[80px]"
                  style={{ backgroundColor: "#faf9f8", color: "#323130" }}
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                const stats = getUserStats(user);
                const teamColor =
                  user.team === "import" ? "#0078d4" : "#107c10";
                const teamBg = user.team === "import" ? "#deecf9" : "#dff6dd";

                return (
                  <tr
                    key={user.user}
                    onClick={() => setSelectedUser(user.user)}
                    className="hover:bg-gray-50"
                    style={{ borderBottom: "1px solid #edebe9" }}
                  >
                    <td
                      className="py-3 px-4 text-sm font-medium sticky left-0 bg-white z-10"
                      style={{ borderRight: "1px solid #e1e1e1" }}
                    >
                      <div className="flex items-center">
                        <div
                          className="h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: teamColor }}
                        >
                          {user.user.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div
                            className="font-medium text-sm"
                            style={{ color: "#323130" }}
                          >
                            {user.user.replace(/\./g, " ")}
                          </div>
                          <span
                            className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: teamBg,
                              color: teamColor,
                              borderRadius: "2px",
                            }}
                          >
                            {user.team.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>
                    {dates.map((date) => {
                      const count = user.daily_file_creations[date];
                      const isMaxDay = count === stats.maxDay && count > 0;
                      const isZeroDay = count === 0;

                      return (
                        <td
                          key={date}
                          className="px-3 py-3 text-sm text-center relative"
                        >
                          <div
                            className={`inline-flex items-center justify-center h-7 w-7 text-sm font-medium relative`}
                            style={{
                              backgroundColor: isMaxDay
                                ? "#fff4ce"
                                : isZeroDay
                                ? "#f3f2f1"
                                : "#deecf9",
                              color: isMaxDay
                                ? "#8a6914"
                                : isZeroDay
                                ? "#605e5c"
                                : "#0078d4",
                              borderRadius: "2px",
                              border: isMaxDay
                                ? "1px solid #ffb900"
                                : "1px solid transparent",
                            }}
                          >
                            {count}
                            {isMaxDay && (
                              <Award className="absolute -top-1 -right-1 h-3 w-3 text-yellow-600" />
                            )}
                            {isZeroDay && (
                              <AlertCircle className="absolute -top-1 -right-1 h-3 w-3 text-orange-500" />
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td
                      className="px-4 py-3 text-sm text-center font-semibold"
                      style={{
                        backgroundColor: "#faf9f8",
                        borderLeft: "1px solid #e1e1e1",
                        color: "#323130",
                      }}
                    >
                      {stats.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot
              style={{
                backgroundColor: "#f3f2f1",
                borderTop: "2px solid #e1e1e1",
              }}
            >
              <tr>
                <th
                  className="py-3 px-4 text-left text-sm font-semibold sticky left-0 z-10"
                  style={{ backgroundColor: "#f3f2f1", color: "#323130" }}
                >
                  Daily Totals
                </th>
                {dates.map((date) => {
                  const dayTotal = users.reduce(
                    (sum, user) => sum + (user.daily_file_creations[date] || 0),
                    0
                  );
                  return (
                    <td
                      key={date}
                      className="px-3 py-3 text-center text-sm font-semibold"
                    >
                      <div
                        className="inline-flex items-center justify-center h-7 w-7 text-white text-sm font-medium"
                        style={{
                          backgroundColor: "#0078d4",
                          borderRadius: "2px",
                        }}
                      >
                        {dayTotal}
                      </div>
                    </td>
                  );
                })}
                <td
                  className="px-4 py-3 text-center text-sm font-semibold"
                  style={{
                    backgroundColor: "#edebe9",
                    borderLeft: "1px solid #d2d0ce",
                    color: "#323130",
                  }}
                >
                  {users.reduce(
                    (sum, user) => sum + getUserStats(user).total,
                    0
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Legend */}
        <div
          className="px-4 py-3"
          style={{ backgroundColor: "#faf9f8", borderTop: "1px solid #e1e1e1" }}
        >
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-sm"
                style={{
                  backgroundColor: "#fff4ce",
                  border: "1px solid #ffb900",
                }}
              ></div>
              <span style={{ color: "#605e5c" }}>Best performing day</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-sm"
                style={{ backgroundColor: "#f3f2f1" }}
              ></div>
              <span style={{ color: "#605e5c" }}>No activity</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-sm"
                style={{ backgroundColor: "#deecf9" }}
              ></div>
              <span style={{ color: "#605e5c" }}>Normal activity</span>
            </div>
          </div>
        </div>
      </div>
    );
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
            style={{ borderColor: "#0078d4", borderTopColor: "transparent" }}
          ></div>
          <p className="text-base font-medium" style={{ color: "#323130" }}>
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#faf9f8" }}
      >
        <div
          className="text-center max-w-md p-6 bg-white space-y-4"
          style={{ borderRadius: "2px", border: "1px solid #d83b01" }}
        >
          <AlertCircle
            className="h-8 w-8 mx-auto"
            style={{ color: "#d83b01" }}
          />
          <h2 className="text-lg font-semibold" style={{ color: "#323130" }}>
            Error Loading Data
          </h2>
          <p className="text-sm" style={{ color: "#605e5c" }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-white font-medium text-sm transition-colors hover:opacity-90"
            style={{
              backgroundColor: "#0078d4",
              borderRadius: "2px",
              border: "none",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 md:p-6"
      style={{ backgroundColor: "#faf9f8" }}
    >
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1
            className="text-2xl md:text-3xl font-semibold"
            style={{ color: "#323130" }}
          >
            File Creation Analytics
          </h1>
          <p className="text-sm md:text-base" style={{ color: "#605e5c" }}>
            Customs Declaration Platform - Last 10 Working Days
          </p>
        </div>

        {/* Section 1: Summary Overview */}
        <div className="space-y-4">
          <h2
            className="text-lg md:text-xl font-medium"
            style={{ color: "#323130" }}
          >
            Summary Overview
          </h2>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Summary Cards */}
            <div
              className="bg-white p-4"
              style={{ borderRadius: "2px", border: "1px solid #e1e1e1" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "#605e5c" }}>
                    Total Files Created
                  </p>
                  <p
                    className="text-xl md:text-2xl font-semibold"
                    style={{ color: "#323130" }}
                  >
                    {summaryStats.importTotal + summaryStats.exportTotal}
                  </p>
                </div>
                <div
                  className="p-2 rounded-sm"
                  style={{ backgroundColor: "#deecf9" }}
                >
                  <FileText className="h-4 w-4" style={{ color: "#0078d4" }} />
                </div>
              </div>
            </div>

            <div
              className="bg-white p-4"
              style={{ borderRadius: "2px", border: "1px solid #e1e1e1" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "#0078d4" }}>
                    Import Team
                  </p>
                  <p
                    className="text-xl md:text-2xl font-semibold"
                    style={{ color: "#0078d4" }}
                  >
                    {summaryStats.importTotal}
                  </p>
                </div>
                <div
                  className="p-2 rounded-sm"
                  style={{ backgroundColor: "#dff6dd" }}
                >
                  <TrendingUp
                    className="h-4 w-4"
                    style={{ color: "#0078d4" }}
                  />
                </div>
              </div>
            </div>

            <div
              className="bg-white p-4"
              style={{ borderRadius: "2px", border: "1px solid #e1e1e1" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "#107c10" }}>
                    Export Team
                  </p>
                  <p
                    className="text-xl md:text-2xl font-semibold"
                    style={{ color: "#107c10" }}
                  >
                    {summaryStats.exportTotal}
                  </p>
                </div>
                <div
                  className="p-2 rounded-sm"
                  style={{ backgroundColor: "#deecf9" }}
                >
                  <TrendingUp
                    className="h-4 w-4"
                    style={{ color: "#107c10" }}
                  />
                </div>
              </div>
            </div>

            {/* Daily Comparison Chart */}
            <div
              className="xl:col-span-1 bg-white p-4"
              style={{ borderRadius: "2px", border: "1px solid #e1e1e1" }}
            >
              <h3
                className="text-sm font-medium mb-3"
                style={{ color: "#323130" }}
              >
                Daily Comparison
              </h3>
              <div className="h-32">
                <Bar
                  data={chartData}
                  options={{
                    ...chartOptions,
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        mode: "index",
                        intersect: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0,
                          font: {
                            size: 10,
                          },
                        },
                      },
                      x: {
                        ticks: {
                          font: {
                            size: 10,
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Filtering + Search */}
        <div>
          <div
            className="bg-white p-1 md:p-3"
            style={{ borderRadius: "2px", border: "1px solid #e1e1e1" }}
          >
            <div className="flex flex-col lg:flex-row gap-2">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4" style={{ color: "#605e5c" }} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by username..."
                    className="block w-full pl-10 pr-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2"
                    style={{
                      border: "1px solid #e1e1e1",
                      borderRadius: "2px",
                      backgroundColor: "#ffffff",
                      color: "#323130",
                    }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = "#0078d4")}
                    onBlur={(e) => (e.target.style.borderColor = "#e1e1e1")}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <select
                  className="block w-full px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2"
                  style={{
                    border: "1px solid #e1e1e1",
                    borderRadius: "2px",
                    backgroundColor: "#ffffff",
                    color: "#323130",
                  }}
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = "#0078d4")}
                  onBlur={(e) => (e.target.style.borderColor = "#e1e1e1")}
                >
                  <option value="all">All Teams</option>
                  <option value="import">Import</option>
                  <option value="export">Export</option>
                </select>

                <select
                  className="block w-full px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2"
                  style={{
                    border: "1px solid #e1e1e1",
                    borderRadius: "2px",
                    backgroundColor: "#ffffff",
                    color: "#323130",
                  }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = "#0078d4")}
                  onBlur={(e) => (e.target.style.borderColor = "#e1e1e1")}
                >
                  <option value="total">Sort by Total Files</option>
                  <option value="name">Sort by Name</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Team Breakdown */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2
              className="text-lg md:text-xl font-medium"
              style={{ color: "#323130" }}
            >
              Team Breakdown
            </h2>

            {/* Team Tabs */}
            <div
              className="flex p-1"
              style={{ backgroundColor: "#f3f2f1", borderRadius: "2px" }}
            >
              <button
                className={`px-4 py-2 font-medium text-sm md:text-base transition-colors`}
                style={{
                  backgroundColor:
                    activeTab === "import" ? "#0078d4" : "transparent",
                  color: activeTab === "import" ? "#ffffff" : "#323130",
                  borderRadius: "2px",
                }}
                onClick={() => setActiveTab("import")}
              >
                Import ({data.filter((u) => u.team === "import").length})
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm md:text-base transition-colors`}
                style={{
                  backgroundColor:
                    activeTab === "export" ? "#107c10" : "transparent",
                  color: activeTab === "export" ? "#ffffff" : "#323130",
                  borderRadius: "2px",
                }}
                onClick={() => setActiveTab("export")}
              >
                Export ({data.filter((u) => u.team === "export").length})
              </button>
            </div>
          </div>

          {/* Team Table */}
          <TeamTable
            users={filteredUsers.filter((user) => user.team === activeTab)}
          />
        </div>
      </div>
      {selectedUser && (
        <div className="mt-6">
          <UserPerformanceDashboard username={selectedUser} />
        </div>
      )}
    </div>
  );
};

export default CustomsDashboard;
