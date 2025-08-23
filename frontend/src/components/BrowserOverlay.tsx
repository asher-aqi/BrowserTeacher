"use client";

import { useState, useEffect } from "react";

interface OverlayGuide {
  id: string;
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage width
  height: number; // percentage height
  title: string;
  description: string;
  step: number;
}

interface BrowserOverlayProps {
  className?: string;
}

export default function BrowserOverlay({ className = "absolute inset-0 pointer-events-none" }: BrowserOverlayProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showAllOverlays, setShowAllOverlays] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Hardcoded overlay guides for demonstration
  const overlayGuides: OverlayGuide[] = [
    {
      id: "search-box",
      x: 35, // 35% from left
      y: 8, // 8% from top
      width: 30, // 30% width
      height: 6, // 6% height
      title: "Search Box",
      description: "Click here to start searching for what you need",
      step: 1,
    },
    {
      id: "navigation-menu",
      x: 15, // 15% from left
      y: 25, // 25% from top
      width: 20, // 20% width
      height: 4, // 4% height
      title: "Navigation Menu",
      description: "Browse different sections of the site",
      step: 2,
    },
    {
      id: "main-content",
      x: 20, // 20% from left
      y: 35, // 35% from top
      width: 60, // 60% width
      height: 40, // 40% height
      title: "Main Content Area",
      description: "This is where the main information is displayed",
      step: 3,
    },
    {
      id: "sidebar",
      x: 85, // 85% from left
      y: 35, // 35% from top
      width: 12, // 12% width
      height: 50, // 50% height
      title: "Sidebar",
      description: "Additional tools and information",
      step: 4,
    },
    {
      id: "footer-links",
      x: 20, // 20% from left
      y: 85, // 85% from top
      width: 60, // 60% width
      height: 10, // 10% height
      title: "Footer Links",
      description: "Important links and contact information",
      step: 5,
    },
  ];

  const handleOverlayClick = (guide: OverlayGuide) => {
    console.log(`Clicked on ${guide.title} - Step ${guide.step}`);
    // Advance to next step
    if (guide.step === currentStep) {
      // Mark current step as completed
      setCompletedSteps(prev => new Set([...prev, guide.step]));
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Add useEffect to handle fade out timing
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    completedSteps.forEach(stepNumber => {
      const timer = setTimeout(() => {
        setCompletedSteps(prev => {
          const newSet = new Set(prev);
          newSet.delete(stepNumber);
          return newSet;
        });
      }, 2000); // Fade out after 2 seconds
      
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [completedSteps]);

  const visibleGuides = showAllOverlays
    ? overlayGuides.filter(guide => 
        guide.step >= currentStep || // Show current and future steps
        completedSteps.has(guide.step) // Show recently completed steps (will fade out)
      )
    : overlayGuides.filter((guide) => 
        guide.step === currentStep || // Show current step
        completedSteps.has(guide.step) // Show recently completed steps (will fade out)
      );

  return (
    <div className={className}>
      {/* Control Panel */}
      <div className="absolute top-2 right-2 z-20 flex gap-2">
        <button
          onClick={() => setShowAllOverlays(!showAllOverlays)}
          className="px-3 py-1 bg-white/90 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          {showAllOverlays ? "Show Current Step" : "Show All Steps"}
        </button>
        <button
          onClick={() => {
            setCurrentStep(1);
            setCompletedSteps(new Set());
          }}
          className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 shadow-sm"
        >
          Reset
        </button>
      </div>

      {/* Step Counter */}
      <div className="absolute top-2 left-2 z-20 bg-white/90 border border-gray-300 rounded-md px-3 py-1 shadow-sm">
        <span className="text-xs font-medium text-gray-700">
          Step {currentStep} of {overlayGuides.length}
        </span>
      </div>

      {/* Overlay Guides */}
      {visibleGuides.map((guide) => {
        const isCurrentStep = guide.step === currentStep;
        const isCompleted = guide.step < currentStep;
        const isRecentlyCompleted = completedSteps.has(guide.step);
        const isFadingOut = isRecentlyCompleted && !isCurrentStep;

        return (
          <div
            key={guide.id}
            className={`absolute group cursor-pointer z-10 transition-all pointer-events-auto ${
              isFadingOut 
                ? "opacity-0 scale-95" // Slow fade out
                : "duration-300 opacity-100 scale-100" // Normal state
            }`}
            style={{
              left: `${Math.max(0, Math.min(guide.x, 95))}%`,
              top: `${Math.max(0, Math.min(guide.y, 95))}%`,
              width: `${Math.min(guide.width, 100 - guide.x)}%`,
              height: `${Math.min(guide.height, 100 - guide.y)}%`,
              transitionDuration: isFadingOut ? '2000ms' : '300ms',
            }}
            onClick={() => handleOverlayClick(guide)}
          >
            {/* Highlight Box */}
            <div
              className={`absolute inset-0 rounded-lg border-2 transition-all ${
                isFadingOut
                  ? "bg-green-500/20 border-green-500" // Keep green while fading
                  : isRecentlyCompleted
                    ? "duration-300 bg-green-500/20 border-green-500" // Just completed
                    : isCompleted
                      ? "duration-300 bg-green-500/20 border-green-500" // Previously completed
                      : isCurrentStep
                        ? "duration-300 bg-blue-500/20 border-blue-500 animate-pulse group-hover:animate-none group-hover:bg-blue-500/30"
                        : "duration-300 bg-gray-400/10 border-gray-400"
              }`}
              style={{
                transitionDuration: isFadingOut ? '2000ms' : '300ms',
              }}
            >
              {/* Step Number */}
              <div
                className={`absolute -top-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isFadingOut
                    ? "bg-green-500 text-white" // Keep green while fading
                    : isRecentlyCompleted || isCompleted
                      ? "duration-300 bg-green-500 text-white"
                      : isCurrentStep
                        ? "duration-300 bg-blue-500 text-white"
                        : "duration-300 bg-gray-400 text-white"
                }`}
                style={{
                  transitionDuration: isFadingOut ? '2000ms' : '300ms',
                }}
              >
                {isRecentlyCompleted || isCompleted ? "✓" : guide.step}
              </div>
            </div>

            {/* Tooltip - Positioned to stay within bounds */}
            <div 
              className={`absolute mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                guide.y < 30 
                  ? "top-full mt-2" // Show below if near top
                  : "bottom-full" // Show above otherwise
              } ${
                guide.x < 30 
                  ? "left-0" // Align left if near left edge
                  : guide.x > 70 
                    ? "right-0" // Align right if near right edge
                    : "left-1/2 transform -translate-x-1/2" // Center otherwise
              }`}
            >
              <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg min-w-48 max-w-64">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-sm">{guide.title}</div>
                  {isCompleted && (
                    <span className="text-green-400 text-xs">✓ Completed</span>
                  )}
                  {isCurrentStep && (
                    <span className="text-blue-400 text-xs">← Current</span>
                  )}
                </div>
                <div className="text-xs text-gray-300">{guide.description}</div>
                {isCurrentStep && (
                  <div className="text-xs text-blue-300 mt-1 font-medium">
                    Click to continue
                  </div>
                )}
                {/* Arrow - Positioned based on tooltip location */}
                <div 
                  className={`absolute border-4 border-transparent ${
                    guide.y < 30 
                      ? "bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900" // Arrow up if tooltip is below
                      : "top-full left-1/2 transform -translate-x-1/2 border-t-gray-900" // Arrow down if tooltip is above
                  }`}
                ></div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Completion Message */}
      {currentStep > overlayGuides.length && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md text-center">
            <div className="text-4xl mb-4">🎉</div>
            <div className="text-xl font-semibold mb-2 text-gray-900">
              Tutorial Complete!
            </div>
            <div className="text-gray-600 mb-4">
              You've successfully learned about all the key areas of this
              interface.
            </div>
            <button
              onClick={() => {
                setCurrentStep(1);
                setCompletedSteps(new Set());
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}