import React, { useState, useEffect } from 'react';
import { ConceptSeedInput } from './ConceptSeedInput';
import { AssumptionReview } from './AssumptionReview';
import { SetupStepForm } from './SetupStepForm';
import { SetupProgress } from './SetupProgress';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { worldbuildingApi } from '@/services/worldbuildingApi';

interface SetupWizardProps {
  projectPath: string;
  onComplete: () => void;
}

export function SetupWizard({ projectPath, onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupPlan, setSetupPlan] = useState<any>(null);
  const [assumptions, setAssumptions] = useState<any[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing setup progress
  useEffect(() => {
    checkExistingProgress();
  }, [projectPath]);

  const checkExistingProgress = async () => {
    try {
      const data = await worldbuildingApi.getSetupProgress(projectPath);
      if (data.analysis) {
        setSetupPlan(data.analysis.setup_plan);
        setAssumptions(data.assumptions || data.analysis.setup_plan.assumptions);
        if (data.progress && data.progress.completed_steps > 0) {
          // Resume from where we left off
          setCurrentStep(2); // Skip to setup steps
          const completed = new Set<string>();
          Object.entries(data.progress.steps).forEach(([stepId, stepData]: [string, any]) => {
            if (stepData.completed) {
              completed.add(stepId);
            }
          });
          setCompletedSteps(completed);
        } else {
          setCurrentStep(1); // Show assumptions
        }
      }
    } catch (err) {
      console.error('Failed to check existing progress:', err);
    }
  };

  const handleConceptAnalysis = (analysis: any) => {
    setSetupPlan(analysis.setup_plan);
    setAssumptions(analysis.setup_plan.assumptions);
    setCurrentStep(1);
  };

  const handleAssumptionsConfirmed = (updatedAssumptions: any[]) => {
    setAssumptions(updatedAssumptions);
    setCurrentStep(2);
  };

  const handleStepComplete = async (stepId: string, stepData: any) => {
    try {
      await worldbuildingApi.completeSetupStep(stepId, {
        step_data: stepData,
        project_path: projectPath,
      });

      setCompletedSteps(prev => new Set(prev).add(stepId));
      
      // Move to next step or complete
      const remainingSteps = setupPlan.steps.filter(
        (step: any) => step.required && !completedSteps.has(step.id) && step.id !== stepId
      );
      
      if (remainingSteps.length === 0) {
        onComplete();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ConceptSeedInput
            onAnalysisComplete={handleConceptAnalysis}
            projectPath={projectPath}
          />
        );
      
      case 1:
        return (
          <AssumptionReview
            assumptions={assumptions}
            onConfirm={handleAssumptionsConfirmed}
            projectPath={projectPath}
          />
        );
      
      case 2:
        const currentSetupStep = setupPlan?.steps.find(
          (step: any) => !completedSteps.has(step.id)
        );
        
        if (!currentSetupStep) {
          // All steps complete
          return (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold">Setup Complete!</h2>
              <p className="text-gray-600">Your story world is ready. Let's start writing!</p>
              <Button onClick={onComplete}>
                Start Writing
              </Button>
            </div>
          );
        }
        
        return (
          <SetupStepForm
            step={currentSetupStep}
            onComplete={(data) => handleStepComplete(currentSetupStep.id, data)}
            onSkip={() => {
              setCompletedSteps(prev => new Set(prev).add(currentSetupStep.id));
            }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress indicator */}
      {setupPlan && (
        <SetupProgress
          setupPlan={setupPlan}
          completedSteps={completedSteps}
          currentStepIndex={currentStep}
        />
      )}

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0 || isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {currentStep < 2 && setupPlan && (
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(2)}
          >
            Skip to writing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
