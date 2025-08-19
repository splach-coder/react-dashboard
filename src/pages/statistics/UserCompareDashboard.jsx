/* UserCompareDashboard.jsx */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { Bar, Line } from "react-chartjs-2";
// Note: html2pdf.js must be loaded in your main index.html file for PDF export to work.
// Example: <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
import { format, subDays, eachDayOfInterval, getDay, parseISO } from "date-fns";
import { useParams, useNavigate } from "react-router-dom";

import {
  TrendingUp,
  FileText,
  Clock,
  BarChart3,
  Zap,
  Activity,
  X,
  ArrowLeftRight,
  FileEdit,
  Calendar,
  Printer,
  RefreshCw,
  Building2,
  FileClock
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

// --- Improved Caching System ---
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const inMemoryPromiseCache = new Map();

const cache = {
  getKey: (username) => `user_dashboard_${username}`,
  read: (username) => {
    try {
      const raw = localStorage.getItem(cache.getKey(username));
      if (!raw) return null;
      const { timestamp, payload } = JSON.parse(raw);
      return { isStale: Date.now() - timestamp > CACHE_TTL, payload };
    } catch {
      return null;
    }
  },
  write: (username, payload) => {
    try {
      const data = { timestamp: Date.now(), payload };
      localStorage.setItem(cache.getKey(username), JSON.stringify(data));
    } catch (e) {
      console.warn("Cache write failed:", e);
    }
  },
};

// --- Data Transformation ---
const transformApiData = (apiData, username) => {
  if (!apiData || !apiData.user || !apiData.daily_metrics || !apiData.summary) {
    console.error("Incomplete API data for", username);
    return null;
  }

  const { summary, daily_metrics } = apiData;

  const dailyMetrics = daily_metrics.map((day) => ({
    date: day.date,
    manual_files_created: day.manual_files_created || 0,
    automatic_files_created: day.automatic_files_created || 0,
    files: (day.manual_files_created || 0) + (day.automatic_files_created || 0),
    modifications: day.modification_count || 0,
    modificationFileIds: day.modification_file_ids || [],
  }));
  
  const companySpecialization = Object.entries(summary.company_specialization || {})
    .map(([company, files]) => ({ company, files }))
    .sort((a, b) => b.files - a.files);
    
  const hourlyActivity = Array.from({ length: 24 }, (_, h) => h)
    .filter(h => h >= 7 && h <= 20) // Focus on typical work hours
    .map(h => ({
      hour: `${h}:00`,
      activity: summary.activity_by_hour?.[h] || 0
    }));

  const activityDays = Object.keys(summary.activity_days || {}).map(date => ({
    date,
    count: summary.activity_days[date],
    active: true,
  }));

  const mostActiveCompany = companySpecialization[0] || { company: "N/A", files: 0 };
  const manualPercent = (summary.manual_vs_auto_ratio?.manual_percent || 0);
  const autoPercent = (summary.manual_vs_auto_ratio?.automatic_percent || 0);

  return {
    user: {
      id: username,
      name: username.replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
      totalFiles: summary.total_files_handled || 0,
      totalModifications: summary.total_modifications || 0,
      avgTime: (summary.avg_creation_time || 0).toFixed(2),
      avgFilesPerDay: (summary.avg_files_per_day || 0).toFixed(1),
      modificationsPerFile: (summary.modifications_per_file || 0).toFixed(1),
      mostActiveCompany: mostActiveCompany.company,
      mostActiveHour: summary.hour_with_most_activity ? `${summary.hour_with_most_activity}:00` : "N/A",
      manualPercentage: manualPercent, // Keep as raw percentage
      autoPercentage: autoPercent,
      daysActive: summary.days_active || 0,
    },
    dailyMetrics,
    charts: {
      companySpecialization,
      hourlyActivity,
      activityDays,
      fileTypes: Object.entries(summary.file_type_counts || {}).map(([type, count]) => ({ type, count })),
    },
  };
};

// --- API Fetching with Stale-While-Revalidate ---
const fetchUser = (username, force = false) => {
  const cachedData = cache.read(username);

  if (!force && inMemoryPromiseCache.has(username)) {
    return inMemoryPromiseCache.get(username);
  }

  const fetchPromise = new Promise(async (resolve, reject) => {
    if (!force && cachedData && !cachedData.isStale) {
      return resolve(cachedData.payload);
    }
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/performance?user=${username}&code=${import.meta.env.VITE_API_CODE}`);
      if (!res.ok) throw new Error(`API error for ${username}: ${res.statusText}`);
      const apiData = await res.json();
      const transformed = transformApiData(apiData, username);
      if (!transformed) throw new Error(`Data transformation failed for ${username}`);
      
      cache.write(username, transformed);
      resolve(transformed);
    } catch (err) {
      console.error(`Fetch failed for ${username}:`, err);
      if (cachedData) resolve(cachedData.payload);
      else reject(err);
    } finally {
      inMemoryPromiseCache.delete(username);
    }
  });

  if (!force) {
    inMemoryPromiseCache.set(username, fetchPromise);
  }

  return fetchPromise;
};

// --- UI Components ---
const UserProfileCard = ({ user, speciality, colorClass }) => (
  <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md border border-gray-200">
    <img src={user.avatar} alt={user.name} className={`w-24 h-24 rounded-full mb-4 ring-4 ${colorClass.ring}`} />
    <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
    {speciality && (
        <span className={`mt-2 text-xs font-semibold text-white ${colorClass.bg} px-2 py-1 rounded-full`}>
            {speciality}
        </span>
    )}
  </div>
);

const ComparisonStatCard = ({ title, value1, value2, icon, unit = "", colors }) => {
  const val1 = parseFloat(value1) || 0;
  const val2 = parseFloat(value2) || 0;
  const winner = val1 > val2 ? 1 : (val2 > val1 ? 2 : 0);
  
  const getBorderColor = (user) => {
      if (winner === 0) return 'border-gray-200';
      return winner === user ? 'border-green-400' : 'border-gray-200';
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border text-center">
      <div className="flex items-center justify-center gap-2 mb-2 text-gray-600 font-semibold">
        {icon}
        <span>{title}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg border-2 ${getBorderColor(1)}`}>
          <p className={`text-2xl font-bold ${colors.user1.text}`}>{value1}{unit}</p>
        </div>
        <div className={`p-3 rounded-lg border-2 ${getBorderColor(2)}`}>
          <p className={`text-2xl font-bold ${colors.user2.text}`}>{value2}{unit}</p>
        </div>
      </div>
    </div>
  );
};

const ChartBox = ({ title, icon, children, className = "" }) => (
  <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
      {icon}
      {title}
    </h3>
    <div className="h-72">{children}</div>
  </div>
);

const SimpleHeatmap = ({ startDate, endDate, values, colorScale }) => {
    const dataMap = new Map(values.map(v => [v.date, v.count]));
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    
    const weekStarts = allDays.filter(day => getDay(day) === 0);
    
    const getIntensityClass = (count) => {
        if (!count || count === 0) return 'bg-gray-200';
        const intensity = Math.min(Math.ceil(count / 5), 4);
        return colorScale[intensity] || 'bg-gray-200';
    };

    return (
        <div className="flex justify-center overflow-x-auto p-2">
            <div className="flex gap-1">
                {weekStarts.map((weekStart, index) => (
                    <div key={index} className="flex flex-col gap-1">
                        {Array.from({ length: 7 }).map((_, dayIndex) => {
                            const date = new Date(weekStart);
                            date.setDate(date.getDate() + dayIndex);
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const count = dataMap.get(dateStr) || 0;
                            
                            if (date < startDate || date > endDate) {
                                return <div key={dayIndex} className="w-6 h-6" />;
                            }

                            return (
                                <div
                                    key={dayIndex}
                                    className={`w-4 h-4 rounded-sm ${getIntensityClass(count)}`}
                                    title={`${dateStr}: ${count} activities`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

const RecentActivityTable = ({ dailyMetrics1, dailyMetrics2, colors }) => {
    const last5Days1 = dailyMetrics1.sort((a, b) => parseISO(b.date) - parseISO(a.date)).slice(0, 5);
    const last5Days2 = dailyMetrics2.sort((a, b) => parseISO(b.date) - parseISO(a.date)).slice(0, 5);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <FileClock /> Recent Activity (Last 5 Active Days)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User 1 Table */}
                <div>
                    <h4 className={`font-bold mb-2 ${colors.user1.text}`}>{dailyMetrics1[0]?.user || 'User 1'}</h4>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                            <tr>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2 text-center">Manual</th>
                                <th className="px-4 py-2 text-center">Auto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {last5Days1.map(day => (
                                <tr key={day.date} className="border-b">
                                    <td className="px-4 py-2 font-medium text-gray-900">{format(parseISO(day.date), 'MMM dd, yyyy')}</td>
                                    <td className="px-4 py-2 text-center">{day.manual_files_created}</td>
                                    <td className="px-4 py-2 text-center">{day.automatic_files_created}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* User 2 Table */}
                <div>
                    <h4 className={`font-bold mb-2 ${colors.user2.text}`}>{dailyMetrics2[0]?.user || 'User 2'}</h4>
                     <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                            <tr>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2 text-center">Manual</th>
                                <th className="px-4 py-2 text-center">Auto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {last5Days2.map(day => (
                                <tr key={day.date} className="border-b">
                                    <td className="px-4 py-2 font-medium text-gray-900">{format(parseISO(day.date), 'MMM dd, yyyy')}</td>
                                    <td className="px-4 py-2 text-center">{day.manual_files_created}</td>
                                    <td className="px-4 py-2 text-center">{day.automatic_files_created}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- Main Dashboard Component ---
const UserCompareDashboard = () => {
  const navigate = useNavigate();
  const { user1, user2 } = useParams();
  const dashboardRef = useRef(null);

  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Consistent Color Scheme ---
  const colors = {
      user1: {
          bg: 'bg-blue-600',
          text: 'text-blue-600',
          ring: 'ring-blue-200',
          border: 'border-blue-600',
          chartPrimary: '#3b82f6', // blue-500
          chartSecondary: '#60a5fa', // blue-400
          heatmap: ['bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-700']
      },
      user2: {
          bg: 'bg-emerald-600',
          text: 'text-emerald-600',
          ring: 'ring-emerald-200',
          border: 'border-emerald-600',
          chartPrimary: '#10b981', // emerald-500
          chartSecondary: '#34d399', // emerald-400
          heatmap: ['bg-emerald-200', 'bg-emerald-300', 'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-700']
      }
  };

  const loadUsers = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      if (!force) {
        const cached1 = cache.read(user1)?.payload;
        const cached2 = cache.read(user2)?.payload;
        if (cached1) setData1(cached1);
        if (cached2) setData2(cached2);
      }
      
      const [d1, d2] = await Promise.all([
        fetchUser(user1, force),
        fetchUser(user2, force)
      ]);

      if (!d1 || !d2) throw new Error("One or both users could not be loaded.");
      setData1(d1);
      setData2(d2);
    } catch (err) {
      setError(err.message || "Failed to load comparison data.");
    } finally {
      setLoading(false);
    }
  }, [user1, user2]);

  useEffect(() => {
    if (user1 && user2) loadUsers();
    else {
      setError("Two user parameters are required for comparison.");
      setLoading(false);
    }
  }, [user1, user2, loadUsers]);

  const handleRefresh = () => loadUsers(true);
  
  const exportToPDF = () => {
    if (window.html2pdf) {
        const element = dashboardRef.current;
        if(!element) return;
        const opt = {
          margin: 0.5,
          filename: `comparison_${user1}_vs_${user2}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "in", format: "a3", orientation: "portrait" },
        };
        window.html2pdf().from(element).set(opt).save();
    } else {
        console.error("html2pdf.js is not loaded. Please add the script to your index.html.");
    }
  };
  
  if (loading && (!data1 || !data2)) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Fetching comparison data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center px-6">
        <X className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-xl font-semibold text-red-600">Loading Error</p>
        <p className="text-gray-600 mt-2">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Go Back
        </button>
      </div>
    );
  }

  if (!data1 || !data2) return null;

  const u1 = data1.user;
  const u2 = data2.user;

  // --- Chart Data Preparation ---
  const allDates = [...new Set([...data1.dailyMetrics.map(d => d.date), ...data2.dailyMetrics.map(d => d.date)])].sort();
  const dailyProductivityData = {
    labels: allDates.slice(-30).map(d => format(new Date(d), 'MMM dd')),
    datasets: [
      { label: u1.name, data: allDates.slice(-30).map(date => data1.dailyMetrics.find(d => d.date === date)?.files || 0), borderColor: colors.user1.chartPrimary, backgroundColor: `${colors.user1.chartPrimary}33`, fill: true, tension: 0.3 },
      { label: u2.name, data: allDates.slice(-30).map(date => data2.dailyMetrics.find(d => d.date === date)?.files || 0), borderColor: colors.user2.chartPrimary, backgroundColor: `${colors.user2.chartPrimary}33`, fill: true, tension: 0.3 },
    ],
  };

  const allCompanyNames = [...new Set([...data1.charts.companySpecialization.slice(0, 5).map(c => c.company), ...data2.charts.companySpecialization.slice(0, 5).map(c => c.company)])];
  const companyFocusData = {
    labels: allCompanyNames,
    datasets: [
      { label: u1.name, data: allCompanyNames.map(name => data1.charts.companySpecialization.find(c => c.company === name)?.files || 0), backgroundColor: colors.user1.chartPrimary, barPercentage: 0.6 },
      { label: u2.name, data: allCompanyNames.map(name => data2.charts.companySpecialization.find(c => c.company === name)?.files || 0), backgroundColor: colors.user2.chartPrimary, barPercentage: 0.6 },
    ],
  };
  
  const hourlyData = {
    labels: data1.charts.hourlyActivity.map(h => h.hour),
    datasets: [
       { label: u1.name, data: data1.charts.hourlyActivity.map(h => h.activity), backgroundColor: colors.user1.chartPrimary },
       { label: u2.name, data: data2.charts.hourlyActivity.map(h => h.activity), backgroundColor: colors.user2.chartPrimary },
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#f1f5f9' } } },
    interaction: { intersect: false, mode: 'index' },
  };

  const insights = {
    productivity: u1.avgFilesPerDay > u2.avgFilesPerDay ? u1.name : u2.name,
    efficiency: u1.modificationsPerFile < u2.modificationsPerFile ? u1.name : u2.name,
    workStyle: u1.manualPercentage > u2.manualPercentage ? { name: u1.name, style: 'Manual' } : { name: u2.name, style: 'Automated' },
    peakTime: u1.mostActiveHour === u2.mostActiveHour ? 'Aligned' : 'Different',
    companyFocus: u1.mostActiveCompany === u2.mostActiveCompany ? 'Similar' : 'Divergent',
  };

  const getSpeciality = (manualPercentage) => {
      if (manualPercentage > 66) return "Manual Specialist";
      if (manualPercentage < 33) return "Automation Focused";
      return "Hybrid Operator";
  }
  const u1Speciality = getSpeciality(u1.manualPercentage);
  const u2Speciality = getSpeciality(u2.manualPercentage);

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ArrowLeftRight className="h-5 w-5 text-indigo-600" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              User Comparison
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm font-medium disabled:opacity-50">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> <span>Refresh</span>
            </button>
            <button onClick={exportToPDF} className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm font-medium">
              <Printer size={16} /> <span>PDF</span>
            </button>
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-md"><X size={20} className="text-gray-600" /></button>
          </div>
        </div>
      </header>
      
      <main ref={dashboardRef} className="p-4 sm:p-6">
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <UserProfileCard user={u1} speciality={u1Speciality} colorClass={colors.user1} />
              <div className="lg:col-span-1 space-y-3">
                <ComparisonStatCard title="Avg Files / Day" value1={u1.avgFilesPerDay} value2={u2.avgFilesPerDay} icon={<TrendingUp size={20} />} colors={colors} />
                <ComparisonStatCard title="Total Files Handled" value1={u1.totalFiles} value2={u2.totalFiles} icon={<FileText size={20} />} colors={colors} />
                <ComparisonStatCard title="Modifications / File" value1={u1.modificationsPerFile} value2={u2.modificationsPerFile} icon={<FileEdit size={20} />} colors={colors} />
              </div>
              <UserProfileCard user={u2} speciality={u2Speciality} colorClass={colors.user2} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"><Zap className="text-yellow-500" /> Key Insights</h3>
              <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm text-gray-700">
                <li className="flex items-center gap-2"><strong>Higher Daily Output:</strong> {insights.productivity}</li>
                <li className="flex items-center gap-2"><strong>Greater Efficiency:</strong> {insights.efficiency}</li>
                <li className="flex items-center gap-2"><strong>Dominant Work Style:</strong> {`${insights.workStyle.name} (${insights.workStyle.style})`}</li>
                <li className="flex items-center gap-2"><strong>Peak Hours:</strong> {insights.peakTime}</li>
                <li className="flex items-center gap-2"><strong>Company Focus:</strong> {insights.companyFocus}</li>
              </ul>
            </div>

            <RecentActivityTable dailyMetrics1={data1.dailyMetrics} dailyMetrics2={data2.dailyMetrics} colors={colors} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartBox title="Daily Productivity Trend (Last 30 Days)" icon={<BarChart3 />}>
                <Line data={dailyProductivityData} options={chartOptions} />
              </ChartBox>
              <ChartBox title="Hourly Activity Pattern" icon={<Clock />}>
                <Bar data={hourlyData} options={chartOptions} />
              </ChartBox>
              <ChartBox title="Top 5 Company Focus" icon={<Building2 />}>
                <Bar data={companyFocusData} options={{...chartOptions, indexAxis: 'y' }} />
              </ChartBox>
              <ChartBox title="Work Style (Manual vs. Auto %)" icon={<Activity />}>
                <Bar data={{
                    labels: [u1.name, u2.name],
                    datasets: [
                      { label: 'Manual', data: [u1.manualPercentage, u2.manualPercentage], backgroundColor: '#476a7c'},
                      { label: 'Automatic', data: [u1.autoPercentage, u2.autoPercentage], backgroundColor: '#14b8a6'},
                    ]
                }} options={{...chartOptions, scales: { ...chartOptions.scales, x: { stacked: true }, y: { stacked: true } }}} />
              </ChartBox>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartBox title={`Activity Heatmap - ${u1.name}`} icon={<Calendar />}>
                <SimpleHeatmap
                  startDate={subDays(new Date(), 180)}
                  endDate={new Date()}
                  values={data1.charts.activityDays}
                  colorScale={colors.user1.heatmap}
                />
              </ChartBox>
               <ChartBox title={`Activity Heatmap - ${u2.name}`} icon={<Calendar />}>
                <SimpleHeatmap
                  startDate={subDays(new Date(), 180)}
                  endDate={new Date()}
                  values={data2.charts.activityDays}
                  colorScale={colors.user2.heatmap}
                />
              </ChartBox>
            </div>
        </div>
      </main>
    </div>
  );
};

export default UserCompareDashboard;