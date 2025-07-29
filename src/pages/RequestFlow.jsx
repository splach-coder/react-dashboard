import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, Image, PlusSquare, Check, AlertCircle, Mail, Download, ArrowUpCircle, Edit3, Square, Type, Palette } from 'lucide-react';

// Mock data
const documentTypes = [
  'Invoice',
  'Packing List', 
  'Material Test Certificate',
  'Certificate of Origin',
  'Bill of Lading',
  'Commercial Invoice',
  'Shipping Manifest',
  'Quality Certificate',
  'Customs Declaration',
  'Insurance Certificate'
];

const principals = [
  'Global Widgets BV',
  'Tech Solutions Inc',
  'Manufacturing Corp',
  'Export Partners Ltd',
  'Trading Company SA',
  'Industrial Supplies Co',
  'Maritime Logistics Ltd'
];

// Sample documents by type (5 per type)
const sampleDocuments = {
  'Invoice': [
    'Invoice_GWI-2024-001.pdf',
    'Invoice_GWI-2024-002.pdf', 
    'Invoice_GWI-2024-003.pdf',
    'Invoice_GWI-2024-004.pdf',
    'Invoice_GWI-2024-005.pdf'
  ],
  'Packing List': [
    'PackingList_PL-2024-001.pdf',
    'PackingList_PL-2024-002.pdf',
    'PackingList_PL-2024-003.pdf', 
    'PackingList_PL-2024-004.pdf',
    'PackingList_PL-2024-005.pdf'
  ],
  'Material Test Certificate': [
    'MTC_Certificate-001.pdf',
    'MTC_Certificate-002.pdf',
    'MTC_Certificate-003.pdf',
    'MTC_Certificate-004.pdf',
    'MTC_Certificate-005.pdf'
  ],
  'Certificate of Origin': [
    'CertOrigin_CO-2024-001.pdf',
    'CertOrigin_CO-2024-002.pdf',
    'CertOrigin_CO-2024-003.pdf',
    'CertOrigin_CO-2024-004.pdf',
    'CertOrigin_CO-2024-005.pdf'
  ],
  'Bill of Lading': [
    'BillOfLading_BOL-001.pdf',
    'BillOfLading_BOL-002.pdf',
    'BillOfLading_BOL-003.pdf',
    'BillOfLading_BOL-004.pdf',
    'BillOfLading_BOL-005.pdf'
  ]
};

// Enhanced PDF Canvas Modal with drawing tools
const PdfCanvasModal = ({ file, onSave, onClose, existingFields = [] }) => {
  const [fields, setFields] = useState(existingFields);
  const [drawingMode, setDrawingMode] = useState('rectangle'); // rectangle, text, highlight
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [fieldLabel, setFieldLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState('#E54C37');
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });

  const colors = [
    '#E54C37', // Primary red
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#6B7280'  // Gray
  ];

  const handleCanvasClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawingMode === 'text') {
      setTextPosition({ x, y });
      setShowTextInput(true);
      return;
    }

    if (drawingMode === 'rectangle' && !fieldLabel.trim()) {
      alert('Please enter a field label first');
      return;
    }
  };

  const handleMouseDown = (e) => {
    if (drawingMode !== 'rectangle') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentField({
      x,
      y,
      width: 0,
      height: 0,
      label: fieldLabel.trim(),
      type: 'rectangle',
      color: selectedColor
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentField || drawingMode !== 'rectangle') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentField(prev => ({
      ...prev,
      width: Math.abs(x - prev.x),
      height: Math.abs(y - prev.y),
      x: Math.min(prev.x, x),
      y: Math.min(prev.y, y)
    }));
  };

  const handleMouseUp = () => {
    if (isDrawing && currentField && currentField.width > 10 && currentField.height > 10) {
      setFields(prev => [...prev, { ...currentField, page: 0 }]);
      setFieldLabel('');
    }
    setIsDrawing(false);
    setCurrentField(null);
  };

  const addTextAnnotation = () => {
    if (textInput.trim()) {
      setFields(prev => [...prev, {
        x: textPosition.x,
        y: textPosition.y,
        width: textInput.length * 8,
        height: 20,
        label: textInput.trim(),
        type: 'text',
        color: selectedColor,
        page: 0
      }]);
      setTextInput('');
      setShowTextInput(false);
    }
  };

  const removeField = (index) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(fields);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">PDF Annotation Tool</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Drawing Mode */}
            <div className="flex gap-2">
              <button
                onClick={() => setDrawingMode('rectangle')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                  drawingMode === 'rectangle' ? 'bg-primary text-white' : 'bg-white border'
                }`}
              >
                <Square className="w-4 h-4" />
                Rectangle
              </button>
              <button
                onClick={() => setDrawingMode('text')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                  drawingMode === 'text' ? 'bg-primary text-white' : 'bg-white border'
                }`}
              >
                <Type className="w-4 h-4" />
                Text
              </button>
            </div>

            {/* Color Picker */}
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-gray-600" />
              <div className="flex gap-1">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded border-2 ${
                      selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Field Label Input (for rectangles) */}
            {drawingMode === 'rectangle' && (
              <input
                type="text"
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
                placeholder="Field label (e.g., invoice_total)"
                className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            )}

            <span className="text-sm text-gray-600">
              {fields.length} annotations
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="relative border-2 border-dashed border-gray-300 bg-gray-50 min-h-[700px]">
            {/* Mock PDF content */}
            <div className="absolute inset-4 bg-white shadow-lg">
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <h1 className="text-xl font-bold">INVOICE</h1>
                  <p className="text-sm text-gray-600">Global Widgets BV</p>
                </div>
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Invoice #:</strong> GWI-2024-07-29</p>
                      <p><strong>Date:</strong> July 29, 2024</p>
                      <p><strong>Customer:</strong> ABC Manufacturing</p>
                    </div>
                    <div>
                      <p><strong>Total:</strong> $1,234.56</p>
                      <p><strong>Due:</strong> August 28, 2024</p>
                      <p><strong>Terms:</strong> Net 30</p>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Item Description</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Unit Price</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 8 }, (_, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-1">Widget Component {String.fromCharCode(65 + i)}</td>
                          <td className="text-right py-1">{i + 1}</td>
                          <td className="text-right py-1">$100.{i}0</td>
                          <td className="text-right py-1">${(i + 1) * 100}.{i}0</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t pt-4 text-right">
                  <div className="space-y-1 text-sm">
                    <p><strong>Subtotal:</strong> $3,600.00</p>
                    <p><strong>Tax (8.5%):</strong> $306.00</p>
                    <p><strong>Shipping:</strong> $50.00</p>
                    <p className="text-lg"><strong>Total Amount:</strong> $3,956.00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawing overlay */}
            <div
              className="absolute inset-0 cursor-crosshair"
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* Existing annotations */}
              {fields.map((field, index) => (
                <div
                  key={index}
                  className="absolute border-2"
                  style={{
                    left: field.x,
                    top: field.y,
                    width: field.width,
                    height: field.height,
                    borderColor: field.color,
                    backgroundColor: field.type === 'text' ? 'transparent' : `${field.color}20`
                  }}
                >
                  {field.type === 'text' ? (
                    <span 
                      className="text-sm font-medium"
                      style={{ color: field.color }}
                    >
                      {field.label}
                    </span>
                  ) : (
                    <div className="absolute -top-6 left-0 text-white text-xs px-1 rounded"
                         style={{ backgroundColor: field.color }}>
                      {field.label}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeField(index);
                        }}
                        className="ml-1 hover:text-red-200"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Current drawing field */}
              {isDrawing && currentField && drawingMode === 'rectangle' && (
                <div
                  className="absolute border-2"
                  style={{
                    left: currentField.x,
                    top: currentField.y,
                    width: currentField.width,
                    height: currentField.height,
                    borderColor: selectedColor,
                    backgroundColor: `${selectedColor}30`
                  }}
                />
              )}
            </div>

            {/* Text Input Modal */}
            {showTextInput && (
              <div 
                className="absolute bg-white p-3 border rounded-lg shadow-lg z-10"
                style={{ left: textPosition.x, top: textPosition.y }}
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter text annotation"
                  className="border rounded px-2 py-1 text-sm w-48"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && addTextAnnotation()}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={addTextAnnotation}
                    className="px-2 py-1 bg-primary text-white text-xs rounded"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowTextInput(false)}
                    className="px-2 py-1 bg-gray-300 text-xs rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save Annotations
          </button>
        </div>
      </div>
    </div>
  );
};

