import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Sparkles } from 'lucide-react';
import { worldbuildingApi } from '@/services/worldbuildingApi';

interface ConceptSeedInputProps {
  onAnalysisComplete: (analysis: any) => void;
  projectPath?: string;
}

export function ConceptSeedInput({ onAnalysisComplete, projectPath }: ConceptSeedInputProps) {
  const [conceptText, setConceptText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!conceptText.trim()) {
      setError('Please enter a story concept');
      return;
    }

    if (conceptText.trim().length < 20) {
      setError('Please provide more detail about your story concept (at least 20 characters)');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = await worldbuildingApi.analyzeConceptapi({
        concept_text: conceptText,
        project_path: projectPath || '',
        user_preferences: {
          time_investment: 'moderate' // This could be configurable
        }
      });
      
      if (analysis.success) {
        onAnalysisComplete(analysis);
      } else {
        throw new Error(analysis.error || 'Analysis failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing your concept');
      console.error('Concept analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Tell us about your story</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Describe your story concept in a few sentences. The more detail you provide, 
          the better we can tailor the setup process to your needs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Textarea
            value={conceptText}
            onChange={(e) => setConceptText(e.target.value)}
            placeholder="A detective story set in 1920s Chicago where a private investigator must solve a series of mysterious disappearances..."
            className="min-h-[150px] resize-none"
            disabled={isAnalyzing}
          />
          <p className="text-sm text-gray-500 mt-1">
            {conceptText.length} characters
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isAnalyzing || !conceptText.trim()}
            className="flex-1"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing your concept...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze & Create Setup Plan
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2">Tips for a great concept:</h3>
        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>• Include the genre (mystery, fantasy, romance, etc.)</li>
          <li>• Mention the setting (time period, location)</li>
          <li>• Describe your main character or conflict</li>
          <li>• Add any unique elements or themes</li>
        </ul>
      </div>
    </div>
  );
}
