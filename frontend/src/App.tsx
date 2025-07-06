import { useState, useEffect } from 'react';
import './App.css';
import { useWebSocket } from './hooks/useWebSocket';
import { usePreviewCapture } from './hooks/usePreviewCapture';
import { ModeSetCard } from './components/mode-sets/ModeSetCard';
import { useGlobalStore } from './lib/store';
import { modeSetAPI, type ModeSetId } from './lib/api/modeSets';
import { Layout } from './components/layout/Layout';

function App() {
  const { modeSet, setModeSet } = useGlobalStore();
  const [content, setContent] = useState('Welcome to PlotWeaver');

  const handleModeSetSelection = async (modeSetId: ModeSetId) => {
    await modeSetAPI.setUserModeSet(modeSetId);
    setModeSet(modeSetId);
  };
  const { isConnected, lastMessage, sendMessage } = useWebSocket('ws://localhost:8000/ws')
  const { capturePreview } = usePreviewCapture()

  useEffect(() => {
    const interval = setInterval(() => {
      capturePreview('preview-content')
    }, 5000) // Capture every 5 seconds

    return () => clearInterval(interval)
  }, [capturePreview])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    sendMessage(`content-update: ${e.target.value}`)
  }

  return (
    <div className="app">
      {!modeSet ? (
        <div className="h-screen flex items-center justify-center">
          <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-center mb-8">
              How do you want to write today?
            </h1>

            <div className="grid grid-cols-2 gap-6">
              <ModeSetCard
                id="professional-writer"
                title="Professional Writer"
                description="Full control with AI assist"
                features={['Manual control', 'Advanced features', 'Git operations']}
                onSelect={handleModeSetSelection}
              />

              <ModeSetCard
                id="ai-first"
                title="AI-Powered Creation"
                description="Let AI lead the way"
                features={['Auto-generation', 'Simplified UI', 'Quick results']}
                onSelect={handleModeSetSelection}
              />

              <ModeSetCard
                id="editor"
                title="Editor/Reviewer"
                description="Analyze and annotate"
                features={['Read-only', 'Comments', 'Reports']}
                onSelect={handleModeSetSelection}
              />

              <ModeSetCard
                id="hobbyist"
                title="Creative Explorer"
                description="Fun, casual writing"
                features={['Gamification', 'Templates', 'Community']}
                onSelect={handleModeSetSelection}
              />
            </div>
          </div>
        </div>
      ) : (
        <Layout>
          <div className="w-full h-full p-4">
            <header className="mb-4">
              <h1>PlotWeaver Web</h1>
              <div className="status">
                WebSocket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
            </header>

            <main>
              <div className="editor-panel">
                <h2>Editor</h2>
                <textarea
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Enter your content here..."
                  rows={10}
                />
              </div>

              <div className="preview-panel">
                <h2>Live Preview</h2>
                <div id="preview-content" className="preview-content">
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
              </div>
            </main>

            {lastMessage && (
              <div className="message">Last message: {lastMessage}</div>
            )}
          </div>
        </Layout>
      )}
    </div>
  );
}

export default App