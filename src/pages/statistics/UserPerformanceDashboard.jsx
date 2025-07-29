import React, { useState, useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  User,
  Clock,
  FileText,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronRight,
  Activity,
  Building2,
  X,
  BarChart3,
  PieChart,
  Users,
  Timer,
  ChevronLeft,
  ChevronUp,
  Zap,
  FileEdit,
  FilePlus,
  FileMinus,
  Award,
} from "lucide-react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import { useParams, useNavigate } from "react-router-dom";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const UserPerformanceDashboard = ({ onClose }) => {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const dashboardRef = useRef(null);
  const navigate = useNavigate();

  // Chart.js options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.raw}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#f1f5f9",
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  // Transform API data to component format
  const transformApiData = (apiData) => {
    if (!apiData) return null;

    // Transform daily metrics
    const dailyMetrics = apiData.daily_metrics.map((day) => ({
      date: new Date(day.date).toLocaleDateString("en-GB"),
      manual: day.manual_files_created,
      auto: day.automatic_files_created,
      modifs: day.modification_count,
      files: day.manual_files_created + day.automatic_files_created,
      avgTime: day.avg_creation_time,
      manualFileIds: day.manual_file_ids || [],
      autoFileIds: day.automatic_file_ids || [],
      modificationFileIds: day.modification_file_ids || [],
    }));

    // Sort daily metrics by date (oldest first)
    dailyMetrics.sort(
      (a, b) =>
        new Date(a.date.split("/").reverse().join("-")) -
        new Date(b.date.split("/").reverse().join("-"))
    );

    // Transform chart data for daily files (total only)
    const dailyFiles = dailyMetrics.map((day) => ({
      date: day.date.split("/").slice(0, 2).join("/"),
      total: day.files,
    }));

    // Transform company specialization
    const companySpecialization = Object.entries(
      apiData.summary.company_specialization || {}
    )
      .map(([company, files]) => ({
        company,
        files,
      }))
      .sort((a, b) => b.files - a.files);

    // Find most active company
    const mostActiveCompany = companySpecialization[0] || {
      company: "N/A",
      files: 0,
    };

    // Transform activity by hour for heatmap
    const activityByHour = apiData.summary.activity_by_hour || {};
    const hourLabels = Array.from({ length: 24 }, (_, i) => i).filter(
      (hour) => hour >= 6 && hour <= 19
    );
    const hourlyActivity = hourLabels.map((hour) => ({
      hour: `${hour}:00`,
      activity: activityByHour[hour] || 0,
    }));

    // Generate active days for calendar heatmap (last 4 months)
    const today = new Date();
    const startDate = subDays(today, 120); // Show last 4 months
    const allDays = eachDayOfInterval({
      start: startDate,
      end: today,
    }).reverse();

    const activeDays = allDays.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const isActive = apiData.summary.activity_days[dateStr] !== undefined;
      const isInactive = apiData.summary.inactivity_days.includes(dateStr);
      const count = apiData.summary.activity_days[dateStr] || 0;

      return {
        date: dateStr,
        count: isActive ? count : 0,
        active: isActive && !isInactive,
      };
    });

    // Transform file types
    const fileTypes = Object.entries(
      apiData.summary.file_type_counts || {}
    ).map(([type, count]) => ({
      type,
      count,
    }));

    return {
      user: {
        name: apiData.user
          .replace(".", " ")
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        team: "Export Team",
        totalFiles: apiData.summary.total_files_handled,
        totalModifications: apiData.summary.total_modifications,
        manualPercentage: Math.round(
          apiData.summary.manual_vs_auto_ratio.manual_percent
        ),
        autoPercentage: Math.round(
          apiData.summary.manual_vs_auto_ratio.automatic_percent
        ),
        avgTime: apiData.summary?.avg_creation_time != null
        ? apiData.summary.avg_creation_time.toFixed(2)
        : "Very Quick ",
        avgFilesPerDay: apiData.summary.avg_files_per_day.toFixed(1),
        mostProductiveDay: format(
          new Date(apiData.summary.most_productive_day),
          "MMMM d, yyyy"
        ),
        mostActiveCompany: mostActiveCompany.company,
        mostActiveCompanyFiles: mostActiveCompany.files,
        mostActiveHour: `${apiData.summary.hour_with_most_activity}:00`,
        daysActive: apiData.summary.days_active,
        modificationsPerFile: apiData.summary.modifications_per_file.toFixed(1),
      },
      dailyMetrics,
      chartData: {
        dailyFiles,
        companySpecialization,
        manualVsAuto: [
          {
            name: "Manual",
            value: Math.round(
              apiData.summary.manual_vs_auto_ratio.manual_percent
            ),
            color: "#3b82f6",
          },
          {
            name: "Auto",
            value: Math.round(
              apiData.summary.manual_vs_auto_ratio.automatic_percent
            ),
            color: "#10b981",
          },
        ],
        activeDays,
        fileTypes,
        hourlyActivity,
      },
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/performance?user=${username}&code=${
            import.meta.env.VITE_API_CODE
          }`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiData = await response.json();
        const transformedData = transformApiData(apiData);
        setData(transformedData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  const toggleRow = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const getHeatmapClass = (value) => {
    if (!value || !value.active) return "color-empty";
    if (value.count >= 100) return "color-scale-4";
    if (value.count >= 50) return "color-scale-3";
    if (value.count >= 20) return "color-scale-2";
    if (value.count >= 1) return "color-scale-1";
    return "color-empty";
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <X className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">Error loading dashboard</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Chart.js data configurations
  const lineChartData = {
    labels: data.chartData.dailyFiles.map((d) => d.date),
    datasets: [
      {
        label: "Total Files Created",
        data: data.chartData.dailyFiles.map((d) => d.total),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 3,
        tension: 0.3,
        pointBackgroundColor: "#3b82f6",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const doughnutChartData = {
    labels: data.chartData.manualVsAuto.map((d) => d.name),
    datasets: [
      {
        data: data.chartData.manualVsAuto.map((d) => d.value),
        backgroundColor: ["#3b82f6", "#10b981"],
        borderWidth: 0,
        cutout: "70%",
      },
    ],
  };

  const barChartData = {
    labels: data.chartData.companySpecialization
      .slice(0, 6)
      .map((d) => d.company),
    datasets: [
      {
        label: "Files Handled",
        data: data.chartData.companySpecialization
          .slice(0, 6)
          .map((d) => d.files),
        backgroundColor: "rgba(99, 102, 241, 0.8)",
        borderRadius: 6,
        borderWidth: 0,
      },
    ],
  };

  const hourlyActivityData = {
    labels: data.chartData.hourlyActivity.map((d) => d.hour),
    datasets: [
      {
        label: "Activity Count",
        data: data.chartData.hourlyActivity.map((d) => d.activity),
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderRadius: 4,
        borderWidth: 0,
      },
    ],
  };

  const handleCloseClick = () => {
    navigate("/statistics/performance");
  };

  return (
    <div className="bg-white" ref={dashboardRef}>
      <div className="min-h-screen">
        {/* Header with close button */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {data.user.name}
                </h1>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close dashboard"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>

          <button onClick={handleCloseClick} className="btn-class">
            Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Stats Grid - Now with 5 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Files</p>
                  <p className="text-xl font-bold text-gray-900">
                    {data.user.totalFiles}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="inline-flex items-center">
                      <FileEdit className="h-3 w-3 mr-1 text-purple-500" />
                      {data.user.totalModifications} modifications
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Work Distribution</p>
                  <p className="text-xl font-bold text-gray-900">
                    {data.user.manualPercentage}% Manual
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.user.autoPercentage}% Automatic
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Productivity</p>
                  <p className="text-xl font-bold text-gray-900">
                    {data.user.avgFilesPerDay} files/day
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.user.avgTime}m avg time
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Peak Activity</p>
                  <p className="text-xl font-bold text-gray-900">
                    {data.user.mostActiveHour}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.user.daysActive} active days
                  </p>
                </div>
              </div>
            </div>

            {/* New card for top company */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Top Company</p>
                  <p className="text-xl font-bold text-gray-900 truncate">
                    {data.user.mostActiveCompany}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.user.mostActiveCompanyFiles} files handled
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Line Chart - Daily Performance */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Daily Performance
                  </h3>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>Files Created</span>
                </div>
              </div>
              <div className="h-64">
                <Line
                  data={lineChartData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Enhanced Doughnut Chart - Work Distribution */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Work Distribution
                  </h3>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                    <span>Manual</span>
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    <span>Auto</span>
                  </span>
                </div>
              </div>
              <div className="h-64 flex items-center justify-center">
                <div className="w-full h-full">
                  <Doughnut
                    data={doughnutChartData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          position: "right",
                          labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: "circle",
                            font: {
                              size: 12,
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-600">
                  {data.user.modificationsPerFile} modifications per file
                </p>
              </div>
            </div>

            {/* Company Specialization */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Top Companies
                </h3>
              </div>
              <div className="h-64">
                <Bar
                  data={barChartData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Combined Activity Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Activity Heatmap */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Hourly Activity Pattern
                </h3>
              </div>
              <div className="h-64">
                <Bar
                  data={hourlyActivityData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Activity Calendar (now always expanded) */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Activity (4 months)
                </h3>
              </div>
              <div className="h-64">
                <CalendarHeatmap
                  startDate={subDays(new Date(), 120)}
                  endDate={new Date()}
                  values={data.chartData.activeDays}
                  classForValue={getHeatmapClass}
                  tooltipDataAttrs={(value) => {
                    if (!value || !value.date) return {};
                    return {
                      "data-tip": `${value.date}: ${
                        value.active
                          ? `${value.count} activities`
                          : "No activity"
                      }`,
                    };
                  }}
                  showWeekdayLabels={true}
                  gutterSize={2}
                  horizontal={true}
                />
              </div>
            </div>
          </div>

          {/* Daily Metrics Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <FilePlus className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Activity Details
                </h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.dailyMetrics.map((day, index) => (
                    <React.Fragment key={index}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {day.date}
                          {day.date.includes(
                            format(
                              new Date(data.user.mostProductiveDay),
                              "dd/MM/yyyy"
                            )
                          ) && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Peak Day
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {day.manual}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {day.auto}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {day.modifs}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {day.files}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {day.avgTime}m
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          <button
                            onClick={() => toggleRow(index)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            aria-label={
                              expandedRows.has(index)
                                ? "Collapse details"
                                : "Expand details"
                            }
                          >
                            {expandedRows.has(index) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(index) && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50">
                            <div className="text-sm text-gray-600 space-y-2">
                              {day.manualFileIds.length > 0 && (
                                <div>
                                  <span className="font-medium text-blue-700">
                                    Manual Files:
                                  </span>{" "}
                                  {day.manualFileIds.slice(0, 10).join(", ")}
                                  {day.manualFileIds.length > 10 &&
                                    ` ... and ${
                                      day.manualFileIds.length - 10
                                    } more`}
                                </div>
                              )}
                              {day.autoFileIds.length > 0 && (
                                <div>
                                  <span className="font-medium text-green-700">
                                    Auto Files:
                                  </span>{" "}
                                  {day.autoFileIds.slice(0, 10).join(", ")}
                                  {day.autoFileIds.length > 10 &&
                                    ` ... and ${
                                      day.autoFileIds.length - 10
                                    } more`}
                                </div>
                              )}
                              {day.modificationFileIds.length > 0 && (
                                <div>
                                  <span className="font-medium text-purple-700">
                                    Modified Files:
                                  </span>{" "}
                                  {day.modificationFileIds
                                    .slice(0, 10)
                                    .join(", ")}
                                  {day.modificationFileIds.length > 10 &&
                                    ` ... and ${
                                      day.modificationFileIds.length - 10
                                    } more`}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* File Types Distribution */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              File Types Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.chartData.fileTypes.map((fileType, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center p-4 bg-gray-50 rounded-lg"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {fileType.type}
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {fileType.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPerformanceDashboard;