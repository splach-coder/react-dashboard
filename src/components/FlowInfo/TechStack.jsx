import React from 'react';
import { Mail, Zap, Code, Brain, FileSpreadsheet } from 'lucide-react';

const TechStack = () => {
  const technologies = [
    {
      icon: <Mail className="w-16 h-16 text-blue-600" />,
      name: "Outlook",
      description: "Email Processing"
    },
    {
      icon: <Zap className="w-16 h-16 text-blue-500" />,
      name: "Azure Functions",
      description: "Serverless Computing"
    },
    {
      icon: <Code className="w-16 h-16 text-green-600" />,
      name: "Python",
      description: "Backend Processing"
    },
    {
      icon: <Brain className="w-16 h-16 text-purple-600" />,
      name: "OpenAI",
      description: "AI Analysis"
    },
    {
      icon: <FileSpreadsheet className="w-16 h-16 text-green-700" />,
      name: "Excel",
      description: "Data Output"
    }
  ];

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">
        Technology Stack
      </h2>
      <div className="flex flex-wrap justify-center items-center gap-8">
        {technologies.map((tech, index) => (
          <div key={index} className="flex flex-col items-center text-center">
            <div className="mb-2 p-3 bg-white rounded-lg shadow-sm">
              {tech.icon}
            </div>
            <h3 className="font-medium text-gray-800 text-sm">
              {tech.name}
            </h3>
            <p className="text-xs text-gray-500">
              {tech.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechStack;