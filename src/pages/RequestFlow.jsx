import React, { useState } from 'react';
import Editor from 'react-simple-wysiwyg';
import {
  Upload, X, FileText, Check, Mail, ArrowRight,
  Send, Sparkles, AlertCircle, ChevronRight,
  ClipboardList, Users, ArrowUpCircle, Download, FileBox,
  Bold, Italic, List, AlignLeft, Info, ArrowLeft, Wand2
} from 'lucide-react';

const LOGIC_APP_URL = "https://prod-XYZ.westeurope.logic.azure.com:443/workflows/YOUR_GUID/triggers/manual/paths/invoke?api-version=2016-10-01"; // Placeholder

// --- Subcomponents ---

const FileUploadArea = ({ files, onFileChange, onRemove }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      onFileChange(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
          }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-gray-900 text-lg">Upload Samples</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Drag & drop PDF files or Email messages (.msg, .eml) here.
        </p>
        <button className="relative px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20">
          Select Files
          <input
            type="file"
            multiple
            accept=".pdf,.xlsx,.xls,.docx,.msg,.eml"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => onFileChange(e.target.files)}
          />
        </button>
        <p className="text-xs text-gray-400 mt-4">Includes support for Outlook .msg and .eml files</p>
      </div>

      {/* File List */}
      <div className="space-y-3">
        {files.map((file, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{file.name}</div>
                <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>
            <button onClick={() => onRemove(idx)} className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Form Component ---

const RequestFlow = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    senderEmail: '',
    principalName: '',
    flowType: 'import',
    volume: '',
    frequency: 'weekly',
    hasEmailBody: false,
    comments: '',
    files: []
  });

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, senderEmail: val }));

    if (val && !validateEmail(val)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleFileChange = (newFiles) => {
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...Array.from(newFiles)]
    }));
  };

  const removeFile = (idx) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== idx)
    }));
  };

  // Helper to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // 1. Convert all files to Base64
      const filePromises = formData.files.map(async (file) => {
        const base64Content = await fileToBase64(file);
        // Split data URI to get raw content
        const [metadata, content] = base64Content.split(',');
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          content: content
        };
      });

      const processedFiles = await Promise.all(filePromises);

      const payload = {
        principalName: formData.principalName,
        senderEmail: formData.senderEmail,
        flowType: formData.flowType,
        volume: formData.volume,
        frequency: formData.frequency,
        comments: formData.comments,
        hasEmailBody: formData.hasEmailBody,
        files: processedFiles,
        submittedAt: new Date().toISOString()
      };

      console.log("🚀 Payload Prepared for Logic App (Copy this for Schema):");
      console.log(JSON.stringify(payload, null, 2));

      if (LOGIC_APP_URL.includes("YOUR_GUID")) {
        console.warn("⚠️ No Logic App URL configured. Payload logged to console.");
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        const response = await fetch(LOGIC_APP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`Logic App returned ${response.status}`);
      }

      setIsSubmitting(false);
      setShowSuccess(true);
      setStep(1);

    } catch (error) {
      console.error('Submission Failed', error);
      setIsSubmitting(false);
      alert('Failed to submit request. See console for details.');
    }
  };

  const resetForm = () => {
    setFormData({
      senderEmail: '',
      principalName: '',
      flowType: 'import',
      volume: '',
      frequency: 'weekly',
      hasEmailBody: false,
      comments: '',
      files: []
    });
    setShowSuccess(false);
    setStep(1);
    setEmailError('');
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full p-8 rounded-2xl shadow-xl text-center animate-fade-in border border-gray-100">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Request Submitted!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Your automation proposal has been successfully sent to our Operations team. We will review the documents and reach out with a feasibility report shortly.
          </p>
          <button
            onClick={resetForm}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF9F8] text-[#1A1A1A] font-sans pb-20">

      {/* Background Aesthetics */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary rounded-full blur-3xl mix-blend-multiply"></div>
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-orange-300 rounded-full blur-3xl mix-blend-multiply"></div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12 pt-16 relative z-10">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3 h-3" />
            <span>Automation Request</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] mb-4 tracking-tight">
            New Document Flow
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Submit details for a new document flow. We'll evaluate if it's a good candidate for AI automation.
          </p>
        </div>

        {/* Stepper */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-between relative px-4">
            {/* Connector Line */}
            <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
            <div className="absolute left-0 top-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / 2) * 100}%` }}></div>

            {/* Steps */}
            {[1, 2, 3].map((num) => (
              <div key={num} className={`flex flex-col items-center gap-2 bg-[#FDF9F8] px-2 ${step >= num ? 'text-primary' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all duration-300 ${step >= num ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' : 'border-gray-200 bg-white'}`}>
                  {step > num ? <Check className="w-5 h-5" /> : num}
                </div>
                <span className="text-xs font-bold uppercase tracking-wide hidden sm:block">
                  {num === 1 ? 'Details' : num === 2 ? 'Volume' : 'Instructions'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden max-w-5xl mx-auto">

          {/* Step 1: Core Details */}
          {step === 1 && (
            <div className="p-8 md:p-12 animate-fade-in">
              <div className="grid md:grid-cols-2 gap-12 mb-8">
                {/* Left Col */}
                <div className="space-y-8">

                  <div className="group">
                    <label className="block text-sm font-bold text-gray-800 mb-2">Principal / Client Name *</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border-gray-200 bg-gray-50/50 shadow-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 py-3 px-4 border transition-all"
                      placeholder="e.g. Nike Global Logistics"
                      value={formData.principalName}
                      onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-bold text-gray-800 mb-2">Sender Email Address(es) *</label>
                    <input
                      type="text"
                      className={`w-full rounded-xl border-gray-200 bg-gray-50/50 shadow-sm focus:bg-white focus:ring-4 transition-all py-3 px-4 border ${emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'focus:border-primary focus:ring-primary/10'}`}
                      placeholder="e.g. docs@nike.com, logistics@nike.com"
                      value={formData.senderEmail}
                      onChange={handleEmailChange}
                    />
                    {emailError && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3" /> {emailError}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">Incoming documents will be identified by this sender.</p>
                  </div>
                </div>

                {/* Right Col */}
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">Flow Type *</label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`group flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.flowType === 'import' ? 'bg-primary/5 border-primary text-primary shadow-inner' : 'bg-white border-gray-100 hover:border-primary/30 hover:shadow-md'}`}>
                        <input type="radio" className="hidden" value="import" checked={formData.flowType === 'import'} onChange={() => setFormData({ ...formData, flowType: 'import' })} />
                        <div className={`p-2 rounded-full mb-2 ${formData.flowType === 'import' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 group-hover:text-primary group-hover:bg-primary/10'}`}>
                          <Download className="w-6 h-6" />
                        </div>
                        <span className="font-bold">Import</span>
                      </label>
                      <label className={`group flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.flowType === 'export' ? 'bg-primary/5 border-primary text-primary shadow-inner' : 'bg-white border-gray-100 hover:border-primary/30 hover:shadow-md'}`}>
                        <input type="radio" className="hidden" value="export" checked={formData.flowType === 'export'} onChange={() => setFormData({ ...formData, flowType: 'export' })} />
                        <div className={`p-2 rounded-full mb-2 ${formData.flowType === 'export' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 group-hover:text-primary group-hover:bg-primary/10'}`}>
                          <ArrowUpCircle className="w-6 h-6" />
                        </div>
                        <span className="font-bold">Export</span>
                      </label>
                    </div>
                  </div>

                  <div className="p-5 bg-gray-50 rounded-xl border border-gray-200/60">
                    <label className="flex items-start gap-4 cursor-pointer">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-primary checked:bg-primary"
                          checked={formData.hasEmailBody}
                          onChange={(e) => setFormData({ ...formData, hasEmailBody: e.target.checked })}
                        />
                        <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block text-sm">Read Email Body?</span>
                        <span className="text-xs text-gray-500 mt-1 block leading-tight">Check this if critical data (like tracking numbers) is located in the email body rather than attachments.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-8 border-t border-gray-100">
                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.principalName || !formData.senderEmail || !!emailError}
                  className="flex items-center gap-2 bg-text-primary text-white px-8 py-3.5 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Next Step <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Context & Files */}
          {step === 2 && (
            <div className="p-8 md:p-12 animate-fade-in">
              <div className="grid md:grid-cols-2 gap-12 mb-8">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-400" />
                      Volume & Context
                    </h3>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="group">
                        <label className="block text-sm font-bold text-gray-800 mb-2">Est. Volume</label>
                        <input
                          type="text"
                          className="w-full rounded-xl border-gray-200 bg-gray-50/50 shadow-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 py-3 px-4 border transition-all"
                          placeholder="e.g. 50"
                          value={formData.volume}
                          onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                        />
                      </div>
                      <div className="group">
                        <label className="block text-sm font-bold text-gray-800 mb-2">Frequency</label>
                        <select
                          className="w-full rounded-xl border-gray-200 bg-gray-50/50 shadow-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 py-3 px-4 border transition-all"
                          value={formData.frequency}
                          onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="adhoc">Ad-hoc</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FileBox className="w-5 h-5 text-gray-400" />
                    Representative Documents
                  </h3>
                  <FileUploadArea
                    files={formData.files}
                    onFileChange={handleFileChange}
                    onRemove={removeFile}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-gray-100">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-900 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Details
                </button>

                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.volume}
                  className="flex items-center gap-2 bg-text-primary text-white px-8 py-3.5 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Next Step <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Instructions (Rich Text) */}
          {step === 3 && (
            <div className="p-8 md:p-12 animate-fade-in flex flex-col h-full min-h-[600px]">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  Extraction Instructions & Notes
                </h3>
                <p className="text-base text-gray-500">
                  Provide detailed instructions on what data should be extracted. You can paste examples, format text, and list specific rules.
                </p>
              </div>

              <div className="flex-1 mb-8 bg-white border border-gray-200 rounded-xl overflow-hidden min-h-[300px] shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                <Editor
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  containerProps={{ style: { height: '100%', minHeight: '350px', border: 'none' } }}
                />
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-auto">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-900 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 shadow-primary/25"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                  {!isSubmitting && <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RequestFlow;