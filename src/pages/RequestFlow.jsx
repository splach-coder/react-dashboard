import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, X, FileText, Check, Mail, Download, ArrowUpCircle, Edit3, Square, Type, Palette, PlusSquare, Hand } from 'lucide-react';

// Enhanced PDF Canvas Modal with better viewing and interaction
const PdfCanvasModal = ({ file, onSave, onClose, existingFields = [] }) => {
  const [fields, setFields] = useState(existingFields);
  const [drawingMode, setDrawingMode] = useState(null); // null, 'rectangle', 'text', 'move'
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [fieldLabel, setFieldLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState('#E54C37');
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfScale, setPdfScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  const [pdfPosition, setPdfPosition] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef(null);
  const pdfContainerRef = useRef(null);
  const pdfViewerRef = useRef(null);

  const colors = ['#E54C37', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280'];

  // Load PDF using URL.createObjectURL
  useEffect(() => {
    if (file.fileObject) {
      try {
        const url = URL.createObjectURL(file.fileObject);
        setPdfUrl(url);
        setPdfLoading(false);
        return () => URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error creating PDF URL:', error);
        setPdfError('Failed to load PDF file');
        setPdfLoading(false);
      }
    }
  }, [file.fileObject]);

  // Improved PDF rendering with better controls
  const renderPdfViewer = () => {
    if (pdfLoading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        </div>
      );
    }

    if (pdfError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-center text-red-600">
            <X className="w-12 h-12 mx-auto mb-2" />
            <p>{pdfError}</p>
            <p className="text-sm text-gray-500 mt-2">Please try uploading a different PDF file.</p>
          </div>
        </div>
      );
    }

    return (
      <div 
        ref={pdfViewerRef}
        className="absolute inset-0 bg-white overflow-hidden"
        style={{
          transform: `translate(${pdfPosition.x}px, ${pdfPosition.y}px) scale(${pdfScale})`,
          transformOrigin: 'top left',
          width: '100%',
          height: '100%'
        }}
      >
        <iframe
          src={`${pdfUrl}#page=${pageNumber}`}
          className="w-full h-full border-0"
          title="PDF Viewer"
          style={{ pointerEvents: drawingMode === 'move' ? 'auto' : 'none' }}
        />
      </div>
    );
  };

  const getMousePosition = (e) => {
    const rect = pdfContainerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    // Adjust for PDF position and scale
    return {
      x: (e.clientX - rect.left - pdfPosition.x) / pdfScale,
      y: (e.clientY - rect.top - pdfPosition.y) / pdfScale
    };
  };

  const handleMouseDown = (e) => {
    const { x, y } = getMousePosition(e);

    if (drawingMode === 'move') {
      setIsDragging(true);
      setStartDragPos({ x, y });
      return;
    }

    if (drawingMode === 'text') {
      setTextPosition({ x, y });
      setShowTextInput(true);
      return;
    }

    if (drawingMode === 'rectangle' && !fieldLabel.trim()) {
      alert('Please enter a field label first');
      return;
    }

    if (drawingMode === 'rectangle') {
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
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getMousePosition(e);

    if (isDragging && drawingMode === 'move') {
      setPdfPosition(prev => ({
        x: prev.x + (x - startDragPos.x),
        y: prev.y + (y - startDragPos.y)
      }));
      return;
    }

    if (isDrawing && currentField && drawingMode === 'rectangle') {
      setCurrentField(prev => ({
        ...prev,
        width: x - prev.x,
        height: y - prev.y
      }));
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }

    if (isDrawing && currentField && Math.abs(currentField.width) > 10 && Math.abs(currentField.height) > 10) {
      const normalizedField = {
        ...currentField,
        x: currentField.width < 0 ? currentField.x + currentField.width : currentField.x,
        y: currentField.height < 0 ? currentField.y + currentField.height : currentField.y,
        width: Math.abs(currentField.width),
        height: Math.abs(currentField.height),
        page: pageNumber - 1
      };
      
      setFields(prev => [...prev, normalizedField]);
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
        label: textInput.trim(),
        type: 'text',
        color: selectedColor,
        page: pageNumber - 1
      }]);
      setTextInput('');
      setShowTextInput(false);
    }
  };

  const removeField = (fieldToRemove) => {
    setFields(prev => prev.filter(field => field !== fieldToRemove));
  };

  const handleSave = () => {
    onSave(fields);
    onClose();
  };

  const resetView = () => {
    setPdfPosition({ x: 0, y: 0 });
    setPdfScale(1);
  };

  const currentPageFields = fields.filter(field => field.page === pageNumber - 1);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-semibold">Annotate Document: {file.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Enhanced Toolbar */}
        <div className="p-3 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Tool:</span>
              <button 
                onClick={() => setDrawingMode('move')} 
                className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm ${
                  drawingMode === 'move' ? 'bg-blue-500 text-white' : 'bg-white border hover:bg-gray-50'
                }`}
              >
                <Hand className="w-4 h-4" /> Move
              </button>
              <button 
                onClick={() => setDrawingMode('rectangle')} 
                className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm ${
                  drawingMode === 'rectangle' ? 'bg-red-500 text-white' : 'bg-white border hover:bg-gray-50'
                }`}
              >
                <Square className="w-4 h-4" /> Rectangle
              </button>
              <button 
                onClick={() => setDrawingMode('text')} 
                className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm ${
                  drawingMode === 'text' ? 'bg-red-500 text-white' : 'bg-white border hover:bg-gray-50'
                }`}
              >
                <Type className="w-4 h-4" /> Text
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-gray-600" />
              {colors.map(color => (
                <button 
                  key={color} 
                  onClick={() => setSelectedColor(color)} 
                  className={`w-6 h-6 rounded-full border-2 ${
                    selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                  }`} 
                  style={{ backgroundColor: color }} 
                />
              ))}
            </div>
            
            {drawingMode === 'rectangle' && (
              <input 
                type="text" 
                value={fieldLabel} 
                onChange={(e) => setFieldLabel(e.target.value)} 
                placeholder="Enter field label..." 
                className="flex-grow border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" 
              />
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button 
                onClick={resetView}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
              >
                Reset View
              </button>
              <span className="text-sm text-gray-600">Zoom:</span>
              <button 
                onClick={() => setPdfScale(prev => Math.max(0.5, prev - 0.25))}
                className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
              >
                -
              </button>
              <span className="text-sm w-12 text-center">{Math.round(pdfScale * 100)}%</span>
              <button 
                onClick={() => setPdfScale(prev => Math.min(3, prev + 0.25))}
                className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          {/* Page Navigation */}
          <div className="flex justify-center items-center gap-4 mb-4">
            <button 
              onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
              className="px-3 py-1 bg-white border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm font-medium px-4 py-1 bg-white rounded border">
              Page {pageNumber} {numPages && `of ${numPages}`}
            </span>
            <button 
              onClick={() => setPageNumber(prev => prev + 1)}
              className="px-3 py-1 bg-white border rounded hover:bg-gray-50"
            >
              Next
            </button>
          </div>

          {/* Enhanced PDF Container with better interaction */}
          <div 
            ref={pdfContainerRef}
            className="relative mx-auto bg-white shadow-lg overflow-hidden"
            style={{ 
              width: '100%', 
              height: '600px',
              cursor: drawingMode === 'move' ? (isDragging ? 'grabbing' : 'grab') : 
                     drawingMode === 'rectangle' ? 'crosshair' : 
                     drawingMode === 'text' ? 'text' : 'default'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* PDF Display */}
            {renderPdfViewer()}

            {/* Annotations Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {currentPageFields.map((field, index) => (
                <div key={index}>
                  {field.type === 'rectangle' && (
                    <div 
                      className="absolute border-2 pointer-events-auto" 
                      style={{ 
                        left: field.x * pdfScale + pdfPosition.x, 
                        top: field.y * pdfScale + pdfPosition.y, 
                        width: field.width * pdfScale, 
                        height: field.height * pdfScale, 
                        borderColor: field.color, 
                        backgroundColor: `${field.color}15` 
                      }}
                    >
                      <div 
                        className="absolute -top-6 left-0 text-white text-xs px-2 py-0.5 rounded-full flex items-center whitespace-nowrap" 
                        style={{ backgroundColor: field.color }}
                      >
                        {field.label}
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            removeField(field); 
                          }} 
                          className="ml-2 text-white hover:text-red-200 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                  {field.type === 'text' && (
                    <div 
                      className="absolute pointer-events-auto text-sm font-medium p-1 rounded"
                      style={{ 
                        left: field.x * pdfScale + pdfPosition.x, 
                        top: field.y * pdfScale + pdfPosition.y, 
                        color: field.color,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)'
                      }}
                    >
                      {field.label}
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          removeField(field); 
                        }} 
                        className="ml-2 text-red-500 hover:text-red-700 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Current Drawing Field */}
              {isDrawing && currentField && (
                <div 
                  className="absolute border-2 border-dashed" 
                  style={{ 
                    left: (currentField.width < 0 ? currentField.x + currentField.width : currentField.x) * pdfScale + pdfPosition.x,
                    top: (currentField.height < 0 ? currentField.y + currentField.height : currentField.y) * pdfScale + pdfPosition.y,
                    width: Math.abs(currentField.width) * pdfScale, 
                    height: Math.abs(currentField.height) * pdfScale, 
                    borderColor: selectedColor, 
                    backgroundColor: `${selectedColor}10` 
                  }} 
                />
              )}
            </div>

            {/* Text Input Modal */}
            {showTextInput && (
              <div 
                className="absolute bg-white p-3 border rounded-lg shadow-xl z-10 pointer-events-auto" 
                style={{ 
                  left: Math.min(textPosition.x * pdfScale + pdfPosition.x, 600), 
                  top: Math.min(textPosition.y * pdfScale + pdfPosition.y, 900) 
                }}
              >
                <input 
                  type="text" 
                  value={textInput} 
                  onChange={(e) => setTextInput(e.target.value)} 
                  placeholder="Enter text annotation" 
                  className="border rounded px-3 py-1 text-sm w-56 focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                  autoFocus 
                  onKeyPress={(e) => e.key === 'Enter' && addTextAnnotation()} 
                />
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={addTextAnnotation} 
                    className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Add
                  </button>
                  <button 
                    onClick={() => setShowTextInput(false)} 
                    className="px-3 py-1 bg-gray-200 text-xs rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Field Summary */}
          {currentPageFields.length > 0 && (
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <h4 className="font-medium text-sm text-gray-700 mb-2">
                Annotations on Page {pageNumber} ({currentPageFields.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {currentPageFields.map((field, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs text-white"
                    style={{ backgroundColor: field.color }}
                  >
                    {field.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-600">
            Total annotations: {fields.length}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Save Annotations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced File Upload Component
const FileUploadBox = ({ category, files, onFileChange, onRemoveFile, onOpenAnnotation }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      onFileChange(e.dataTransfer.files, category);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-lg p-6 transition-all ${isDragging ? 'border-2 border-dashed border-blue-500 bg-blue-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
      <div className="flex justify-between items-center mt-2 mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(files.length / 5 * 100, 100)}%` }}></div>
        </div>
        <span className="text-sm font-medium text-gray-600 ml-3">{files.length}/5</span>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-5 h-5 text-red-500 flex-shrink-0"/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                {file.annotations.length > 0 && <span className="text-xs text-green-600">{file.annotations.length} annotations</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onOpenAnnotation(file, category)} 
                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md"
                disabled={!file.isUploaded}
              >
                <Edit3 className="w-4 h-4"/>
              </button>
              <button 
                onClick={() => onRemoveFile(category, index)} 
                className="p-1.5 text-red-500 hover:bg-red-100 rounded-md"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div 
        className={`mt-4 cursor-pointer ${isDragging ? 'bg-blue-100' : 'bg-red-50 hover:bg-red-100'}`}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-red-300 rounded-lg">
          <Upload className="w-6 h-6 text-red-500"/>
          <span className="text-sm text-red-500 font-medium">Drag & drop files here or click to browse</span>
          <span className="text-xs text-gray-500">Supports PDF, JPG, PNG</span>
        </div>
      </div>
      <input 
        ref={fileInputRef}
        type="file" 
        multiple 
        accept=".pdf,.jpg,.jpeg,.png" 
        onChange={(e) => onFileChange(e.target.files, category)} 
        className="hidden"
      />
    </div>
  );
};

