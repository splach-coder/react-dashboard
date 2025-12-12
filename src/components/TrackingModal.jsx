import React, { useState, useEffect } from 'react';
import { X, Check, User, Clock, MessageSquare, Mail, Copy } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTrackingRecords, addTrackingRecord, generateEmailDraft, calculateDaysSinceRelease } from '../api/trackingApi';

const TrackingModal = ({ arrival, onClose, currentUser }) => {
    const [note, setNote] = useState('');
    const [isChecked, setIsChecked] = useState(false);
    const [showEmailDraft, setShowEmailDraft] = useState(false);
    const [copiedField, setCopiedField] = useState(null);
    const queryClient = useQueryClient();

    const daysWaiting = calculateDaysSinceRelease(arrival.GDSREL_DATETIME);
    const shouldShowEmailAlert = daysWaiting >= 2;

    // Fetch tracking records for this MRN
    const { data: trackingRecords = [], isLoading } = useQuery({
        queryKey: ['tracking', arrival.MRN],
        queryFn: () => getTrackingRecords(arrival.MRN),
        staleTime: 30 * 1000, // 30 seconds
    });

    // Mutation to add tracking record
    const addTrackingMutation = useMutation({
        mutationFn: (trackingData) => addTrackingRecord(arrival.MRN, trackingData),
        onSuccess: () => {
            queryClient.invalidateQueries(['tracking', arrival.MRN]);
            queryClient.invalidateQueries(['all_tracking']); // Update the bulk list
            queryClient.invalidateQueries(['arrivals']);
            setNote('');
            setIsChecked(false);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!note.trim() && !isChecked) {
            alert('Please add a note or mark as checked');
            return;
        }

        const trackingData = {
            user: currentUser || 'Unknown User',
            action: isChecked ? 'checked' : 'note',
            note: note.trim(),
            status: getStatus(arrival).value,
            saldo: arrival.saldo,
            outbounds_count: arrival.Outbounds?.length || 0,
        };

        addTrackingMutation.mutate(trackingData);
    };

    const getStatus = (arrival) => {
        const saldo = arrival.saldo;
        const outboundsCount = Array.isArray(arrival.Outbounds) ? arrival.Outbounds.length : 0;

        if (saldo === 0) {
            return { label: 'Complete', value: 'complete', color: 'success' };
        }
        if (saldo !== 0 && outboundsCount > 0) {
            return { label: 'Error', value: 'error', color: 'error' };
        }
        if (saldo > 0 && outboundsCount === 0) {
            return { label: 'Waiting for Outbounds', value: 'waiting', color: 'info' };
        }
        return { label: 'Unknown', value: 'unknown', color: 'warning' };
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCopyEmail = () => {
        const emailDraft = generateEmailDraft(arrival, daysWaiting);
        const emailText = `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`;
        navigator.clipboard.writeText(emailText);
        setCopiedField('email');
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleOpenEmailClient = () => {
        const emailDraft = generateEmailDraft(arrival, daysWaiting);
        const mailtoLink = `mailto:?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`;
        window.location.href = mailtoLink;
    };

    const status = getStatus(arrival);
    const lastCheck = trackingRecords.find(r => r.action === 'checked');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900">
                            Tracking & Notes
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            MRN: {arrival.MRN}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status Overview */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Status</p>
                                <p className={`font-semibold ${status.color === 'error' ? 'text-red-600' :
                                    status.color === 'info' ? 'text-blue-600' :
                                        status.color === 'success' ? 'text-green-600' :
                                            'text-gray-600'
                                    }`}>
                                    {status.label}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Days Waiting</p>
                                <p className={`font-semibold ${daysWaiting >= 2 ? 'text-red-600' : 'text-gray-900'}`}>
                                    {daysWaiting} days
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Saldo</p>
                                <p className="font-semibold text-gray-900">{arrival.saldo || 0}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Outbounds</p>
                                <p className="font-semibold text-gray-900">{arrival.Outbounds?.length || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Email Alert Section */}
                    {shouldShowEmailAlert && status.value === 'waiting' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-red-600 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-red-900 mb-1">
                                        Email Alert Required
                                    </h3>
                                    <p className="text-sm text-red-700 mb-3">
                                        This item has been waiting for {daysWaiting} days. An email notification should be sent.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowEmailDraft(!showEmailDraft)}
                                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                        >
                                            {showEmailDraft ? 'Hide' : 'Show'} Email Draft
                                        </button>
                                        <button
                                            onClick={handleOpenEmailClient}
                                            className="px-3 py-1.5 bg-white text-red-600 border border-red-600 text-sm rounded hover:bg-red-50 transition-colors"
                                        >
                                            Open in Email Client
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Email Draft Preview */}
                            {showEmailDraft && (
                                <div className="mt-4 bg-white rounded border border-red-200 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-gray-900">Email Draft</h4>
                                        <button
                                            onClick={handleCopyEmail}
                                            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            <Copy className="w-4 h-4" />
                                            {copiedField === 'email' ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <p className="font-semibold text-gray-700">Subject:</p>
                                            <p className="text-gray-900 mt-1">{generateEmailDraft(arrival, daysWaiting).subject}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-700">Body:</p>
                                            <pre className="text-gray-900 mt-1 whitespace-pre-wrap font-sans">
                                                {generateEmailDraft(arrival, daysWaiting).body}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Last Check Info */}
                    {lastCheck && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-green-900 mb-1">
                                        Last Checked
                                    </h3>
                                    <p className="text-sm text-green-700">
                                        By <span className="font-medium">{lastCheck.user}</span> on {formatDate(lastCheck.timestamp)}
                                    </p>
                                    {lastCheck.note && (
                                        <p className="text-sm text-green-700 mt-1 italic">
                                            "{lastCheck.note}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add Note/Check Form */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Add Note or Mark as Checked
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="flex items-center gap-2 mb-3">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => setIsChecked(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Mark as checked (I've reviewed this issue)
                                    </span>
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add notes about the issue, actions taken, or findings..."
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={addTrackingMutation.isLoading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {addTrackingMutation.isLoading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNote('');
                                        setIsChecked(false);
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Tracking History */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Tracking History
                        </h3>
                        {isLoading ? (
                            <p className="text-sm text-gray-600">Loading history...</p>
                        ) : trackingRecords.length === 0 ? (
                            <p className="text-sm text-gray-600">No tracking records yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {trackingRecords.map((record, index) => (
                                    <div
                                        key={index}
                                        className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                                    >
                                        <div className="flex-shrink-0">
                                            {record.action === 'checked' ? (
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-green-600" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <MessageSquare className="w-4 h-4 text-blue-600" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className="w-3.5 h-3.5 text-gray-500" />
                                                <span className="font-medium text-gray-900 text-sm">
                                                    {record.user}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {formatDate(record.timestamp)}
                                                </span>
                                            </div>
                                            {record.note && (
                                                <p className="text-sm text-gray-700 mt-1">
                                                    {record.note}
                                                </p>
                                            )}
                                            <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                                <span>Status: {record.status}</span>
                                                <span>Saldo: {record.saldo}</span>
                                                <span>Outbounds: {record.outbounds_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrackingModal;
