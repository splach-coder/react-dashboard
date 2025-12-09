import { createBrowserRouter } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import FlowDashboard from './pages/FlowDashboard';
import FlowInfo from './pages/FlowInfo';
import RequestFlow from './pages/RequestFlow';
import NotFound from './pages/NotFound';
import CustomsDashboard from './pages/statistics/CustomsDashboard';
import UserPerformanceDashboard from './pages/statistics/UserPerformanceDashboard';
import UserCompareDashboard from './pages/statistics/UserCompareDashboard';
import UserComparisonSelector from './pages/statistics/UserComparisonSelector.jsx';
import MonthlyReport from './pages/statistics/MonthlyReport';
import Profile from './pages/profile/Profile';
import EmailAssistant from './pages/ai-agents/EmailAssistant';
import ContainerWeightCheck from './pages/Containers/ContainerWeightCheck';
import ArrivalsTable from './pages/arrivals/ArrivalsTable';
import OutboundsTable from './pages/arrivals/OutboundsTable.jsx';
import RequireRole from './components/auth/RequireRole';

const withAccess = (element, allowedRoles) => (
  <RequireRole allowed={allowedRoles}>{element}</RequireRole>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: 'uploads/flows', element: <FlowDashboard /> },
      { path: 'uploads/flows/request', element: <RequestFlow /> },
      { path: 'uploads/flows/informations', element: <FlowInfo /> },
      {
        path: 'statistics/performance',
        element: withAccess(<CustomsDashboard />, ['admin', 'ops']),
      },
      {
        path: 'statistics/performance/:username',
        element: withAccess(<UserPerformanceDashboard />, ['admin', 'ops']),
      },
      {
        path: 'statistics/performance/compare',
        element: withAccess(<UserComparisonSelector />, ['admin', 'ops']),
      },
      {
        path: 'statistics/performance/compare/:user1/:user2',
        element: withAccess(<UserCompareDashboard />, ['admin', 'ops']),
      },
      {
        path: 'statistics/monthly-report',
        element: withAccess(<MonthlyReport />, ['admin', 'ops']),
      },
      { path: 'settings/profile', element: withAccess(<Profile />, ['authenticated']) },
      { path: 'ai-agents/email-assistant', element: <EmailAssistant /> },
      { path: 'container-weight-check', element: <ContainerWeightCheck /> },
      { path: 'arrivals', element: <ArrivalsTable /> },
      {path: 'arrivals/outbounds/:mrn', element: <OutboundsTable /> },
    ],
    errorElement: <NotFound />,
  },
]);

export default router;