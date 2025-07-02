import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 overflow-x-visible">
      <Sidebar collapsed={collapsed} toggle={() => setCollapsed(!collapsed)} />
      <main className={`flex-1 transition-all ease-in ${collapsed ? 'ms-20' : 'ms-72'}`}>
        <Outlet />
      </main>
    </div>
  );
}
