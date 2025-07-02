import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStatusIcon, stepLabels } from './utils';
import { RefreshCw } from 'lucide-react';

export default function StepDetailPanel({ step, onClose }) {
  if (!step) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 border-l"
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Step Details</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{stepLabels[step.id].split(' ')[0]}</div>
              <div>
                <h4 className="font-medium">{stepLabels[step.id].substring(2)}</h4>
                <div className="flex items-center mt-1">{getStatusIcon(step.status)}<span className="ml-2 text-sm text-gray-600">{step.status}</span></div>
              </div>
            </div>

            {step.timestamp && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-2">Timestamp</h5>
                <p className="text-sm text-gray-600">{step.timestamp}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-700 mb-2">{step.status === 'failed' ? 'Error Details' : 'Execution Details'}</h5>
              <p className="text-sm text-gray-600 leading-relaxed">{step.message}</p>
            </div>

            {step.status === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h5 className="text-red-800 mb-2 flex items-center font-medium">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Options
                </h5>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">Retry Step</button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
