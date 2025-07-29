import { createBrowserRouter } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import FlowDashboard from './pages/FlowDashboard';
import FlowInfo from './pages/FlowInfo';
import RequestFlow from './pages/RequestFlow';
import NotFound from './pages/NotFound';
import CustomsDashboard from './pages/statistics/CustomsDashboard';
import UserPerformanceDashboard from './pages/statistics/UserPerformanceDashboard';


const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: 'uploads/flows', element: <FlowDashboard /> },
      { path: 'uploads/flows/request', element: <RequestFlow /> },
      { path: 'uploads/flows/informations', element: <FlowInfo /> },
      { path: 'statistics/performance', element: <CustomsDashboard /> },
      { path: 'statistics/performance/:username', element: <UserPerformanceDashboard /> },
    ],
    errorElement: <NotFound />,
  },
]);

export default router;