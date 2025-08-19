// src/pages/statistics/MonthlyReport.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, TrendingUp, Zap, User, ArrowUpDown, Loader, AlertTriangle, FileUp, FileDown, RefreshCw } from 'lucide-react';

// --- User Lists for Team Classification ---
const IMPORT_USERS = [
    'FADWA.ERRAZIKI', 'AYOUB.SOURISTE', 'AYMANE.BERRIOUA', 'SANA.IDRISSI', 'AMINA.SAISS',
    'KHADIJA.OUFKIR', 'ZOHRA.HMOUDOU', 'SIMO.ONSI', 'YOUSSEF.ASSABIR', 'ABOULHASSAN.AMINA',
    'MEHDI.OUAZIR', 'OUMAIMA.EL.OUTMANI', 'HAMZA.ALLALI', 'MUSTAPHA.BOUJALA', 'HIND.EZZAOUI'
];

const EXPORT_USERS = [
    'IKRAM.OULHIANE', 'MOURAD.ELBAHAZ', 'MOHSINE.SABIL', 'AYA.HANNI',
    'ZAHIRA.OUHADDA', 'CHAIMAAE.EJJARI', 'HAFIDA.BOOHADDOU', 'KHADIJA.HICHAMI', 'FATIMA.ZAHRA.BOUGSIM'
];

// --- Caching Helpers ---
const CACHE_KEY = "monthly-report-cache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, payload } = JSON.parse(raw);
    return Date.now() - ts < CACHE_TTL ? payload : null;
  } catch {
    return null;
  }
};

const writeCache = (payload) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), payload }));
  } catch (err) {
    console.warn("Could not write to cache", err);
  }
};


// --- Helper Components ---

const StatCard = ({ title, value, icon, subtext }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="bg-gray-100 p-3 rounded-lg">{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
     {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
  </div>
);

const PerformanceTable = ({ data, sortConfig, requestSort, onRowClick }) => (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer" onClick={() => requestSort('manual_files')}>
                            <div className="flex items-center">Manual Files <ArrowUpDown className="w-3 h-3 ml-1" /></div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer" onClick={() => requestSort('automatic_files')}>
                            <div className="flex items-center">Automatic Files <ArrowUpDown className="w-3 h-3 ml-1" /></div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer" onClick={() => requestSort('total_files_created')}>
                            <div className="flex items-center">Total Files <ArrowUpDown className="w-3 h-3 ml-1" /></div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer" onClick={() => requestSort('avg_files_per_active_day')}>
                            <div className="flex items-center">Avg / Day <ArrowUpDown className="w-3 h-3 ml-1" /></div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {data.map((row) => (
                        <tr key={row.user} className="hover:bg-gray-50 cursor-pointer" onClick={() => onRowClick(row.user)}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <User className="w-4 h-4 text-gray-400 mr-3" />
                                    <span className="font-medium text-text-primary">{row.user.replace(".", " ")}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{row.manual_files.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">{row.automatic_files.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-lg text-text-primary">{row.total_files_created.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-text-muted">{row.avg_files_per_active_day}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);


// --- Main Component ---

const MonthlyReport = () => {
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState({ import: [], export: [] });
  const [activeTab, setActiveTab] = useState('import');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'total_files_created', direction: 'desc' });

  const fetchData = useCallback(async (force = false) => {
    if (force) {
        setIsRefreshing(true);
    } else {
        setLoading(true);
    }
    setError(null);

    // Try cache first unless forcing a refresh
    if (!force) {
        const cached = readCache();
        if (cached) {
            setTeamData(cached);
            setLoading(false);
            return;
        }
    }

    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/performance?all_users=true&code=${import.meta.env.VITE_API_CODE}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      let allUsersData = [];
      if (typeof result === 'object' && !Array.isArray(result) && result !== null) {
          allUsersData = Object.entries(result).map(([user, metrics]) => ({
              user,
              ...metrics
          }));
      } else {
          allUsersData = result;
      }
      
      const importTeam = allUsersData.filter(u => IMPORT_USERS.includes(u.user));
      const exportTeam = allUsersData.filter(u => EXPORT_USERS.includes(u.user));
      
      const newTeamData = { import: importTeam, export: exportTeam };
      setTeamData(newTeamData);
      writeCache(newTeamData); // Write fresh data to cache

    } catch (err) {
      console.error("Failed to fetch monthly report:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedData = useMemo(() => {
    let sortableData = [...teamData[activeTab]];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [teamData, activeTab, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleRowClick = (username) => {
    navigate(`/statistics/performance/${username}`);
  };

  const summaryStats = useMemo(() => {
    const currentTeamData = teamData[activeTab];
    if (currentTeamData.length === 0) return { topManual: 'N/A', topAutomatic: 'N/A', totalFiles: 0 };

    const topManual = currentTeamData.reduce((max, user) => user.manual_files > max.manual_files ? user : max, currentTeamData[0]);
    const topAutomatic = currentTeamData.reduce((max, user) => user.automatic_files > max.automatic_files ? user : max, currentTeamData[0]);
    const totalFiles = currentTeamData.reduce((sum, user) => sum + user.total_files_created, 0);

    return {
      topManual: topManual.user.replace(".", " "),
      topAutomatic: topAutomatic.user.replace(".", " "),
      totalFiles
    };
  }, [teamData, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-lg text-gray-600">Loading Monthly Report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-bold text-gray-800">Failed to Load Report</h2>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Monthly Performance Report</h1>
            <p className="text-text-muted mt-1">Team productivity over the last 30 days.</p>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-400"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Team Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('import')}
                className={`${
                  activeTab === 'import'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <FileDown className="w-5 h-5 mr-2" />
                Import Team ({teamData.import.length})
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`${
                  activeTab === 'export'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <FileUp className="w-5 h-5 mr-2" />
                Export Team ({teamData.export.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Team Files" value={summaryStats.totalFiles.toLocaleString()} icon={<BarChart className="text-gray-500 w-6 h-6" />} />
          <StatCard title="Top Manual Contributor" value={summaryStats.topManual} icon={<TrendingUp className="text-blue-500 w-6 h-6" />} subtext="Most manual files created" />
          <StatCard title="Top Automatic Contributor" value={summaryStats.topAutomatic} icon={<Zap className="text-green-500 w-6 h-6" />} subtext="Most automatic files processed" />
        </div>

        {/* Performance Table */}
        <PerformanceTable 
            data={sortedData} 
            sortConfig={sortConfig} 
            requestSort={requestSort} 
            onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
};

export default MonthlyReport;
