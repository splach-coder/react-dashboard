import React, { useState } from 'react';
import FlowRunsTable from '../components/FlowDashboard/FlowRunsTable';
import FlowPlayground from '../components/FlowDashboard/FlowPlayground';

export default function FlowDashboard() {
  const [selectedRun, setSelectedRun] = useState(null);

  if (selectedRun) {
    return <FlowPlayground run={selectedRun} onBack={() => setSelectedRun(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Flow Monitoring Dashboard</h1>
          <p className="text-gray-600">Track and monitor your automation workflow executions</p>
        </div>
        <FlowRunsTable onSelectRun={setSelectedRun} />
      </div>
    </div>
  );
}
