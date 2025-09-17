import React, { useState } from 'react';
import { Sparkles, FileText, Bot, MessageSquare, Loader2, RefreshCw, UploadCloud, Mail, AlertCircle, CheckCircle, Eye, FileIcon } from 'lucide-react';

// Helper component for styled output cards
const OutputCard = ({ icon, title, children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
    <div className="p-4 border-b border-gray-100 flex items-center gap-3">
      {icon}
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="p-4 text-gray-700 space-y-2">
      {children}
    </div>
  </div>
);

// Status indicator component
const StatusIndicator = ({ type, message }) => {
  const styles = {
    success: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle, border: 'border-green-200' },
    error: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircle, border: 'border-red-200' },
    info: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Mail, border: 'border-blue-200' }
  };
  
  const style = styles[type];
  const Icon = style.icon;
  
  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-3 flex items-center gap-2`}>
      <Icon className={`w-5 h-5 ${style.text}`} />
      <span className={`text-sm font-medium ${style.text}`}>{message}</span>
    </div>
  );
};

export default function EmailAssistant() {
  const [emailData, setEmailData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState(null);
  const [rawContent, setRawContent] = useState('');

  // Function to parse EML files
  const parseEMLFile = (content) => {
    const lines = content.split('\n');
    const headers = {};
    let bodyStart = 0;
    let inHeaders = true;
    
    // Parse headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '' && inHeaders) {
        bodyStart = i + 1;
        inHeaders = false;
        break;
      }
      
      if (inHeaders) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).toLowerCase();
          const value = line.substring(colonIndex + 1).trim();
          headers[key] = value;
        }
      }
    }
    
    // Extract body
    const body = lines.slice(bodyStart).join('\n').trim();
    
    return {
      headers,
      body,
      subject: headers['subject'] || 'No Subject',
      from: headers['from'] || 'Unknown Sender',
      to: headers['to'] || 'Unknown Recipient',
      date: headers['date'] || 'Unknown Date',
      contentType: headers['content-type'] || 'text/plain'
    };
  };

  // Function to parse MSG files (basic parsing)
  const parseMSGFile = async (buffer) => {
    try {
      // Convert buffer to text for basic parsing
      const decoder = new TextDecoder('utf-8', { fatal: false });
      let content = decoder.decode(buffer);
      
      // If decode fails or produces garbage, try different encodings
      if (content.includes('�') || content.length < 10) {
        // Try with different encoding or just show hex dump for MSG files
        const uint8Array = new Uint8Array(buffer);
        const hexDump = Array.from(uint8Array.slice(0, 1000))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(' ');
        
        return {
          headers: { 'file-type': 'MSG (Outlook Format)' },
          body: `MSG File Detected - Binary Format\n\nFirst 1000 bytes (hex):\n${hexDump}\n\nNote: MSG files require special parsing. Try converting to EML format for better readability.`,
          subject: 'MSG File (Binary Format)',
          from: 'MSG Parser',
          to: 'You',
          date: new Date().toISOString(),
          contentType: 'application/vnd.ms-outlook'
        };
      }
      
      // Try to extract some readable text
      const readableText = content.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').trim();
      
      return {
        headers: { 'file-type': 'MSG (Partial Parse)' },
        body: readableText.substring(0, 2000) + (readableText.length > 2000 ? '...' : ''),
        subject: 'MSG File Content',
        from: 'MSG File',
        to: 'You',
        date: new Date().toISOString(),
        contentType: 'text/plain'
      };
    } catch (error) {
      throw new Error('Failed to parse MSG file: ' + error.message);
    }
  };

  // Main file processing function
  const processEmailFile = async (file) => {
    setIsLoading(true);
    setStatus({ type: 'info', message: `Reading ${file.name}...` });
    
    try {
      const buffer = await file.arrayBuffer();
      const fileName = file.name.toLowerCase();
      let parsedEmail;
      
      if (fileName.endsWith('.eml')) {
        // Parse EML file
        const decoder = new TextDecoder('utf-8');
        const content = decoder.decode(buffer);
        setRawContent(content);
        parsedEmail = parseEMLFile(content);
        
      } else if (fileName.endsWith('.msg')) {
        // Parse MSG file
        setRawContent('MSG file - binary format');
        parsedEmail = await parseMSGFile(buffer);
        
      } else if (fileName.endsWith('.txt')) {
        // Handle plain text files
        const decoder = new TextDecoder('utf-8');
        const content = decoder.decode(buffer);
        setRawContent(content);
        parsedEmail = {
          headers: { 'file-type': 'Plain Text' },
          body: content,
          subject: 'Text File Content',
          from: 'Text File',
          to: 'You',
          date: new Date().toISOString(),
          contentType: 'text/plain'
        };
      } else {
        throw new Error('Unsupported file format');
      }
      
      // Detect email type
      const isReply = parsedEmail.subject.toLowerCase().includes('re:') || 
                     parsedEmail.body.toLowerCase().includes('wrote:') ||
                     parsedEmail.body.toLowerCase().includes('original message');
                     
      const isForward = parsedEmail.subject.toLowerCase().includes('fwd:') || 
                       parsedEmail.subject.toLowerCase().includes('fw:') ||
                       parsedEmail.body.toLowerCase().includes('forwarded message') ||
                       parsedEmail.body.toLowerCase().includes('begin forwarded message');
      
      // Set email data
      setEmailData({
        ...parsedEmail,
        fileName: file.name,
        fileSize: file.size,
        isReply,
        isForward,
        emailType: isReply ? 'Reply' : isForward ? 'Forward' : 'Original'
      });
      
      setStatus({ 
        type: 'success', 
        message: `Successfully parsed ${file.name} (${Math.round(file.size / 1024)}KB)` 
      });
      
    } catch (error) {
      console.error('Error processing email:', error);
      setStatus({ 
        type: 'error', 
        message: `Failed to process ${file.name}: ${error.message}` 
      });
      setEmailData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (e.relatedTarget === null || !e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    const validExtensions = ['.msg', '.eml', '.txt'];
    const isValidFile = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValidFile) {
      setStatus({ 
        type: 'error', 
        message: `Invalid file type. Please drop a ${validExtensions.join(', ')} file.` 
      });
      return;
    }

    await processEmailFile(file);
  };

  const handleClear = () => {
    setEmailData(null);
    setStatus(null);
    setRawContent('');
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const cleanEmail = (email) => {
    if (!email) return 'Unknown';
    return email.replace(/[<>]/g, '').trim();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <Mail className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Email File Reader
              </h1>
              <p className="text-gray-600 mt-1">
                Drop email files (.eml, .msg, .txt) to view their actual content
              </p>
            </div>
          </div>
          
          {status && (
            <div className="mb-4">
              <StatusIndicator type={status.type} message={status.message} />
            </div>
          )}
        </div>

        {/* Drop Zone */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative p-12 border-2 border-dashed rounded-xl transition-all duration-300 ${
              isDragging 
                ? 'border-blue-400 bg-blue-50 scale-102 shadow-lg' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex flex-col items-center justify-center text-center">
              {isLoading ? (
                <Loader2 className="w-16 h-16 mb-4 text-blue-500 animate-spin" />
              ) : (
                <UploadCloud className={`w-16 h-16 mb-4 transition-colors duration-300 ${
                  isDragging ? 'text-blue-500' : 'text-gray-400'
                }`} />
              )}
              
              <h3 className="font-semibold text-gray-900 mb-2 text-xl">
                {isLoading ? 'Processing email file...' : 'Drop your email file here'}
              </h3>
              
              {!isLoading && (
                <>
                  <p className="text-gray-600 mb-4">
                    Supports .eml (standard email), .msg (Outlook), and .txt files
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">EML files</span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">MSG files</span>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">TXT files</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {emailData && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClear}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Clear & Load New File
              </button>
            </div>
          )}
        </div>

        {/* Email Content Display */}
        {emailData && (
          <div className="space-y-6">
            {/* Email Headers */}
            <OutputCard 
              icon={<Mail className="w-5 h-5 text-blue-500" />} 
              title="Email Information"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Subject:</label>
                  <p className="text-gray-900 font-medium">{emailData.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type:</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    emailData.isReply ? 'bg-blue-100 text-blue-800' :
                    emailData.isForward ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {emailData.emailType}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">From:</label>
                  <p className="text-gray-900">{cleanEmail(emailData.from)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">To:</label>
                  <p className="text-gray-900">{cleanEmail(emailData.to)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date:</label>
                  <p className="text-gray-900">{formatDate(emailData.date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">File:</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <FileIcon className="w-4 h-4" />
                    {emailData.fileName} ({Math.round(emailData.fileSize / 1024)}KB)
                  </p>
                </div>
              </div>
            </OutputCard>

            {/* Email Headers Details */}
            {emailData.headers && Object.keys(emailData.headers).length > 0 && (
              <OutputCard 
                icon={<FileText className="w-5 h-5 text-purple-500" />} 
                title="Email Headers"
              >
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {Object.entries(emailData.headers).map(([key, value]) => 
                      `${key}: ${value}`
                    ).join('\n')}
                  </pre>
                </div>
              </OutputCard>
            )}

            {/* Email Body */}
            <OutputCard 
              icon={<Eye className="w-5 h-5 text-green-500" />} 
              title="Email Body Content"
            >
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">
                  {emailData.body || 'No body content found'}
                </pre>
              </div>
            </OutputCard>

            {/* Raw Content */}
            {rawContent && (
              <OutputCard 
                icon={<Bot className="w-5 h-5 text-orange-500" />} 
                title="Raw File Content"
              >
                <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono">
                    {rawContent.substring(0, 5000)}{rawContent.length > 5000 ? '\n... (truncated)' : ''}
                  </pre>
                </div>
              </OutputCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}