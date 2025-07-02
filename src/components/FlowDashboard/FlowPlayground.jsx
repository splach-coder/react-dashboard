import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Controls, MiniMap, Background, useNodesState, useEdgesState, addEdge, Panel } from 'reactflow';
import 'reactflow/dist/style.css';
import { ChevronLeft, Play, Mail, Database, FileSpreadsheet } from 'lucide-react';

// Define nodeTypes outside component to avoid React Flow warning
const nodeTypes = {};

// Step type mapping with proper failure detection
const getStepInfo = (step, index) => {
  const stepType = Object.keys(step)[0];
  const stepData = step[stepType];
  
  switch (index) {
    case 0:
      return {
        title: 'Email Processed',
        subtitle: 'Outlook',
        icon: <Mail className="w-5 h-5" />,
        bgColor: '#ef4444', // red-500
        iconBg: '#559CAD', // red-600
        textColor: 'text-white',
        failed: false // Email always succeeds per requirements
      };
    case 1:
      const step2Failed = stepData?.error || stepData?.failed || stepData?.status === 'failed';
      return {
        title: 'Data Extracted',
        subtitle: 'Azure Function',
        icon: <Database className="w-5 h-5" />,
        bgColor: step2Failed ? '#ef4444' : '#2A7F62', // red-500 or green-500
        iconBg: step2Failed ? '#dc2626' : '#2A7F62', // red-600 or green-600
        textColor: 'text-white',
        failed: step2Failed
      };
    case 2:
      const step3Failed = stepData?.status === 'failed' || stepData?.status === 'error';
      return {
        title: 'Excel Dropped on Location',
        subtitle: 'File System',
        icon: <FileSpreadsheet className="w-5 h-5" />,
        bgColor: step3Failed ? '#ef4444' : '#2A7F62', // red-500 or green-500
        iconBg: step3Failed ? '#dc2626' : '#2A7F62', // red-600 or green-600
        textColor: 'text-white',
        failed: step3Failed
      };
    default:
      return {
        title: 'Unknown Step',
        subtitle: 'Unknown',
        icon: <div className="w-5 h-5 rounded-full bg-gray-400" />,
        bgColor: '#6b7280', // gray-500
        iconBg: '#4b5563', // gray-600
        textColor: 'text-white',
        failed: false
      };
  }
};

// Utility functions
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'success':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'running':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'success':
      return <span className="text-green-500">✓</span>;
    case 'failed':
      return <span className="text-red-500">✗</span>;
    case 'running':
      return <span className="text-blue-500">↻</span>;
    default:
      return <span className="text-gray-500">○</span>;
  }
};

const getStepStatus = (step) => {
  const stepType = Object.keys(step)[0];
  return step[stepType]?.status || 'unknown';
};

const createFlowNodes = (steps) => {
  return steps.map((step, index) => {
    const stepInfo = getStepInfo(step, index);
    
    return {
      id: `node-${index}`,
      type: 'default',
      data: {
        label: (
          <div 
            className="flex items-center p-3 min-w-[200px] bg-gray-200"
           
          >
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 text-white"
              style={{ backgroundColor: stepInfo.iconBg }}
            >
              {stepInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-sm leading-tight text-${stepInfo.textColor}`}>
                {stepInfo.title}
              </div>
              <div className={`text-xs opacity-80 mt-0.5 text-${stepInfo.textColor}`}>
                {stepInfo.subtitle}
              </div>
            </div>
            {stepInfo.failed && (
              <div className="ml-2 flex-shrink-0">
                <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
              </div>
            )}
          </div>
        ),
        step: step,
        failed: stepInfo.failed,
      },
      position: { x: index * 280, y: 0 },
      style: {
        background: 'transparent',
        border: 'none',
        padding: 0,
        width: 'auto',
        minWidth: '220px',
      },
    };
  });
};

const createFlowEdges = (steps) => {
  return steps.slice(0, -1).map((step, index) => {
    const currentStepInfo = getStepInfo(step, index);
    const nextStepInfo = getStepInfo(steps[index + 1], index + 1);
    
    return {
      id: `edge-${index}-${index + 1}`,
      source: `node-${index}`,
      target: `node-${index + 1}`,
      animated: getStepStatus(steps[index + 1]) === 'running',
      style: {
        stroke: nextStepInfo.failed ? '#ef4444' : '#355070', // red-500 or green-500
        strokeWidth: 1,
      },
      type: 'smoothstep',
    };
  });
};

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
            {getStatusIcon(status)}
            <span className="capitalize">{status}</span>
          </div>
        </div>
        {Object.entries(stepData).map(([key, value]) => (
          key !== 'status' && (
            <div key={key}>
              <p className="text-sm text-gray-500">{key}</p>
              <p className="whitespace-pre-wrap break-all">{JSON.stringify(value, null, 2)}</p>
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
            {getStatusIcon(overallStatus)}
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(overallStatus)}`}>
              {overallStatus}
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
              const status = node.data?.step ? getStepStatus(node.data.step) : 'unknown';
              return status === 'success' ? '#16a34a' : 
                     status === 'failed' ? '#dc2626' : 
                     '#6b7280';
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