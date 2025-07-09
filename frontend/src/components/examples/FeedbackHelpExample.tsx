import React, { useState } from 'react';
import { RefreshCw, Save, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { 
  MicroFeedback, 
  FrictionDetector, 
  SessionFeedback 
} from '@/components/feedback';
import { 
  HelpTooltip, 
  HelpSearch, 
  InlineGuide 
} from '@/components/help';
import { useTracking } from '@/hooks/useTracking';
import { useAgentTracking } from '@/hooks/useAgentTracking';

interface FeedbackHelpExampleProps {
  contentId: string;
  contentType?: string;
}

export function FeedbackHelpExample({ 
  contentId, 
  contentType = 'scene' 
}: FeedbackHelpExampleProps) {
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [showSessionFeedback, setShowSessionFeedback] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { trackEvent } = useTracking('FeedbackHelpExample');
  const { trackGeneration } = useAgentTracking('scene_generator');

  const handleRegenerate = async () => {
    setIsGenerating(true);
    
    try {
      const result = await trackGeneration('scene_regeneration', async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        return `Regenerated content #${regenerationCount + 1}`;
      }, { 
        contentId, 
        regenerationCount: regenerationCount + 1 
      });
      
      setGeneratedContent(result);
      setRegenerationCount(prev => prev + 1);
      toast.success('Content regenerated successfully!');
    } catch (error) {
      toast.error('Failed to regenerate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    trackEvent('content_saved', { contentId, contentType });
    toast.success('Content saved!');
    
    // Trigger session feedback after save
    if (Math.random() > 0.7) {
      setShowSessionFeedback(true);
    }
  };

  const handleExport = () => {
    trackEvent('content_exported', { contentId, contentType });
    toast.success('Content exported!');
    
    // Trigger session feedback after export
    setShowSessionFeedback(true);
  };

  const handleFeedback = (rating: number) => {
    trackEvent('content_feedback_received', {
      contentId,
      contentType,
      rating,
      regenerationCount
    });
  };

  const handleFrictionReport = (reported: boolean) => {
    trackEvent('friction_report_completed', {
      contentId,
      contentType,
      reported,
      regenerationCount
    });
  };

  const handleHelpSearchResult = (helpId: string) => {
    trackEvent('help_search_result_used', {
      helpId,
      context: 'example_component'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Content Generation Example
          </h2>
          
          <HelpTooltip helpId="content-generation-basics">
            <span className="text-sm text-gray-500">
              Need help with generation?
            </span>
          </HelpTooltip>
        </div>

        <div className="mb-6">
          <HelpSearch 
            onResultClick={handleHelpSearchResult}
            placeholder="Search for help with content generation..."
            className="mb-4"
          />
          
          <InlineGuide 
            helpId="getting-started-with-generation"
            title="Getting Started with Content Generation"
            className="mb-4"
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4 min-h-[200px]">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
              Generating content...
            </div>
          ) : generatedContent ? (
            <div className="space-y-4">
              <p className="text-gray-700">{generatedContent}</p>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    Regenerations: {regenerationCount}
                  </span>
                  
                  <MicroFeedback
                    contentType={contentType}
                    contentId={contentId}
                    onFeedback={handleFeedback}
                    context={{
                      regenerationCount,
                      generatedAt: new Date().toISOString()
                    }}
                  />
                </div>
                
                <HelpTooltip helpId="content-feedback" side="left">
                  <span className="text-xs text-gray-400">
                    Rate this content
                  </span>
                </HelpTooltip>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Click "Generate" to create content
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>

          <div className="flex items-center gap-2">
            <HelpTooltip helpId="saving-content">
              <button
                onClick={handleSave}
                disabled={!generatedContent}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </HelpTooltip>

            <HelpTooltip helpId="exporting-content">
              <button
                onClick={handleExport}
                disabled={!generatedContent}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Upload className="w-4 h-4" />
                Export
              </button>
            </HelpTooltip>
          </div>
        </div>
      </div>

      {/* Friction Detector */}
      <FrictionDetector
        contentType={contentType}
        contentId={contentId}
        regenerationCount={regenerationCount}
        onReport={handleFrictionReport}
        threshold={3}
      />

      {/* Session Feedback Modal */}
      <SessionFeedback
        isOpen={showSessionFeedback}
        onClose={() => setShowSessionFeedback(false)}
        trigger="manual"
        onComplete={(submitted) => {
          trackEvent('session_feedback_completed', {
            submitted,
            contentId,
            contentType
          });
        }}
      />
    </div>
  );
}

export default FeedbackHelpExample;