// Main Component with Enhanced UI
const RequestFlow = () => {
    const [step, setStep] = useState(1);
    const [flowName, setFlowName] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const [hasEmailData, setHasEmailData] = useState(false);
    const [emailDataDescription, setEmailDataDescription] = useState('');
    const [flowType, setFlowType] = useState('');
    const [principalName, setPrincipalName] = useState('');

    const initialCategories = {
        'Invoice': [],
        'Packing List': [],
        'Material Test Certificate': [],
        'Certificate of Origin': [],
        'Bill of Lading': []
    };
    const [documentCategories, setDocumentCategories] = useState(initialCategories);

    const [showCanvas, setShowCanvas] = useState(false);
    const [currentDocument, setCurrentDocument] = useState({ file: null, category: null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleFileChange = (files, category) => {
        if (!files || files.length === 0) return;
        
        const newFiles = Array.from(files).map(file => ({
            name: file.name,
            fileObject: file,
            isUploaded: true,
            annotations: []
        }));

        setDocumentCategories(prev => {
            const updatedCategory = [...prev[category], ...newFiles];
            return { ...prev, [category]: updatedCategory };
        });
    };

    const removeFile = (category, index) => {
        setDocumentCategories(prev => {
            const updatedCategory = prev[category].filter((_, i) => i !== index);
            return { ...prev, [category]: updatedCategory };
        });
    };

    const openAnnotation = (file, category) => {
        setCurrentDocument({ file, category });
        setShowCanvas(true);
    };

    const saveAnnotations = (annotations) => {
        const { file, category } = currentDocument;
        setDocumentCategories(prev => {
            const categoryFiles = prev[category];
            const fileIndex = categoryFiles.findIndex(f => f.name === file.name);
            const updatedFile = { ...categoryFiles[fileIndex], annotations };
            const updatedCategoryFiles = [...categoryFiles];
            updatedCategoryFiles[fileIndex] = updatedFile;
            return { ...prev, [category]: updatedCategoryFiles };
        });
    };

    const canProceedStep1 = flowName && senderEmail && flowType && principalName && (!hasEmailData || emailDataDescription);
    const canProceedStep2 = Object.values(documentCategories).every(cat => cat.length >= 5);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            setShowSuccess(true);
            setTimeout(() => {
                setStep(1);
                setFlowName('');
                setSenderEmail('');
                setPrincipalName('');
                setFlowType('');
                setHasEmailData(false);
                setEmailDataDescription('');
                setDocumentCategories(initialCategories);
                setShowSuccess(false);
            }, 3000);

        } catch (error) {
            console.error('Submission error:', error);
            alert(`Failed to submit flow request: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8 font-sans">
            <style jsx>{`
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .bg-primary { background-color: #E54C37; }
                .text-primary { color: #E54C37; }
                .border-primary { border-color: #E54C37; }
                .focus\:ring-primary:focus { --tw-ring-color: #E54C37; }
                .focus\:border-primary:focus { border-color: #E54C37; }
                .hover\:bg-red-600:hover { background-color: #dc2626; }
            `}</style>

            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800">Request a New Document Flow</h1>
                <p className="text-lg text-gray-600 mt-2">A three-step process to configure your automated extraction workflow.</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-2xl mx-auto">
                <div className="flex justify-between items-center">
                    {[1, 2, 3].map(num => (
                        <React.Fragment key={num}>
                            <div className="flex flex-col items-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${step >= num ? 'bg-primary border-primary text-white' : 'bg-gray-200 border-gray-300 text-gray-500'}`}>
                                    {step > num ? <Check /> : <span className="text-xl font-bold">{num}</span>}
                                </div>
                                <p className={`mt-2 font-semibold text-sm ${step >= num ? 'text-primary' : 'text-gray-600'}`}>
                                    {num === 1 ? 'Setup' : num === 2 ? 'Documents' : 'Review'}
                                </p>
                            </div>
                            {num < 3 && <div className={`flex-1 h-1 mx-4 ${step > num ? 'bg-primary' : 'bg-gray-300'}`} />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Step 1: Flow Configuration */}
            {step === 1 && (
                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-semibold text-gray-900 border-b pb-4">Flow Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Flow Name *</label>
                            <input 
                                type="text" 
                                value={flowName} 
                                onChange={(e) => setFlowName(e.target.value)} 
                                placeholder="e.g., Q4 Export Documents" 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sender Email *</label>
                            <input 
                                type="email" 
                                value={senderEmail} 
                                onChange={(e) => setSenderEmail(e.target.value)} 
                                placeholder="sender@example.com" 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Flow Type *</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-red-50 has-[:checked]:border-primary">
                                    <input 
                                        type="radio" 
                                        value="export" 
                                        checked={flowType === 'export'} 
                                        onChange={(e) => setFlowType(e.target.value)} 
                                        className="text-primary focus:ring-primary"
                                    />
                                    <ArrowUpCircle className="w-5 h-5"/> 
                                    Export
                                </label>
                                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-red-50 has-[:checked]:border-primary">
                                    <input 
                                        type="radio" 
                                        value="import" 
                                        checked={flowType === 'import'} 
                                        onChange={(e) => setFlowType(e.target.value)} 
                                        className="text-primary focus:ring-primary"
                                    />
                                    <Download className="w-5 h-5"/> 
                                    Import
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Principal Name *</label>
                            <input 
                                type="text" 
                                value={principalName} 
                                onChange={(e) => setPrincipalName(e.target.value)} 
                                placeholder="e.g., Global Trade Inc." 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>
                    </div>
                    <div className="pt-4 space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={hasEmailData} 
                                onChange={(e) => setHasEmailData(e.target.checked)} 
                                className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                            />
                            <Mail className="w-5 h-5 text-gray-600"/> 
                            Extract data from email content (subject/body)
                        </label>
                        {hasEmailData && (
                            <textarea 
                                value={emailDataDescription} 
                                onChange={(e) => setEmailDataDescription(e.target.value)} 
                                placeholder="Describe the data to extract, e.g., 'shipment tracking numbers, container IDs, and delivery dates'." 
                                rows={3} 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary mt-2"
                            />
                        )}
                    </div>
                    <div className="flex justify-end pt-6">
                        <button 
                            onClick={() => setStep(2)} 
                            disabled={!canProceedStep1} 
                            className="px-8 py-3 rounded-lg font-bold text-white bg-primary hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}
            
            {/* Step 2: Document Upload & Annotation */}
            {step === 2 && (
                <div className="space-y-8 animate-fade-in">
                    <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                        <h2 className="text-xl font-semibold text-blue-900">Upload Document Examples</h2>
                        <p className="text-blue-700 mt-1">Each category requires a minimum of 5 example documents for the AI model to learn accurately. Upload your own files for each category below.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {Object.keys(documentCategories).map(category => (
                            <FileUploadBox
                                key={category}
                                category={category}
                                files={documentCategories[category]}
                                onFileChange={(files) => handleFileChange(files, category)}
                                onRemoveFile={removeFile}
                                onOpenAnnotation={openAnnotation}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between pt-6">
                        <button onClick={() => setStep(1)} className="px-8 py-3 rounded-lg font-bold border border-gray-300 hover:bg-gray-100 transition-all">Back</button>
                        <button onClick={() => setStep(3)} disabled={!canProceedStep2} className="px-8 py-3 rounded-lg font-bold text-white bg-primary hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg">Continue to Review</button>
                    </div>
                    {!canProceedStep2 && <p className="text-center text-red-600 font-medium text-sm">You must provide at least 5 documents for each category to continue.</p>}
                </div>
            )}

            {/* Step 3: Review & Submit */}
            {step === 3 && (
                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-semibold text-gray-900 border-b pb-4">Review & Submit</h2>
                    {/* Summary Sections */}
                    <div className="space-y-6">
                        {/* Flow Config Summary */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-3">Flow Configuration</h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <p><strong>Flow Name:</strong> {flowName}</p>
                                <p><strong>Sender Email:</strong> {senderEmail}</p>
                                <p><strong>Principal:</strong> {principalName}</p>
                                <p><strong>Flow Type:</strong> <span className="capitalize">{flowType}</span></p>
                                <p><strong>Email Extraction:</strong> {hasEmailData ? 'Yes' : 'No'}</p>
                                {hasEmailData && <p className="col-span-2"><strong>Extraction Details:</strong> {emailDataDescription}</p>}
                            </div>
                        </div>

                        {/* Documents Summary */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-3">Submitted Documents</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(documentCategories).map(([category, files]) => (
                                    <div key={category}>
                                        <h4 className="font-medium text-gray-800">{category} ({files.length})</h4>
                                        <ul className="list-disc list-inside text-sm text-gray-700 mt-1 space-y-1">
                                            {files.map((file, index) => (
                                                <li key={index} className="truncate">
                                                    {file.name}
                                                    {file.annotations.length > 0 && <span className="ml-2 text-xs font-semibold text-green-700">({file.annotations.length} annotations)</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between pt-6">
                        <button onClick={() => setStep(2)} className="px-8 py-3 rounded-lg font-bold border border-gray-300 hover:bg-gray-100 transition-all">Back</button>
                        <button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-3 w-48 rounded-lg font-bold flex items-center justify-center text-white bg-primary hover:bg-red-600 disabled:bg-gray-300 transition-all shadow-md hover:shadow-lg">
                            {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Submit Request'}
                        </button>
                    </div>
                </div>
            )}
            
            {/* Modal & Toast */}
            {showCanvas && <PdfCanvasModal file={currentDocument.file} existingFields={currentDocument.file.annotations} onSave={saveAnnotations} onClose={() => setShowCanvas(false)}/>}
            {showSuccess && (
                <div className="fixed top-5 right-5 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-fade-in">
                    <Check className="w-6 h-6"/>
                    <div>
                        <p className="font-bold">Success!</p>
                        <p className="text-sm">Your flow request has been submitted.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestFlow;