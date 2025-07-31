/* UserCompareDashboard.jsx */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import html2pdf from "html2pdf.js";

import { format, subDays, eachDayOfInterval } from "date-fns";
import { useParams, useNavigate } from "react-router-dom";

import {
  Users,
  User,
  TrendingUp,
  FileText,
  Clock,
  Building2,
  BarChart3,
  PieChart,
  Zap,
  Activity,
  X,
  ArrowLeftRight,
  FileEdit,
  Calendar,
  Download,
  Printer,
  Trophy,
  List,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

/* --- Cache Helpers --- */
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
    localStorage.setItem(cacheKey(username), JSON.stringify({ ts: Date.now(), payload }));
  } catch (e) {
    console.warn("Cache write failed", e);
  }
};

/* --- Transform API Data --- */
const transformApiData = (apiData, username) => {
  if (!apiData || !apiData.user || !apiData.daily_metrics || !apiData.summary) return null;

  const dailyMetrics = (apiData.daily_metrics || []).map((day) => ({
    date: day.date || "N/A",
    manual: day.manual_files_created || 0,
    auto: day.automatic_files_created || 0,
    modifs: day.modification_count || 0,
    files: (day.manual_files_created || 0) + (day.automatic_files_created || 0),
    totalFilesHandled: day.total_files_handled || 0,
    avgTime: day.avg_creation_time != null ? day.avg_creation_time : 0,
    manualFileIds: Array.isArray(day.manual_file_ids) ? day.manual_file_ids : [],
    autoFileIds: Array.isArray(day.automatic_file_ids) ? day.automatic_file_ids : [],
    modificationFileIds: Array.isArray(day.modification_file_ids) ? day.modification_file_ids : [],
  }));

  const summary = apiData.summary || {};

  const companySpecialization = Object.entries(summary.company_specialization || {})
    .map(([company, files]) => ({ company, files }))
    .sort((a, b) => (b.files || 0) - (a.files || 0));

  const mostActiveCompany = companySpecialization[0] || { company: "N/A", files: 0 };

  const activityByHour = summary.activity_by_hour || {};
  const hourLabels = Array.from({ length: 24 }, (_, i) => i).filter((h) => h >= 6 && h <= 22);
  const hourlyActivity = hourLabels.map((h) => ({
    hour: `${h}:00`,
    activity: activityByHour[h] || 0,
  }));

  const today = new Date();
  const startDate = subDays(today, 120);
  const allDays = eachDayOfInterval({ start: startDate, end: today }).reverse();
  const activityDays = summary.activity_days || {};
  const inactivityDays = Array.isArray(summary.inactivity_days) ? summary.inactivity_days : [];

  const activeDays = allDays.map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const count = activityDays[dateStr] || 0;
    const isActive = activityDays[dateStr] !== undefined;
    const isInactive = inactivityDays.includes(dateStr);
    return {
      date: dateStr,
      count,
      active: isActive && !isInactive,
    };
  });

  const fileTypes = Object.entries(summary.file_type_counts || {})
    .map(([type, count]) => ({ type, count }));

  return {
    user: {
      id: username,
      name: username.replace(".", " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
      team: "Export Team",
      totalFiles: summary.total_files_handled || 0,
      totalModifications: summary.total_modifications || 0,
      manualPercentage: Math.round((summary.manual_vs_auto_ratio?.manual_percent || 0) * 100) / 100,
      autoPercentage: Math.round((summary.manual_vs_auto_ratio?.automatic_percent || 0) * 100) / 100,
      avgTime: summary.avg_creation_time != null ? (summary.avg_creation_time).toFixed(2) : "Very Quick",
      avgFilesPerDay: (summary.avg_files_per_day || 0).toFixed(1),
      mostProductiveDay: summary.most_productive_day || "N/A",
      mostActiveCompany: mostActiveCompany.company,
      mostActiveCompanyFiles: mostActiveCompany.files,
      mostActiveHour: summary.hour_with_most_activity || "N/A",
      daysActive: summary.days_active || 0,
      modificationsPerFile: (summary.modifications_per_file || 0).toFixed(1),
    },
    dailyMetrics,
    chartData: { companySpecialization, hourlyActivity, activeDays, fileTypes },
  };
};

/* --- Fetch User Data --- */
const fetchUser = async (username, force = false) => {
  if (!force) {
    const cached = readCache(username);
    if (cached) return cached;
  }

  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/api/performance?user=${username}&code=${import.meta.env.VITE_API_CODE}`
  );
  if (!res.ok) throw new Error(`Failed to fetch ${username}`);
  const apiData = await res.json();
  const transformed = transformApiData(apiData, username);
  if (!transformed) throw new Error(`Invalid data for ${username}`);
  writeCache(username, transformed);
  return transformed;
};

/* --- Stat Card Component --- */
const StatCard = ({ title, value, sub, icon, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    red: "bg-red-50 text-red-600 border-red-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
  };
  return (
    <div className={`border-l-4 ${colors[color]} p-4 rounded-lg bg-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-xl font-bold">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2 rounded-full bg-${color}-100`}>{icon}</div>
      </div>
    </div>
  );
};

/* --- ChartBox Wrapper --- */
const ChartBox = ({ title, icon, children, className = "" }) => (
  <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
      {icon}
      {title}
    </h3>
    <div className="h-64">{children}</div>
  </div>
);

/* --- Compare Dashboard Component --- */
const UserCompareDashboard = () => {
  const navigate = useNavigate();
  const { user1, user2 } = useParams();
  const dashboardRef = useRef(null);

  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("compare"); // 'compare' or 'leaderboard'

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const [d1, d2] = await Promise.all([
          fetchUser(user1).catch(() => null),
          fetchUser(user2).catch(() => null),
        ]);

        if (!d1 || !d2) throw new Error("One or both users could not be loaded.");
        setData1(d1);
        setData2(d2);
      } catch (err) {
        setError(err.message || "Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };

    if (user1 && user2) loadUsers();
    else setError("Missing user parameters.");
  }, [user1, user2]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <X className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg font-semibold text-red-600">Error</p>
        <p className="text-sm text-gray-600 mt-2">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Back
        </button>
      </div>
    );
  }

  if (!data1 || !data2) return null;

  const u1 = data1.user;
  const u2 = data2.user;

  // === Shared Metrics ===
  const totalFilesDiff = u1.totalFiles - u2.totalFiles;
  const modPerFileDiff = parseFloat(u1.modificationsPerFile) - parseFloat(u2.modificationsPerFile);

  const overlapDays = data1.dailyMetrics
    .map((d) => d.date)
    .filter((date) => data2.dailyMetrics.some((d2) => d2.date === date)).length;

  const sharedModifiedFiles = (data1.dailyMetrics || [])
    .flatMap((d) => d.modificationFileIds || [])
    .filter((id) =>
      (data2.dailyMetrics || []).some((d2) =>
        (d2.modificationFileIds || []).includes(id)
      )
    );

  const peakOverlap = u1.mostActiveHour === u2.mostActiveHour;

  // === Daily Productivity Chart ===
  const allDates = [...new Set([...data1.dailyMetrics.map((d) => d.date), ...data2.dailyMetrics.map((d) => d.date)])].sort();
  const combinedDailyFiles = allDates.map((date) => {
    const d1 = data1.dailyMetrics.find((d) => d.date === date) || { files: 0 };
    const d2 = data2.dailyMetrics.find((d) => d.date === date) || { files: 0 };
    return {
      date: date.split("-").slice(1).join("/"),
      [u1.name]: d1.files,
      [u2.name]: d2.files,
    };
  });

  // === File Type Chart ===
  const allFileTypes = [...new Set([...data1.chartData.fileTypes.map((f) => f.type), ...data2.chartData.fileTypes.map((f) => f.type)])];
  const fileTypeData = {
    labels: allFileTypes,
    datasets: [
      { label: u1.name, data: allFileTypes.map(type => data1.chartData.fileTypes.find(f => f.type === type)?.count || 0), backgroundColor: "#3b82f6" },
      { label: u2.name, data: allFileTypes.map(type => data2.chartData.fileTypes.find(f => f.type === type)?.count || 0), backgroundColor: "#10b981" },
    ],
  };

  // === Hourly Activity Chart ===
  const hourlyData = {
    labels: Array.from({ length: 24 }, (_, h) => `${h}:00`).filter((_, i) => i >= 6 && i <= 22),
    datasets: [
      {
        label: u1.name,
        data: Array.from({ length: 24 }, (_, h) => h)
          .filter(h => h >= 6 && h <= 22)
          .map(h => data1.chartData.hourlyActivity.find(hr => parseInt(hr.hour) === h)?.activity || 0),
        backgroundColor: "#3b82f6",
      },
      {
        label: u2.name,
        data: Array.from({ length: 24 }, (_, h) => h)
          .filter(h => h >= 6 && h <= 22)
          .map(h => data2.chartData.hourlyActivity.find(hr => parseInt(hr.hour) === h)?.activity || 0),
        backgroundColor: "#10b981",
      },
    ],
  };

  // === Manual vs Auto Chart ===
  const manualAutoData = {
    labels: ["Manual", "Automatic"],
    datasets: [
      { label: u1.name, data: [u1.manualPercentage, u1.autoPercentage], backgroundColor: ["#3b82f6", "#60a5fa"] },
      { label: u2.name, data: [u2.manualPercentage, u2.autoPercentage], backgroundColor: ["#10b981", "#34d399"] },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}` } },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
    },
  };

  // === PDF Export ===
  const exportToPDF = () => {
    const opt = {
      margin: 1,
      filename: `comparison_${user1}_vs_${user2}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "landscape" },
    };
    html2pdf().from(dashboardRef.current).set(opt).save();
  };

  // === Download Shared Files as CSV ===
  const downloadSharedFiles = () => {
    const headers = ["File ID", "Shared By", "Date"];
    const rows = sharedModifiedFiles.map(id => [id, `${u1.name}, ${u2.name}`, "N/A"]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shared_files_${user1}_vs_${user2}.csv`;
    a.click();
  };

  // === Leaderboard Data (mocked for now, can be fetched from API) ===
  const leaderboard = [
    { name: u1.name, files: u1.totalFiles, modifications: u1.totalModifications, avgPerDay: u1.avgFilesPerDay },
    { name: u2.name, files: u2.totalFiles, modifications: u2.totalModifications, avgPerDay: u2.avgFilesPerDay },
    { name: "John Doe", files: 1420, modifications: 780, avgPerDay: "13.2" },
    { name: "Sarah Kim", files: 1300, modifications: 920, avgPerDay: "12.8" },
    { name: "Mike Chen", files: 1100, modifications: 640, avgPerDay: "11.5" },
  ].sort((a, b) => b.files - a.files);

  return (
    <div ref={dashboardRef} className="bg-gray-50 min-h-screen" style={{ overflow: "auto" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ArrowLeftRight className="h-5 w-5 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {view === "compare" ? `Compare: ${u1.name} vs ${u2.name}` : "Team Leaderboard"}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setView(view === "compare" ? "leaderboard" : "compare")}
              className="flex items-center gap-1 px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm"
            >
              {view === "compare" ? <Trophy size={16} /> : <List size={16} />}
              {view === "compare" ? "Leaderboard" : "Compare"}
            </button>
            {view === "compare" && (
              <>
                <button
                  onClick={downloadSharedFiles}
                  className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  <Download size={16} /> CSV
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  <Printer size={16} /> PDF
                </button>
              </>
            )}
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {view === "compare" ? (
          <>
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard
                title="Total Files"
                value={u1.totalFiles}
                sub={`${totalFilesDiff > 0 ? "+" : ""}${totalFilesDiff}`}
                icon={<FileText className="h-5 w-5 text-blue-600" />}
                color="blue"
              />
              <StatCard
                title="Avg Files/Day"
                value={u1.avgFilesPerDay}
                sub={`${(u1.avgFilesPerDay - u2.avgFilesPerDay).toFixed(1)}`}
                icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                color="green"
              />
              <StatCard
                title="Modifications/File"
                value={u1.modificationsPerFile}
                sub={`${modPerFileDiff > 0 ? "+" : ""}${modPerFileDiff.toFixed(1)}`}
                icon={<FileEdit className="h-5 w-5 text-purple-600" />}
                color="purple"
              />
              <StatCard
                title="Shared Active Days"
                value={overlapDays}
                sub={`${((overlapDays / Math.max(u1.daysActive, 1)) * 100).toFixed(0)}% of ${u1.name}`}
                icon={<Calendar className="h-5 w-5 text-orange-600" />}
                color="orange"
              />
              <StatCard
                title="Shared Modified Files"
                value={sharedModifiedFiles.length}
                sub={peakOverlap ? "/Peak Hour Sync" : "/Peak Diff"}
                icon={<Activity className="h-5 w-5 text-indigo-600" />}
                color="indigo"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartBox title="Daily Productivity" icon={<BarChart3 />}>
                <Bar data={{
                  labels: combinedDailyFiles.map(d => d.date),
                  datasets: [
                    { label: u1.name, data: combinedDailyFiles.map(d => d[u1.name]), backgroundColor: "#3b82f6" },
                    { label: u2.name, data: combinedDailyFiles.map(d => d[u2.name]), backgroundColor: "#10b981" },
                  ],
                }} options={options} />
              </ChartBox>
              <ChartBox title="File Type Specialization" icon={<PieChart />}>
                <Bar data={fileTypeData} options={{ ...options, indexAxis: "y" }} />
              </ChartBox>
              <ChartBox title="Hourly Activity Pattern" icon={<Clock />}>
                <Bar data={hourlyData} options={options} />
              </ChartBox>
              <ChartBox title="Work Style (Manual vs Auto)" icon={<Activity />}>
                <Bar data={manualAutoData} options={options} />
              </ChartBox>
            </div>

            {/* Heatmaps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartBox title={`Activity Heatmap - ${u1.name}`} icon={<Calendar />}>
                <CalendarHeatmap
                  startDate={subDays(new Date(), 120)}
                  endDate={new Date()}
                  values={data1.chartData.activeDays}
                  classForValue={(v) => (v?.active ? "color-scale-4" : "color-empty")}
                  showWeekdayLabels
                  tooltipDataAttrs={(v) => ({ "data-tip": v ? `${v.count} activities` : "" })}
                  gutterSize={2}
                />
              </ChartBox>
              <ChartBox title={`Activity Heatmap - ${u2.name}`} icon={<Calendar />}>
                <CalendarHeatmap
                  startDate={subDays(new Date(), 120)}
                  endDate={new Date()}
                  values={data2.chartData.activeDays}
                  classForValue={(v) => (v?.active ? "color-scale-3" : "color-empty")}
                  showWeekdayLabels
                  tooltipDataAttrs={(v) => ({ "data-tip": v ? `${v.count} activities` : "" })}
                  gutterSize={2}
                />
              </ChartBox>
            </div>

            {/* Summary Insight */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Key Insights
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>🔹 <strong>{u1.name}</strong> is {u1.avgFilesPerDay > u2.avgFilesPerDay ? "more productive" : "slightly slower"} by {Math.abs(u1.avgFilesPerDay - u2.avgFilesPerDay).toFixed(1)} files/day.</li>
                <li>🔹 <strong>{u1.name}</strong> focuses more on {u1.manualPercentage > u2.manualPercentage ? "manual work" : "automation"}.</li>
                <li>🔹 They share <strong>{sharedModifiedFiles.length}</strong> modified files — potential for collaboration.</li>
                <li>🔹 {peakOverlap ? "✅ Peak hours align!" : "⏰ Work peaks at different times."}</li>
                <li>🔹 <strong>{u1.mostActiveCompany}</strong> vs <strong>{u2.mostActiveCompany}</strong> — different company focus.</li>
              </ul>
            </div>
          </>
        ) : (
          /* Leaderboard View */
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Trophy /> Team Leaderboard</h2>
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">#</th>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Total Files</th>
                  <th className="text-left py-2">Avg/Day</th>
                  <th className="text-left py-2">Modifications</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((user, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3">{idx + 1}</td>
                    <td className="font-medium">{user.name}</td>
                    <td>{user.files}</td>
                    <td>{user.avgPerDay}</td>
                    <td>{user.modifications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCompareDashboard;