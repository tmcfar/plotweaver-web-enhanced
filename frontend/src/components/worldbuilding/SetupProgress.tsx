import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Progress } from '../ui/progress';

interface SetupProgressProps {
  setupPlan: {
    path_type: string;
    estimated_minutes: number;
    steps: Array<{
      id: string;
      title: string;
      required: boolean;
      estimated_minutes: number;
    }>;
  };
  completedSteps: Set<string>;
  currentStepIndex: number;
}

export function SetupProgress({ setupPlan, completedSteps, currentStepIndex }: SetupProgressProps) {
  const totalSteps = setupPlan.steps.length;
  const completedCount = Array.from(completedSteps).length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  const getPathName = (pathType: string) => {
    switch (pathType) {
      case 'minimal':
        return 'Quick Start';
      case 'guided':
        return 'Guided Setup';
      case 'detailed':
        return 'Comprehensive Setup';
      default:
        return 'Setup';
    }
  };

  const completedMinutes = setupPlan.steps
    .filter(step => completedSteps.has(step.id))
    .reduce((sum, step) => sum + step.estimated_minutes, 0);

  const remainingMinutes = setupPlan.estimated_minutes - completedMinutes;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{getPathName(setupPlan.path_type)}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Step {Math.min(completedCount + 1, totalSteps)} of {totalSteps}
          </p>
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Clock className="mr-1 h-4 w-4" />
          {remainingMinutes > 0 ? `~${remainingMinutes} min remaining` : 'Almost done!'}
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={progressPercentage} className="h-2" />

      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {['Concept', 'Assumptions', 'Setup', 'Complete'].map((stage, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div
              key={stage}
              className="flex flex-col items-center"
            >
              <div className={`
                rounded-full p-2 mb-1
                ${isCompleted ? 'bg-green-100 text-green-600' : ''}
                ${isCurrent ? 'bg-blue-100 text-blue-600' : ''}
                ${!isCompleted && !isCurrent ? 'bg-gray-100 text-gray-400' : ''}
              `}>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <span className={`
                text-xs
                ${isCompleted ? 'text-green-600 font-medium' : ''}
                ${isCurrent ? 'text-blue-600 font-medium' : ''}
                ${!isCompleted && !isCurrent ? 'text-gray-400' : ''}
              `}>
                {stage}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step list (collapsible) */}
      <details className="border-t pt-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
          View all steps ({completedCount}/{totalSteps} completed)
        </summary>
        <div className="mt-3 space-y-2">
          {setupPlan.steps.map((step) => {
            const isCompleted = completedSteps.has(step.id);
            
            return (
              <div
                key={step.id}
                className={`
                  flex items-center justify-between text-sm p-2 rounded
                  ${isCompleted ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-900/20'}
                `}
              >
                <div className="flex items-center">
                  {isCompleted ? (
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="mr-2 h-4 w-4 text-gray-400" />
                  )}
                  <span className={isCompleted ? 'text-green-800 dark:text-green-200' : ''}>
                    {step.title}
                  </span>
                  {!step.required && (
                    <span className="ml-2 text-xs text-gray-500">(optional)</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {step.estimated_minutes} min
                </span>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
