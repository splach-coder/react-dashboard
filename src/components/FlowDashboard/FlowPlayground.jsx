import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Controls, MiniMap, Background, useNodesState, useEdgesState, addEdge, Panel } from 'reactflow';
import 'reactflow/dist/style.css';
import { ChevronLeft, Play, Mail, Database, FileSpreadsheet, AlertTriangle } from 'lucide-react';

// Stronger, professional colors
const COLORS = {
  success: {
    bg: '#16a34a',     // green-600
    iconBg: '#22c55e', // green-500
    border: '#15803d', // green-700
    text: 'text-white',
  },
  failed: {
    bg: '#dc2626',     // red-600
    iconBg: '#ef4444', // red-500
    border: '#b91c1c', // red-700
    text: 'text-white',
  },
  unknown: {
    bg: '#6b7280',     // gray-500
    iconBg: '#4b5563', // gray-600
    border: '#374151', // gray-700
    text: 'text-white',
  },
};

// Define nodeTypes outside component
const nodeTypes = {};

// Step type mapping with failure detection and error extraction
const getStepInfo = (step, index) => {
  const stepType = Object.keys(step)[0];
  const stepData = step[stepType];

  // Normalize status to lowercase for comparison
  const statusRaw = stepData?.status;
  const statusLower = String(statusRaw || '').toLowerCase().trim();

  let failed = false;
  let error = null;

  // Extract error
  if (stepData?.failError && typeof stepData.failError === 'string' && stepData.failError.trim() !== '') {
    error = stepData.failError.trim();
  } else if (statusLower === 'failed' || statusLower === 'error') {
    error = 'Step failed'; // fallback message
  }

  // Determine failure per step
  switch (index) {
    case 0: // Email
      failed = false; // always success per business rule
      break;
    case 1: // Azure Function
      failed = statusLower === 'failed' || statusLower === 'error' || !!stepData?.error || !!stepData?.failed;
      break;
    case 2: // Output Excel
      failed = statusLower === 'failed' || statusLower === 'error';
      break;
    default:
      failed = statusLower === 'failed';
  }

  // Override: if no status but we have failError, mark as failed
  if (!statusRaw && error) failed = true;

  switch (index) {
    case 0:
      return {
        title: 'Email Processed',
        subtitle: 'Outlook',
        icon: <Mail className="w-5 h-5" />,
        ...COLORS.success,
        failed: false,
        error: null,
        status: 'success',
      };
    case 1:
      return {
        title: 'Data Extracted',
        subtitle: 'Azure Function',
        icon: <Database className="w-5 h-5" />,
        ...(failed ? COLORS.failed : COLORS.success),
        failed,
        error,
        status: failed ? 'failed' : 'success',
      };
    case 2:
      return {
        title: 'Excel Dropped on Location',
        subtitle: 'File System',
        icon: <FileSpreadsheet className="w-5 h-5" />,
        ...(failed ? COLORS.failed : COLORS.success),
        failed,
        error: failed && !error ? 'Failed to write Excel file' : error,
        status: failed ? 'failed' : 'success',
      };
    default:
      return {
        title: 'Unknown Step',
        subtitle: 'Unknown',
        icon: <div className="w-5 h-5 rounded-full bg-gray-400" />,
        ...COLORS.unknown,
        failed: false,
        error: null,
        status: 'unknown',
      };
  }
};

// Utility: Status badge
const getStatusBadge = (status) => {
  const badgeStyles = {
    success: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    unknown: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[status]}`}>
      {status === 'success' && '✓ Success'}
      {status === 'failed' && '✗ Failed'}
      {status === 'unknown' && '• Unknown'}
    </span>
  );
};

// Create enhanced nodes
const createFlowNodes = (steps) => {
  return steps.map((step, index) => {
    const stepInfo = getStepInfo(step, index);

    return {
      id: `node-${index}`,
      type: 'default',
      data: {
        label: (
          <div
            className={`flex flex-col p-3 min-w-[240px] rounded-lg border shadow-sm transition-all hover:shadow-md ${
              stepInfo.failed ? 'animate-pulse' : ''
            }`}
            style={{
              backgroundColor: stepInfo.bg,
              borderColor: stepInfo.border,
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center flex-1 min-w-0">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 text-white"
                  style={{ backgroundColor: stepInfo.iconBg }}
                >
                  {stepInfo.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm leading-tight ${stepInfo.text}`}>
                    {stepInfo.title}
                  </div>
                  <div className={`text-xs opacity-90 mt-0.5 ${stepInfo.text}`}>
                    {stepInfo.subtitle}
                  </div>
                </div>
              </div>
              {stepInfo.failed && (
                <AlertTriangle className="w-4 h-4 text-white opacity-90 ml-2 flex-shrink-0" />
              )}
            </div>

            {/* Error message */}
            {stepInfo.failed && stepInfo.error && (
              <div className="mt-2 pt-2 border-t border-white border-opacity-30">
                <p className="text-xs text-white text-opacity-90 leading-tight">
                  {typeof stepInfo.error === 'string'
                    ? stepInfo.error.length > 60
                      ? `${stepInfo.error.substring(0, 60)}...`
                      : stepInfo.error
                    : JSON.stringify(stepInfo.error)}
                </p>
              </div>
            )}
          </div>
        ),
        step: step,
        failed: stepInfo.failed,
        status: stepInfo.status,
      },
      position: { x: index * 300, y: 0 },
      style: {
        background: 'transparent',
        border: 'none',
        padding: 0,
        width: 'auto',
        minWidth: '240px',
      },
    };
  });
};

// Edges: Red if next step failed, green otherwise
const createFlowEdges = (steps) => {
  return steps.slice(0, -1).map((step, index) => {
    const currentStepInfo = getStepInfo(step, index);
    const nextStepInfo = getStepInfo(steps[index + 1], index + 1);

    return {
      id: `edge-${index}-${index + 1}`,
      source: `node-${index}`,
      target: `node-${index + 1}`,
      animated: nextStepInfo.status === 'running',
      style: {
        stroke: nextStepInfo.failed ? COLORS.failed.bg : COLORS.success.bg,
        strokeWidth: 2,
      },
      type: 'smoothstep',
    };
  });
};

// StepDetailPanel: Show full error
const StepDetailPanel = ({ step, onClose }) => {
  if (!step) return null;

  const stepType = Object.keys(step)[0];
  const stepData = step[stepType];
  const status = stepData?.status || 'unknown';

  return (
    <div className="absolute right-4 top-4 bg-white p-4 rounded-lg shadow-lg border w-80 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Step Details</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-500">Type</p>
          <p className="font-mono capitalize">{stepType}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <div className="flex items-center gap-2">
            {status === 'success' && '✓'}
            {status === 'failed' && '✗'}
            {status === 'unknown' && '•'}
            <span className="capitalize">{status}</span>
          </div>
        </div>
        {Object.entries(stepData).map(([key, value]) => (
          key !== 'status' && (
            <div key={key}>
              <p className="text-sm text-gray-500">{key}</p>
              <p className="whitespace-pre-wrap break-all text-sm">
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              </p>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default function FlowPlayground({ run, onBack }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedStep, setSelectedStep] = useState(null);

  const flowElements = useMemo(() => {
    if (!run?.Steps?.length) return { nodes: [], edges: [] };

    const nodes = createFlowNodes(run.Steps);
    const edges = createFlowEdges(run.Steps);

    return { nodes, edges };
  }, [run]);

  useEffect(() => {
    setNodes(flowElements.nodes);
    setEdges(flowElements.edges);
  }, [flowElements, setNodes, setEdges]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
  const onNodeClick = useCallback((_, node) => {
    if (node?.data?.step) {
      setSelectedStep(node.data.step);
    }
  }, []);

  if (!run) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">No run data available</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const overallStatus = run.finalResult?.allStepsSucceeded ? 'success' : 'failed';

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{run.LogicAppName}</h1>
              <p className="text-sm text-gray-500">Run ID: {run.runId} • {new Date(run.logicAppTimestamp).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {overallStatus === 'success' ? '✓' : '✗'}
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(overallStatus)}`}>
              {overallStatus === 'success' ? 'Success' : 'Failed'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          defaultEdgeOptions={{
            type: 'smoothstep',
          }}
          connectionRadius={10}
          nodeOrigin={[0.5, 0.5]}
          fitView
          className="bg-gradient-to-br from-gray-50 to-gray-100"
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.failed) return COLORS.failed.bg;
              if (node.data?.status === 'success') return COLORS.success.bg;
              return COLORS.unknown.bg;
            }}
            pannable
            zoomable
          />
          <Background variant="dots" gap={25} size={1} color="#333" />
          <Panel position="top-center" className="bg-white rounded-lg shadow-lg px-4 py-2 border">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Play className="w-4 h-4" />
              <span>Click on any step to view details</span>
            </div>
          </Panel>
        </ReactFlow>

        {selectedStep && (
          <StepDetailPanel
            step={selectedStep}
            onClose={() => setSelectedStep(null)}
          />
        )}
      </div>
    </div>
  );
}

// Utility: Status color class
const getStatusColor = (status) => {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};