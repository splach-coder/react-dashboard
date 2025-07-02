// components/Flow/FlowNodeUtils.js
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const stepLabels = {
  '1': '📩 Email Received',
  '2': '🧠 Email/File Understood',
  '3': '🛠️ Data Extracted',
  '4': '📤 Excel File Dropped'
};

export const getStatusIcon = (status) => {
  switch (status) {
    case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
    case 'pending': return <Clock className="w-4 h-4 text-gray-400" />;
    default: return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'success': return 'bg-green-100 text-green-800 border-green-200';
    case 'failed': return 'bg-red-100 text-red-800 border-red-200';
    case 'pending': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

export const createFlowNodes = (steps) =>
  steps.map((step, index) => ({
    id: step.id,
    position: { x: index * 200, y: 100 },
    data: {
      label: (
        <div className="flex flex-col items-center p-2">
          <div className="text-2xl mb-1">{stepLabels[step.id].split(' ')[0]}</div>
          <div className="text-xs font-medium text-center">{stepLabels[step.id].substring(2)}</div>
          <div className="mt-2">{getStatusIcon(step.status)}</div>
        </div>
      ),
      step: step
    },
    style: {
      background: step.status === 'success' ? '#dcfce7' : step.status === 'failed' ? '#fef2f2' : '#f9fafb',
      border: `2px solid ${
        step.status === 'success' ? '#16a34a' : step.status === 'failed' ? '#dc2626' : '#d1d5db'
      }`,
      borderRadius: '12px',
      width: 120,
      height: 80
    }
  }));

export const createFlowEdges = (steps) =>
  steps.slice(0, -1).map((_, i) => ({
    id: `${i + 1}-${i + 2}`,
    source: `${i + 1}`,
    target: `${i + 2}`,
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 }
  }));
