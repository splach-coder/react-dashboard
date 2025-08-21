/* UserPerformanceDashboard.jsx */
import React, { useState, useEffect, useCallback } from "react";
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
  RefreshCw, Award ,
  User, Clock, FileText, TrendingUp, Calendar, ChevronDown, ChevronRight,
  Activity, X, BarChart3, PieChart, Users, Zap, FileEdit,
  FilePlus, Search, Download,
} from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { useParams, useNavigate } from "react-router-dom";

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

/* ---------- transform helper ---------- */
const transformApiData = (apiData) => {
  if (!apiData || !apiData.daily_metrics) return null;

  const dailyMetrics = apiData.daily_metrics.map((day) => {
    const date = new Date(day.date); 
    return {
      date: format(date, "dd/MM/yyyy"), 
      manual: day.manual_files_created,
      auto: day.automatic_files_created,
      modifs: day.modification_count,
      files: day.total_files_handled,
      avgTime: day.avg_creation_time != null
        ? day.avg_creation_time.toFixed(2)
        : "0.00",
      modPerFile: day.total_files_handled > 0
        ? (day.modification_count / day.total_files_handled).toFixed(2)
        : "0.00",
      manualFileIds: Array.isArray(day.manual_file_ids) ? day.manual_file_ids : [],
      autoFileIds: Array.isArray(day.automatic_file_ids) ? day.automatic_file_ids : [],
      modificationFileIds: Array.isArray(day.modification_file_ids) ? day.modification_file_ids : [],
    };
  });

  // Sort: Newest first
  dailyMetrics.sort((a, b) => {
    const [d1, m1, y1] = a.date.split('/');
    const [d2, m2, y2] = b.date.split('/');
    return new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1);
  });

  // Chart: Oldest to newest (left → right)
  const dailyFiles = [...dailyMetrics]
    .sort((a, b) => {
      const [d1, m1, y1] = a.date.split('/');
      const [d2, m2, y2] = b.date.split('/');
      return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
    })
    .map((d) => ({
      date: d.date.slice(0, 5), // "19/08"
      total: d.files,
    }));

  const companySpecialization = Object.entries(apiData.summary.company_specialization || {})
    .map(([company, files]) => ({ company, files }))
    .sort((a, b) => b.files - a.files);

  const mostActiveCompany = companySpecialization[0] || { company: "N/A", files: 0 };

  const activityByHour = apiData.summary.activity_by_hour || {};
  const hourLabels = Array.from({ length: 24 }, (_, i) => i).filter(h => h >= 6 && h <= 19);
  const hourlyActivity = hourLabels.map((h) => ({
    hour: `${h}:00`,
    activity: activityByHour[h] || 0,
  }));

  const today = new Date();
  const startDate = subDays(today, 120);
  const allDays = eachDayOfInterval({ start: startDate, end: today });
  const activityDataMap = new Map(Object.entries(apiData.summary.activity_days));

  const activeDays = allDays.map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return {
      date: dateStr,
      count: activityDataMap.get(dateStr) || 0,
    };
  });

  const fileTypes = Object.entries(apiData.summary.file_type_counts || {}).map(
    ([type, count]) => ({ type, count })
  );

  return {
    user: {
      name: apiData.user
        .replace(".", " ")
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      team: "Export Team",
      totalFiles: apiData.summary.total_files_handled,
      totalModifications: apiData.summary.total_modifications,
      manualPercentage: Math.round(apiData.summary.manual_vs_auto_ratio.manual_percent),
      autoPercentage: Math.round(apiData.summary.manual_vs_auto_ratio.automatic_percent),
      avgTime: apiData.summary.avg_creation_time != null
        ? apiData.summary.avg_creation_time.toFixed(2)
        : "0.00",
      avgFilesPerDay: apiData.summary.avg_files_per_day.toFixed(1),
      mostProductiveDay: apiData.summary.most_productive_day
        ? format(new Date(apiData.summary.most_productive_day), "dd/MM/yyyy")
        : "N/A",
      mostActiveCompany: mostActiveCompany.company,
      mostActiveCompanyFiles: mostActiveCompany.files,
      mostActiveHour: `${apiData.summary.hour_with_most_activity}:00`,
      daysActive: apiData.summary.days_active,
      modificationsPerFile: apiData.summary.modifications_per_file.toFixed(2),
    },
    dailyMetrics,
    chartData: {
      dailyFiles,
      companySpecialization,
      manualVsAuto: [
        {
          name: "Manual",
          value: Math.round(apiData.summary.manual_vs_auto_ratio.manual_percent),
          color: "#3b82f6",
        },
        {
          name: "Auto",
          value: Math.round(apiData.summary.manual_vs_auto_ratio.automatic_percent),
          color: "#10b981",
        },
      ],
      activeDays,
      fileTypes,
      hourlyActivity,
    },
  };
};

// --- Skeleton Loading Component ---
const SkeletonLoader = () => (
  <div className="bg-white min-h-screen p-6">
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-64 bg-gray-200 rounded mt-2"></div>
          </div>
        </div>
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>)}
      </div>
      <div className="h-96 bg-gray-200 rounded-xl"></div>
    </div>
  </div>
);

// --- Custom Calendar Heatmap Component ---
const CustomCalendarHeatmap = ({ values }) => {
  const today = new Date();
  const startDate = subDays(today, 120);
  const weekStartsOn = 1;

  const days = eachDayOfInterval({ start: startDate, end: today });
  const dataMap = new Map(values.map(v => [v.date, v.count]));

  const firstDay = days[0];
  const dayOfWeek = firstDay.getDay();
  const paddingDays = (dayOfWeek === 0 ? 6 : dayOfWeek - weekStartsOn);

  const grid = Array(paddingDays).fill(null).concat(days);

  const getHeatmapColor = (count) => {
    if (count > 100) return "bg-red-700";
    if (count > 50) return "bg-red-600";
    if (count > 20) return "bg-red-500";
    if (count > 0) return "bg-red-400";
    return "bg-gray-100";
  };

  const monthLabels = grid.reduce((acc, day, i) => {
    if (day && day.getDate() === 1) {
      acc.push({ label: format(day, 'MMM'), index: Math.floor(i / 7) });
    }
    return acc;
  }, []);

  return (
    <div className="flex space-x-4 w-full p-2">
      <div className="flex flex-col justify-around text-sm text-gray-500 h-32">
        <span>Mon</span>
        <span>Wed</span>
        <span>Fri</span>
      </div>
      <div className="flex-1">
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 h-48">
          {grid.map((day, index) => {
            if (!day) return <div key={`pad-${index}`} />;
            const dateStr = format(day, 'yyyy-MM-dd');
            const count = dataMap.get(dateStr) || 0;
            return (
              <div
                key={dateStr}
                className={`w-full h-full rounded ${getHeatmapColor(count)}`}
                title={`${count} activities on ${format(day, 'MMM d, yyyy')}`}
              />
            );
          })}
        </div>
        <div className="relative h-4 mt-2">
          {monthLabels.map(({ label, index }) => (
            <span key={label} className="absolute text-sm text-gray-500" style={{ left: `${(index / (grid.length / 7)) * 100}%` }}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- component ---------- */
const UserPerformanceDashboard = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [filterText, setFilterText] = useState('');

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true, font: { size: 12 } } },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: "#f1f5f9" }, ticks: { font: { size: 11 } } },
    },
  };

  /* ---------- fetch logic ---------- */
  const fetchUser = useCallback(async (force = false) => {
    if (force) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/performance?user=${username}&code=${import.meta.env.VITE_API_CODE}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const apiData = await res.json();
      const transformed = transformApiData(apiData);
      if (!transformed) throw new Error("Invalid or incomplete data received");
      setData(transformed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [username]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const toggleRow = (index) => {
    const s = new Set(expandedRows);
    s.has(index) ? s.delete(index) : s.add(index);
    setExpandedRows(s);
  };

  // Safe sorting
  const sortedAndFilteredMetrics = React.useMemo(() => {
    if (!data || !data.dailyMetrics) return [];

    let filtered = data.dailyMetrics.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(filterText.toLowerCase())
      )
    );

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.key === 'date') {
        const [d1, m1, y1] = aValue.split('/');
        const [d2, m2, y2] = bValue.split('/');
        const dateA = new Date(y1, m1 - 1, d1);
        const dateB = new Date(y2, m2 - 1, d2);
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      const numA = parseFloat(aValue);
      const numB = parseFloat(bValue);
      if (isNaN(numA) || isNaN(numB)) return 0;

      return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
    });

    return filtered;
  }, [data, sortConfig, filterText]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Manual', 'Total Files', 'Modifications', 'Modifications/File', 'Avg Time (min)'];
    const csvContent = [
      headers.join(','),
      ...sortedAndFilteredMetrics.map(row => [
        row.date,
        row.manual,
        row.files,
        row.modifs,
        row.modPerFile,
        row.avgTime,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `user_activity_${username}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <SkeletonLoader />;
  if (error) return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-2xl border">
        <X className="h-12 w-12 mx-auto mb-2 text-red-500" />
        <p className="text-lg font-semibold">Error Loading Dashboard</p>
        <p className="text-sm text-gray-600 mt-2">{error}</p>
        <button onClick={() => fetchUser(true)} className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
          Retry
        </button>
      </div>
    </div>
  );
  if (!data) return null;

  /* ---------- charts ---------- */
  const lineChartData = {
    labels: data.chartData.dailyFiles.map(d => d.date),
    datasets: [
      {
        label: "Total Files Created",
        data: data.chartData.dailyFiles.map(d => d.total),
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
    labels: data.chartData.manualVsAuto.map(d => d.name),
    datasets: [
      {
        data: data.chartData.manualVsAuto.map(d => d.value),
        backgroundColor: ["#3b82f6", "#10b981"],
        borderWidth: 0,
        cutout: "70%",
      },
    ],
  };

  const barChartData = {
    labels: data.chartData.companySpecialization.slice(0, 6).map(d => d.company),
    datasets: [
      {
        label: "Files Handled",
        data: data.chartData.companySpecialization.slice(0, 6).map(d => d.files),
        backgroundColor: "rgba(99, 102, 241, 0.8)",
        borderRadius: 6,
        borderWidth: 0,
      },
    ],
  };

  const hourlyActivityData = {
    labels: data.chartData.hourlyActivity.map(d => d.hour),
    datasets: [
      {
        label: "Activity Count",
        data: data.chartData.hourlyActivity.map(d => d.activity),
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderRadius: 4,
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.user.name}</h1>
              <p className="text-sm text-gray-500">90-Day Performance Summary</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchUser(true)}
              disabled={isRefreshing}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => navigate("/statistics/performance")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close dashboard"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* body */}
      <div className="p-6 space-y-6">
        {/* top stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={<FileText />}
            title="Total Files"
            value={data.user.totalFiles}
            sub={`${data.user.totalModifications} modifications`}
            color="blue"
          />
          <StatCard
            icon={<Activity />}
            title="Work Distribution"
            value={`${data.user.manualPercentage}% Manual`}
            sub={`${data.user.autoPercentage}% Auto`}
            color="green"
          />
          <StatCard
            icon={<TrendingUp />}
            title="Productivity"
            value={`${data.user.avgFilesPerDay} files/day`}
            sub={`${data.user.avgTime}m avg time`}
            color="purple"
          />
          <StatCard
            icon={<Zap />}
            title="Peak Activity"
            value={data.user.mostActiveHour}
            sub={`${data.user.daysActive} active days`}
            color="orange"
          />
          <StatCard
            icon={<Award />}
            title="Top Company"
            value={data.user.mostActiveCompany}
            sub={`${data.user.mostActiveCompanyFiles} files`}
            color="indigo"
          />
        </div>

        {/* Insight Panel */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Performance Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InsightCard
              title="Avg Modifications/File"
              value={data.user.modificationsPerFile}
              subtitle="High engagement per file"
              icon={<FileEdit />}
              color="blue"
            />
            <InsightCard
              title="Most Active Hour"
              value={data.user.mostActiveHour}
              subtitle="Peak productivity window"
              icon={<Clock />}
              color="orange"
            />
            <InsightCard
              title="Efficiency Benchmark"
              value="High Performer"
              subtitle="Deep work with fast turnaround"
              icon={<Award />}
              color="green"
            />
            <InsightCard
              title="Most Productive Day"
              value={data.user.mostProductiveDay}
              subtitle="Peak activity day"
              icon={<BarChart3 />}
              color="purple"
            />
          </div>
        </div>

        {/* charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartBox title="Daily Performance" icon={<BarChart3 />}>
            <Line data={lineChartData} options={chartOptions} />
          </ChartBox>
          <ChartBox title="Work Distribution" icon={<PieChart />}>
            <Doughnut
              data={doughnutChartData}
              options={{
                ...chartOptions,
                plugins: { ...chartOptions.plugins, legend: { position: "right" } },
              }}
            />
          </ChartBox>
          <ChartBox title="Top Companies" icon={<Users />}>
            <Bar data={barChartData} options={chartOptions} />
          </ChartBox>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartBox title="Hourly Activity Pattern" icon={<Clock />}>
            <Bar data={hourlyActivityData} options={chartOptions} />
          </ChartBox>
          <ChartBox title="Recent Activity (4 months)" icon={<Calendar />}>
            <div className="w-full h-full flex items-center justify-center">
              <CustomCalendarHeatmap values={data.chartData.activeDays} />
            </div>
          </ChartBox>
        </div>

        {/* Enhanced Recent Activity Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FilePlus /> <span>Recent Activity Details</span>
              </h2>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <button
                  onClick={exportToCSV}
                  className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                  title="Export to CSV"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { key: 'date', label: '📅 Date' },
                    { key: 'manual', label: '📂 Manual' },
                    { key: 'files', label: '📁 Total' },
                    { key: 'modifs', label: '🔧 Modifications' },
                    { key: 'modPerFile', label: '📈 Mod/File' },
                    { key: 'avgTime', label: '⏱️ Avg Time (min)' },
                    { key: '', label: '' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => key !== '' && requestSort(key)}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                        sortConfig.key === key ? 'bg-gray-100 font-bold' : ''
                      }`}
                    >
                      {label}
                      {sortConfig.key === key && (
                        <span className="ml-1">{sortConfig.direction === 'desc' ? ' ↓' : ' ↑'}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedAndFilteredMetrics.map((day, idx) => (
                  <React.Fragment key={idx}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {day.date}
                        {data.user.mostProductiveDay === day.date && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">
                            Peak Day
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                          {day.manual}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">{day.files}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                          {day.modifs}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{day.modPerFile}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{day.avgTime}m</td>
                      <td>
                        <button
                          onClick={() => toggleRow(idx)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {expandedRows.has(idx) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(idx) && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50 text-sm text-gray-600 space-y-2">
                          {day.manualFileIds.length > 0 && (
                            <div>
                              <span className="font-medium text-blue-700">Manual Files:</span>{" "}
                              {day.manualFileIds.join(", ")}
                            </div>
                          )}
                          {day.autoFileIds.length > 0 && (
                            <div>
                              <span className="font-medium text-green-700">Auto Files:</span>{" "}
                              {day.autoFileIds.join(", ")}
                            </div>
                          )}
                          {day.modificationFileIds.length > 0 && (
                            <div>
                              <span className="font-medium text-purple-700">Modified Files:</span>{" "}
                              {day.modificationFileIds.join(", ")}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* file types */}
        <FileTypes fileTypes={data.chartData.fileTypes} />
      </div>
    </div>
  );
};

/* ---------- small reusable bits ---------- */
const StatCard = ({ icon, title, value, sub, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{sub}</p>
        </div>
      </div>
    </div>
  );
};

const InsightCard = ({ title, value, subtitle, icon, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };
  return (
    <div className={`p-4 border rounded-lg ${colors[color]} flex items-start space-x-3`}>
      <div className={`p-2 rounded-full ${colors[color]}`}>{icon}</div>
      <div>
        <p className="font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-600">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
};

const ChartBox = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
    <div className="flex items-center space-x-2 mb-4">
      {icon}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="h-64">{children}</div>
  </div>
);

const FileTypes = ({ fileTypes }) => (
  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">File Types Distribution</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {fileTypes.map((ft, idx) => (
        <div key={idx} className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">{ft.type}</span>
          <span className="text-lg font-bold text-blue-600">{ft.count}</span>
        </div>
      ))}
    </div>
  </div>
);

export default UserPerformanceDashboard;