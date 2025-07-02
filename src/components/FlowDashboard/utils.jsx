import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export const stepLabels = {
  '1': 'Email Received',
  '2': 'Content Processed',
  '3': 'Data Extracted',
  '4': 'Export Completed'
};

export const getStatusIcon = (status) => {
  const iconSize = 16;
  const baseClasses = "flex-shrink-0";
  
  switch (status) {
    case 'success': 
      return <CheckCircle2 className={`${baseClasses} text-emerald-600`} size={iconSize} />;
    case 'failed': 
      return <XCircle className={`${baseClasses} text-rose-600`} size={iconSize} />;
    case 'pending': 
    default: 
      return <Clock className={`${baseClasses} text-slate-400`} size={iconSize} />;
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'success': return 'text-emerald-700 border-emerald-300';
    case 'failed': return 'text-rose-700 border-rose-300';
    case 'pending': 
    default: 
      return 'text-slate-500 border-slate-300';
  }
};

export const createFlowNodes = (steps) =>
  steps.map((step, index) => ({
    id: step.id,
    type: 'default',
    position: { x: index * 180, y: 0 },
    data: {
      label: (
        <div className={`flex flex-col items-center p-3 rounded-lg w-full h-full ${getStatusColor(step.status)}`}>
          <div className="flex items-center">
            {getStatusIcon(step.status)}
            <span className="text-sm font-medium">{stepLabels[step.id]}</span>
          </div>
          <span className="text-xs text-slate-500">
                Step {step.id} of {steps.length}
            </span>
          
        </div>
      ),
      step: step
    },
    style: {
      background: 'white',
      border: 'none',
      width: 160,
      height: 80,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    sourcePosition: 'right',  // Connection point on right side
    targetPosition: 'left',   // Connection point on left side
  }));

export const createFlowEdges = (steps) =>
  steps.slice(0, -1).map((_, i) => ({
    id: `edge-${i + 1}-${i + 2}`,
    source: `${i + 1}`,
    target: `${i + 2}`,
    type: 'smoothstep',
    style: { 
      stroke: '#94a3b8',
      strokeWidth: 1.5
    },
    markerEnd: {
      type: 'arrowclosed',
      color: '#94a3b8'
    }
  }));