// Document Category Component
const DocumentCategory = ({ type, documents, onDocumentSelect, selectedDocs }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'Invoice': return <FileText className="w-5 h-5 text-green-600" />;
      case 'Packing List': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'Material Test Certificate': return <FileText className="w-5 h-5 text-purple-600" />;
      case 'Certificate of Origin': return <FileText className="w-5 h-5 text-orange-600" />;
      case 'Bill of Lading': return <FileText className="w-5 h-5 text-red-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center gap-3 mb-4">
        {getTypeIcon(type)}
        <h3 className="font-semibold text-gray-900">{type}</h3>
        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
          {documents.length} examples
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {documents.map((doc, index) => {
          const isSelected = selectedDocs.some(selected => selected.name === doc && selected.type === type);
          const isFirstExample = index === 0; // First example gets PDF annotation feature
          
          return (
            <div
              key={doc}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected 
                  ? 'border-primary bg-red-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onDocumentSelect({ name: doc, type, hasAnnotation: isFirstExample })}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">{doc}</span>
                  {isFirstExample && (
                    <span className="bg-primary text-white text-xs px-2 py-1 rounded">
                      <Edit3 className="w-3 h-3 inline mr-1" />
                      Annotatable
                    </span>
                  )}
                </div>
                {isSelected && <Check className="w-4 h-4 text-primary" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main Request Flow Component
const RequestFlow = () => {
  const [step, setStep] = useState(1);
  
  // Step 1: Flow Configuration
  const [flowName, setFlowName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [hasEmailData, setHasEmailData] = useState(false);
  const [emailDataDescription, setEmailDataDescription] = useState('');
  const [flowType, setFlowType] = useState('');
  const [principalName, setPrincipalName] = useState('');

  // Step 2: Document Selection
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Step 3: Annotations
  const [showCanvas, setShowCanvas] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [annotations, setAnnotations] = useState({});

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDocumentSelect = (document) => {
    setSelectedDocuments(prev => {
      const exists = prev.find(doc => doc.name === document.name && doc.type === document.type);
      if (exists) {
        return prev.filter(doc => !(doc.name === document.name && doc.type === document.type));
      } else {
        return [...prev, document];
      }
    });
  };

  const handleFileUpload = useCallback((e) => {
    e.preventDefault();
    const files = e.dataTransfer ? Array.from(e.dataTransfer.files) : Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const openAnnotation = (document) => {
    setCurrentDocument(document);
    setShowCanvas(true);
  };

  const saveAnnotations = (annotationData) => {
    setAnnotations(prev => ({
      ...prev,
      [currentDocument.name]: annotationData
    }));
  };

  const canProceedStep1 = flowName && senderEmail && flowType && principalName && 
    (!hasEmailData || emailDataDescription);

  const canProceedStep2 = selectedDocuments.length > 0 || uploadedFiles.length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const payload = {
      id: `flow-${Date.now()}`,
      flowConfiguration: {
        name: flowName,
        senderEmail,
        hasEmailData,
        emailDataDescription: hasEmailData ? emailDataDescription : null,
        type: flowType,
        principal: principalName
      },
      selectedDocuments,
      uploadedFiles: uploadedFiles.map(file => file.name),
      annotations,
      timestamp: new Date().toISOString()
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Flow request submitted:', payload);
      
      setShowSuccess(true);
      setTimeout(() => {
        // Reset all states
        setStep(1);
        setFlowName('');
        setSenderEmail('');
        setHasEmailData(false);
        setEmailDataDescription('');
        setFlowType('');
        setPrincipalName('');
        setSelectedDocuments([]);
        setUploadedFiles([]);
        setAnnotations({});
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit flow request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Request New Flow</h1>
        <p className="text-gray-600">Configure your document extraction flow</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-8 mb-8">
        {[
          { num: 1, title: 'Flow Setup', icon: PlusSquare },
          { num: 2, title: 'Documents', icon: FileText },
          { num: 3, title: 'Review', icon: Check }
        ].map(({ num, title, icon: Icon }) => (
          <div key={num} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= num ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className={`ml-2 font-medium ${
              step >= num ? 'text-primary' : 'text-gray-600'
            }`}>
              {title}
            </span>
            {num < 3 && <div className="w-8 h-px bg-gray-300 ml-4" />}
          </div>
        ))}
      </div>

      {/* Step 1: Flow Configuration */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Flow Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flow Name *
              </label>
              <input
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="e.g., Q3 Export Documentation"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sender Email *
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="sender@company.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasEmailData"
                checked={hasEmailData}
                onChange={(e) => setHasEmailData(e.target.checked)}
                className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="hasEmailData" className="ml-2 text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Extract data from email content
              </label>
            </div>

            {hasEmailData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the email data to extract *
                </label>
                <textarea
                  value={emailDataDescription}
                  onChange={(e) => setEmailDataDescription(e.target.value)}
                  placeholder="e.g., Extract shipment tracking numbers, delivery dates, and customer reference numbers from email body and subject line"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flow Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="export"
                    checked={flowType === 'export'}
                    onChange={(e) => setFlowType(e.target.value)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="ml-2 flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4" />
                    Export
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="import"
                    checked={flowType === 'import'}
                    onChange={(e) => setFlowType(e.target.value)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="ml-2 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Import
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Principal Name *
              </label>
              <select
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select principal...</option>
                {principals.map(principal => (
                  <option key={principal} value={principal}>{principal}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className={`px-6 py-2 rounded-lg font-medium ${
                canProceedStep1
                  ? 'bg-primary text-white hover:bg-red-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue to Documents
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Document Selection */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Document Categories */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Document Examples</h2>
            <p className="text-gray-600 mb-6">
              Choose from our document examples or upload your own files. Each document type has 5 examples available.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(sampleDocuments).map(([type, documents]) => (
                <DocumentCategory
                  key={type}
                  type={type}
                  documents={documents}
                  onDocumentSelect={handleDocumentSelect}
                  selectedDocs={selectedDocuments}
                />
              ))}
            </div>

            {selectedDocuments.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Selected Documents ({selectedDocuments.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDocuments.map((doc, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                    >
                      {doc.name}
                      {doc.hasAnnotation && (
                        <Edit3 className="w-3 h-3" />
                      )}
                      <button
                        onClick={() => handleDocumentSelect(doc)}
                        className="hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* File Upload Section */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Or Upload Your Own Files</h3>
            
            <div
              onDrop={handleFileUpload}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary transition-colors"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Drop files here or click to browse
              </h4>
              <p className="text-gray-600 mb-4">
                Upload PDF, JPG, PNG files • Max 10MB each
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-red-600 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Uploaded Files ({uploadedFiles.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PDF Annotation Section */}
          {selectedDocuments.some(doc => doc.hasAnnotation) && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                PDF Annotation Available
              </h3>
              <p className="text-gray-600 mb-4">
                The following documents support PDF annotation for field marking and custom notes:
              </p>
              
              <div className="space-y-3">
                {selectedDocuments
                  .filter(doc => doc.hasAnnotation)
                  .map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-3">
                        <Edit3 className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-600">{doc.type}</p>
                        </div>
                        {annotations[doc.name] && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            {annotations[doc.name].length} annotations
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => openAnnotation(doc)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        {annotations[doc.name] ? 'Edit' : 'Annotate'}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className={`px-6 py-2 rounded-lg font-medium ${
                canProceedStep2
                  ? 'bg-primary text-white hover:bg-red-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue to Review
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Review Flow Request</h2>

          {/* Flow Configuration Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Flow Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Flow Name:</strong> {flowName}</p>
                <p><strong>Sender Email:</strong> {senderEmail}</p>
                <p><strong>Principal:</strong> {principalName}</p>
              </div>
              <div>
                <p><strong>Type:</strong> {flowType}</p>
                <p className="flex items-center gap-2">
                  <strong>Email Data Extraction:</strong> 
                  {hasEmailData ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Yes
                    </span>
                  ) : (
                    <span className="text-gray-500">No</span>
                  )}
                </p>
                {hasEmailData && (
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>Details:</strong> {emailDataDescription}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Documents Summary */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Selected Documents</h3>
            
            {selectedDocuments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Document Examples ({selectedDocuments.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedDocuments.map((doc, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-900 text-sm">{doc.name}</p>
                          <p className="text-xs text-blue-700">{doc.type}</p>
                        </div>
                        {doc.hasAnnotation && annotations[doc.name] && (
                          <span className="bg-primary text-white text-xs px-2 py-1 rounded">
                            {annotations[doc.name].length} notes
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files ({uploadedFiles.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900 text-sm">{file.name}</p>
                          <p className="text-xs text-green-700">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Annotations Summary */}
            {Object.keys(annotations).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">PDF Annotations</h4>
                <div className="space-y-2">
                  {Object.entries(annotations).map(([docName, docAnnotations]) => (
                    <div key={docName} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-yellow-900 text-sm">{docName}</p>
                        <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded">
                          {docAnnotations.length} annotations
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {docAnnotations.slice(0, 3).map((annotation, i) => (
                          <span key={i} className="text-xs bg-white px-2 py-1 rounded border">
                            {annotation.label}
                          </span>
                        ))}
                        {docAnnotations.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{docAnnotations.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-red-600'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Submit Flow Request
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PDF Canvas Modal */}
      {showCanvas && currentDocument && (
        <PdfCanvasModal
          file={currentDocument}
          existingFields={annotations[currentDocument.name] || []}
          onSave={saveAnnotations}
          onClose={() => setShowCanvas(false)}
        />
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <div>
              <p className="font-medium">Flow request submitted successfully!</p>
              <p className="text-sm text-green-100">You'll receive a confirmation email shortly.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestFlow;