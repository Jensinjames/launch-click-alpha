import React, { useState, useEffect } from 'react';

const MarketingFunnelTerminal = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    { text: 'Analyzing your business model...', delay: 1000 },
    { text: 'Creating email sequences (5 emails)...', delay: 1500 },
    { text: 'Writing Facebook & Google ads...', delay: 1800 },
    { text: 'Building landing page copy...', delay: 1200 },
    { text: 'Complete funnel generated in 8 seconds', delay: 800, isComplete: true }
  ];

  const typeText = (text: string, callback: () => void) => {
    setIsTyping(true);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
        setTimeout(callback, 500);
      }
    }, 30);
  };

  useEffect(() => {
    if (currentStep < steps.length) {
      const step = steps[currentStep];
      
      setTimeout(() => {
        typeText(step.text, () => {
          if (step.isComplete) {
            setIsComplete(true);
          }
          setTimeout(() => {
            setCurrentStep(prev => prev + 1);
            setDisplayText('');
          }, step.delay);
        });
      }, currentStep === 0 ? 1000 : 0);
    } else {
      // Reset animation after completion
      setTimeout(() => {
        setCurrentStep(0);
        setDisplayText('');
        setIsComplete(false);
        setIsTyping(false);
      }, 3000);
    }
  }, [currentStep]);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-800">
      {/* Terminal Header */}
      <div className="flex items-center px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-6 font-mono text-sm">
        {/* Command Line */}
        <div className="flex items-center mb-4">
          <span className="text-green-400 mr-2">$</span>
          <span className="text-green-300">Generate complete marketing funnel for SaaS startup</span>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <span className="text-blue-400 mr-2">
                {index < currentStep ? '✓' : 
                 index === currentStep ? '→' : '→'}
              </span>
              <span className={`${
                index < currentStep ? 'text-gray-400' : 
                index === currentStep ? (step.isComplete ? 'text-green-400' : 'text-white') : 
                'text-gray-600'
              }`}>
                {index < currentStep ? step.text :
                 index === currentStep ? displayText : step.text}
                {index === currentStep && isTyping && (
                  <span className="animate-pulse">|</span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Completion Message */}
        {isComplete && (
          <div className="mt-4 flex items-center animate-pulse">
            <span className="text-green-400 mr-2">✓</span>
            <span className="text-green-400 font-semibold">
              Complete funnel generated in 8 seconds
            </span>
          </div>
        )}

        {/* Cursor */}
        {!isComplete && currentStep >= steps.length && (
          <div className="mt-2">
            <span className="text-green-400 mr-2">$</span>
            <span className="animate-pulse">|</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingFunnelTerminal;