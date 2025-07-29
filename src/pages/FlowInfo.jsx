import React from 'react';
import { Mail, Zap, Brain, FileSpreadsheet } from 'lucide-react';
import StepCard from '../components/FlowInfo/StepCard';
import TechStack from '../components/FlowInfo/TechStack';

const FlowInfo = () => {
  const steps = [
    {
      icon: <Mail className="w-12 h-12 text-blue-500" />,
      title: "Email arrives",
      description: "Logic Apps continuously monitor Outlook for incoming emails with attachments. When a new email is detected, the system automatically triggers the processing workflow."
    },
    {
      icon: <Zap className="w-12 h-12 text-green-500" />,
      title: "Azure Function receives & decodes file",
      description: "The Azure Function securely receives the email attachment, validates the file format, and prepares it for AI processing using advanced decoding algorithms."
    },
    {
      icon: <Brain className="w-12 h-12 text-purple-500" />,
      title: "AI extraction",
      description: "Multiple AI services work together: Tesseract for OCR text recognition, OpenAI GPT-4V for intelligent content analysis, and Azure Form Recognizer for structured data extraction."
    },
    {
      icon: <FileSpreadsheet className="w-12 h-12 text-red-500" />,
      title: "Excel file generated & emailed",
      description: "The extracted data is formatted into a structured Excel file with proper headers, validation, and formatting, then automatically emailed back to the requestor."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          DKM Automation Explained
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover how our intelligent document processing system transforms email attachments 
          into structured data using cutting-edge AI technology.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, index) => (
          <StepCard
            key={index}
            icon={step.icon}
            title={`${index + 1}. ${step.title}`}
            description={step.description}
          />
        ))}
      </div>

      {/* Tech Stack */}
      <TechStack />

    
    </div>
  );
};

export default FlowInfo;