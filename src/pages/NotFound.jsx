import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function FlowDashboard() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-6 bg-gray-50">
    <AlertCircle className="text-red-500 w-16 h-16 mb-4" />
    <h1 className="text-4xl font-bold text-gray-800 mb-2">404 – Page Not Found</h1>
    <p className="text-gray-600 mb-6">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <Link to="/" className="text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition">
      Go back to Dashboard
    </Link>
  </div>
  );
}
