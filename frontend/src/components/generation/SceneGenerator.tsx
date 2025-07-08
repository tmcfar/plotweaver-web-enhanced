/**
 * Scene generation component with DH cost tracking
 */

import React, { useState } from 'react';
import { useSceneGeneration } from '../../hooks/useSceneGeneration';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, DollarSign, Zap, FileText } from 'lucide-react';

export interface SceneGeneratorProps {
  projectId: string;
  projectName?: string;
  characters?: Record<string, any>;
  plotOutline?: Record<string, any>;
}

export const SceneGenerator: React.FC<SceneGeneratorProps> = ({
  projectId,
  projectName = 'Untitled Project',
  characters = {},
  plotOutline = {},
}) => {
  const {
    isGenerating,
    progress,
    result,
    error,
    dhSavings,
    estimatedCost,
    generateScene,
    generateChapter,
    reset,
  } = useSceneGeneration(projectId);

  const [chapter, setChapter] = useState(1);
  const [scene, setScene] = useState(1);
  const [generateMode, setGenerateMode] = useState<'scene' | 'chapter'>('scene');

  const handleGenerateScene = async () => {
    await generateScene(chapter, scene, {
      project_name: projectName,
      characters,
      plot_outline: plotOutline,
    });
  };

  const handleGenerateChapter = async () => {
    await generateChapter(chapter, 3, {
      project_name: projectName,
      characters,
      plot_outline: plotOutline,
    });
  };

  const getProgressMessage = () => {
    if (!progress) return 'Initializing...';
    
    switch (progress.stage) {
      case 'dh_prefiltering':
        return 'Running Digital Humanities pre-filtering...';
      case 'generating':
        return 'Generating content with AI...';
      case 'quality_check':
        return 'Running quality checks...';
      default:
        return progress.message;
    }
  };

  return (
    <div className="space-y-4">
      {/* Cost Tracking Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-2xl font-bold">${estimatedCost.toFixed(3)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">DH Savings</p>
              <p className="text-2xl font-bold text-green-600">
                ${dhSavings.toFixed(3)}
              </p>
              {dhSavings > 0 && (
                <p className="text-xs text-green-600">
                  {((dhSavings / (estimatedCost + dhSavings)) * 100).toFixed(0)}% saved
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Scene Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={generateMode === 'scene' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGenerateMode('scene')}
            >
              Single Scene
            </Button>
            <Button
              variant={generateMode === 'chapter' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGenerateMode('chapter')}
            >
              Full Chapter
            </Button>
          </div>

          {/* Input Controls */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium">Chapter</label>
              <input
                type="number"
                min="1"
                value={chapter}
                onChange={(e) => setChapter(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isGenerating}
              />
            </div>
            {generateMode === 'scene' && (
              <div className="flex-1">
                <label className="text-sm font-medium">Scene</label>
                <input
                  type="number"
                  min="1"
                  value={scene}
                  onChange={(e) => setScene(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={isGenerating}
                />
              </div>
            )}
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateMode === 'scene' ? handleGenerateScene : handleGenerateChapter}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate {generateMode === 'scene' ? 'Scene' : 'Chapter'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Progress Display */}
      {isGenerating && progress && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">{getProgressMessage()}</p>
              {progress.stage === 'dh_prefiltering' && (
                <p className="text-sm text-muted-foreground">
                  Analyzing narrative patterns to reduce AI costs...
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Result Display */}
      {result && result.success && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Content</span>
              {result.metadata && (
                <span className="text-sm font-normal text-muted-foreground">
                  {result.metadata.word_count} words
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{result.content}</p>
            </div>
            {result.metadata?.dh_enabled && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <p className="text-sm text-green-700 dark:text-green-300">
                  💰 DH pre-filtering saved ${result.dh_savings?.toFixed(3)} on this scene
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SceneGenerator;
