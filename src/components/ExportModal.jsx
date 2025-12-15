import React from 'react';
import { X, FileSpreadsheet, Layers, FileDown } from 'lucide-react';

const ExportModal = ({ isOpen, onClose, onExport, count, scope }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in border border-gray-100 scale-100">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <FileDown className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Export Options</h3>
                            <p className="text-xs text-gray-500">Choose your data format</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    You are preparing to export <strong>{count}</strong> {scope === 'selection' ? 'selected' : 'filtered'} records.
                    Please select the depth of data required.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => onExport({ includeOutbounds: false })}
                        className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-orange-50/50 transition-all group text-left relative overflow-hidden"
                    >
                        <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-white border border-gray-100 shadow-sm transition-colors">
                            <FileSpreadsheet className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 group-hover:text-primary transition-colors">Inbounds Only</div>
                            <div className="text-xs text-gray-500 mt-1">Single list of arrival declarations</div>
                        </div>
                    </button>

                    <button
                        onClick={() => onExport({ includeOutbounds: true })}
                        className="w-full flex items-center gap-4 p-4 border-2 border-primary/10 rounded-xl hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all group text-left relative overflow-hidden"
                    >
                        <div className="p-3 bg-white rounded-lg shadow-sm border border-primary/10 text-primary">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-gray-900 group-hover:text-primary transition-colors">Detailed Report</div>
                            <div className="text-xs text-gray-600 mt-1">Multi-sheet Excel with Outbounds</div>
                        </div>
                        <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-bl-xl">
                            RECOMMENDED
                        </div>
                    </button>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 font-medium px-4">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
