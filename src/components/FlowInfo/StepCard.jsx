import React from 'react';

const StepCard = ({ icon, title, description }) => {
  return (
    <div className="bg-white shadow rounded-xl p-5 flex items-start space-x-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

export default StepCard;