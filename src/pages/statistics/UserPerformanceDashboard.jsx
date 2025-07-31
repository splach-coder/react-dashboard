/*  UserPerformanceDashboard.jsx  */
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  User, Clock, FileText, TrendingUp, Calendar, ChevronDown, ChevronRight,
  Activity, Building2, X, BarChart3, PieChart, Users, Zap, FileEdit,
  FilePlus, FileMinus, Award,
} from "lucide-react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
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

/* ---------- tiny cache helpers ---------- */
const TTL = 30 * 60 * 1000; // 30 minutes
const cacheKey = (u) => `userdash_${u}`;
const readCache = (username) => {
  try {
    const raw = localStorage.getItem(cacheKey(username));
    if (!raw) return null;
    const { ts, payload } = JSON.parse(raw);
    return Date.now() - ts < TTL ? payload : null;
  } catch {
    return null;
  }
};
const writeCache = (username, payload) => {
  try {
    localStorage.setItem(
      cacheKey(username),
      JSON.stringify({ ts: Date.now(), payload })
    );
  } catch {
    /* ignore quota errors */
  }
};

/* ---------- transform helper ---------- */
const transformApiData = (apiData) => {
  if (!apiData) return null;

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

  dailyMetrics.sort(
    (a, b) =>
      new Date(a.date.split("/").reverse().join("-")) -
      new Date(b.date.split("/").reverse().join("-"))
  );

  const dailyFiles = dailyMetrics.map((d) => ({
    date: d.date.split("/").slice(0, 2).join("/"),
    total: d.files,
  }));

  const companySpecialization = Object.entries(
    apiData.summary.company_specialization || {}
  )
    .map(([company, files]) => ({ company, files }))
    .sort((a, b) => b.files - a.files);

  const mostActiveCompany = companySpecialization[0] || { company: "N/A", files: 0 };

  const activityByHour = apiData.summary.activity_by_hour || {};
  const hourLabels = Array.from({ length: 24 }, (_, i) => i).filter(
    (h) => h >= 6 && h <= 19
  );
  const hourlyActivity = hourLabels.map((h) => ({
    hour: `${h}:00`,
    activity: activityByHour[h] || 0,
  }));

  const today = new Date();
  const startDate = subDays(today, 120);
  const allDays = eachDayOfInterval({ start: startDate, end: today }).reverse();
  const activeDays = allDays.map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const isActive = apiData.summary.activity_days[dateStr] !== undefined;
    const isInactive = apiData.summary.inactivity_days.includes(dateStr);
    const count = apiData.summary.activity_days[dateStr] || 0;
    return { date: dateStr, count, active: isActive && !isInactive };
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
      avgTime:
        apiData.summary?.avg_creation_time != null
          ? apiData.summary.avg_creation_time.toFixed(2)
          : "Very Quick",
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

/* ---------- component ---------- */
const UserPerformanceDashboard = ({ onClose }) => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

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

  /* ---------- fetch + cache ---------- */
  const fetchUser = useCallback(
    async (force = false) => {
      if (!force) {
        const cached = readCache(username);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }
      }
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/performance?user=${username}&code=${
            import.meta.env.VITE_API_CODE
          }`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const apiData = await res.json();
        const transformed = transformApiData(apiData);
        setData(transformed);
        writeCache(username, transformed);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [username]
  );

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const toggleRow = (index) => {
    const s = new Set(expandedRows);
    s.has(index) ? s.delete(index) : s.add(index);
    setExpandedRows(s);
  };

  const getHeatmapClass = (value) => {
    if (!value || !value.active) return "color-empty";
    if (value.count >= 100) return "color-scale-4";
    if (value.count >= 50) return "color-scale-3";
    if (value.count >= 20) return "color-scale-2";
    return "color-scale-1";
  };

  if (loading)
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center max-w-md">
          <X className="h-12 w-12 mx-auto mb-2 text-red-500" />
          <p className="text-lg font-semibold">Error loading dashboard</p>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => fetchUser(true)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );

  if (!data) return null;

  /* ---------- charts ---------- */
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
    labels: data.chartData.companySpecialization.slice(0, 6).map((d) => d.company),
    datasets: [
      {
        label: "Files Handled",
        data: data.chartData.companySpecialization.slice(0, 6).map((d) => d.files),
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

  return (
    <div className="bg-white min-h-screen">
      {/* header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.user.name}</h1>
            </div>
          </div>
          <button
            onClick={() => navigate("/statistics/performance")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close dashboard"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
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
            <CalendarHeatmap
              startDate={subDays(new Date(), 120)}
              endDate={new Date()}
              values={data.chartData.activeDays}
              classForValue={getHeatmapClass}
              showWeekdayLabels
              gutterSize={2}
            />
          </ChartBox>
        </div>

        {/* daily table */}
        <DailyTable
          dailyMetrics={data.dailyMetrics}
          mostProductiveDay={data.user.mostProductiveDay}
          expandedRows={expandedRows}
          toggleRow={toggleRow}
        />

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

const ChartBox = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
    <div className="flex items-center space-x-2 mb-4">
      {icon}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="h-64">{children}</div>
  </div>
);

const DailyTable = ({ dailyMetrics, mostProductiveDay, expandedRows, toggleRow }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
        <FilePlus /> Recent Activity Details
      </h2>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {["Date", "Manual", "Auto", "Modified", "Total", "Avg Time", ""].map(
              (h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {dailyMetrics.map((day, idx) => (
            <React.Fragment key={idx}>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {day.date}
                  {day.date.includes(format(new Date(mostProductiveDay), "dd/MM/yyyy")) && (
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
                <td className="px-6 py-4">
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                    {day.auto}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                    {day.modifs}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold">{day.files}</td>
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
                        {day.manualFileIds.slice(0, 10).join(", ")}
                        {day.manualFileIds.length > 10 && ` …and ${day.manualFileIds.length - 10} more`}
                      </div>
                    )}
                    {day.autoFileIds.length > 0 && (
                      <div>
                        <span className="font-medium text-green-700">Auto Files:</span>{" "}
                        {day.autoFileIds.slice(0, 10).join(", ")}
                        {day.autoFileIds.length > 10 && ` …and ${day.autoFileIds.length - 10} more`}
                      </div>
                    )}
                    {day.modificationFileIds.length > 0 && (
                      <div>
                        <span className="font-medium text-purple-700">Modified Files:</span>{" "}
                        {day.modificationFileIds.slice(0, 10).join(", ")}
                        {day.modificationFileIds.length > 10 && ` …and ${day.modificationFileIds.length - 10} more`}
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