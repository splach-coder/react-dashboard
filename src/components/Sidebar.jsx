import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Search, 
  LayoutDashboard, 
  Upload, 
  Container, 
  BarChart3, 
  ChevronRight,
  ChevronDown,
  Home,
  FileText,
  Inbox,
  Calendar,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ collapsed, toggle }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [hoveredItem, setHoveredItem] = useState(null);
  const { user, loading } = useAuth();

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
      subtitles: [
        { label: 'Overview', path: '/overview' },
        { label: 'Analytics', path: '/analytics' },
        { label: 'Reports', path: '/reports' }
      ]
    },
    {
      id: 'uploads',
      label: 'Uploads',
      icon: Upload,
      path: '/uploads',
      subtitles: [
        { label: 'Flows', path: '/uploads/flows' },
        { label: 'Informations', path: '/uploads/flows/informations' },
        { label: 'Request Upload', path: '/uploads/flows/request' }
      ],
      hasSubmenu: true
    },
    {
      id: 'containers',
      label: 'Containers',
      icon: Container,
      path: '/containers',
      subtitles: [
        { label: 'Active', path: '/containers/active' },
        { label: 'Stopped', path: '/containers/stopped' },
        { label: 'Images', path: '/containers/images' },
        { label: 'Networks', path: '/containers/networks' }
      ],
      hasSubmenu: true
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: BarChart3,
      path: '/statistics',
      subtitles: [
        { label: 'Performance', path: '/statistics/performance' },
        { label: 'Compare', path: '/statistics/performance/compare' },
        { label: 'Trends', path: '/statistics/trends' }
      ],
      hasSubmenu: true
    }
  ];

  const otherItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      subtitles: [
        { label: 'Profile', path: '/settings/profile' },
        { label: 'Preferences', path: '/settings/preferences' },
        { label: 'Security', path: '/settings/security' }
      ],
      hasSubmenu: true
    },
    {
      id: 'help',
      label: 'Help',
      icon: HelpCircle,
      path: '/help',
      subtitles: [
        { label: 'Documentation', path: '/help/documentation' },
        { label: 'Support', path: '/help/support' },
        { label: 'FAQ', path: '/help/faq' }
      ],
      hasSubmenu: true
    }
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOtherItems = otherItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMenuItem = (item, isInOthersSection = false) => {
    const isExpanded = expandedItems[item.id];
    const isHovered = hoveredItem === item.id;
    const showSubtitles = (collapsed && isHovered) || (!collapsed && isExpanded);

    return (
      <div key={item.id} className="relative">
        <NavLink 
          to={item.path}
          end
          className={({ isActive }) => `
            flex items-center justify-between px-3 py-2 mx-2 rounded-lg
            transition-all duration-200 group cursor-pointer relative
            ${isActive 
              ? 'bg-primary text-white' 
              : 'hover:bg-gray-50 text-text-primary'
            }
            ${isExpanded && !isActive ? 'bg-gray-50' : ''}
          `}
          onClick={(e) => {
            if (!collapsed && item.hasSubmenu) {
              e.preventDefault();
              toggleExpanded(item.id);
            }
          }}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => {
            setTimeout(() => {
              if (hoveredItem === item.id) {
                setHoveredItem(null);
              }
            }, 200);
          }}
        >
          {({ isActive }) => (
            <>
              <div className="flex items-center space-x-3">
                <item.icon 
                  size={20} 
                  className={`${
                    isActive 
                      ? 'text-white' 
                      : 'text-text-muted group-hover:text-primary'
                  }`} 
                />
                {!collapsed && (
                  <span className={`font-medium ${
                    isActive 
                      ? 'text-white' 
                      : 'text-text-primary'
                  }`}>
                    {item.label}
                  </span>
                )}
              </div>
              
              {!collapsed && item.hasSubmenu && (
                <ChevronRight 
                  size={16} 
                  className={`
                    transform transition-transform duration-200
                    ${isExpanded ? 'rotate-90' : ''}
                    ${isActive 
                      ? 'text-white' 
                      : 'text-text-muted group-hover:text-primary'
                    }
                  `}
                />
              )}
            </>
          )}
        </NavLink>

        {/* Expanded submenu */}
        {!collapsed && showSubtitles && item.hasSubmenu && (
          <div className="ml-6 mt-1 space-y-1">
            {item.subtitles.map((subtitle, index) => (
              <NavLink
                key={index}
                to={subtitle.path}
                className={({ isActive }) => `
                  flex items-center px-3 py-1 text-sm rounded
                  transition-colors
                  ${
                    isActive
                      ? 'text-primary font-medium'
                      : 'text-text-muted hover:text-primary hover:bg-gray-50'
                  }
                `}
              >
                {subtitle.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`
      ${collapsed ? 'w-16' : 'w-64'} 
      bg-white border-r border-border h-screen flex flex-col transition-all duration-300 fixed
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          {!collapsed && (
            <span className="font-bold text-text-primary text-lg">DKM</span>
          )}
        </div>
        <button
          onClick={toggle}
          className="p-1 rounded transition-colors"
        >
          <ChevronRight 
            size={20} 
            className={`text-white transform transition-transform duration-200 bg-primary rounded-md  ${collapsed ? '' : 'rotate-180'}`} 
          />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder={collapsed ? "" : "Search"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`
              w-full pl-10 pr-4 py-2 border border-border rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              text-sm placeholder-text-muted
              ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            `}
          />
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto overflow-x-visible">
        <div className="py-4">
          {!collapsed && (
            <div className="px-4 mb-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Menu
              </span>
            </div>
          )}
          <div className="space-y-1">
            {filteredMenuItems.map(item => renderMenuItem(item))}
          </div>
        </div>

        {/* Others Section */}
        <div className="py-4 border-t border-border">
          {!collapsed && (
            <div className="px-4 mb-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Others
              </span>
            </div>
          )}
          <div className="space-y-1">
            {filteredOtherItems.map(item => renderMenuItem(item, true))}
          </div>
        </div>
      </div>

      {/* User Profile */}
      {!loading && user && (
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-text-muted font-medium text-sm">{user.name.split(' ')[0][0]}{user.name.split(' ')[1][0]}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-medium text-text-primary text-sm truncate">
                {user.name}
              </div>
              <div className="text-text-muted text-xs truncate">
                {user.email}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default Sidebar;