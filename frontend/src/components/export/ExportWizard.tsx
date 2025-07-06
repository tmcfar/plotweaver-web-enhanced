'use client'

import React, { useState } from 'react'
import { 
  Download, 
  FileText, 
  Book, 
  Image, 
  Settings, 
  Eye,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Share,
  Globe,
  Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface ExportFormat {
  id: string
  name: string
  extension: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: 'document' | 'ebook' | 'web' | 'print'
  features: string[]
  fileSize?: string
  premium?: boolean
}

export interface ExportOptions {
  format: ExportFormat
  includeMetadata: boolean
  includeComments: boolean
  includeChanges: boolean
  chapters?: string[]
  customCover?: boolean
  tableOfContents?: boolean
  styling?: {
    fontSize: number
    fontFamily: string
    lineSpacing: number
    margins: number
  }
}

interface ExportWizardProps {
  isOpen: boolean
  onClose: () => void
  projectTitle: string
  availableChapters: { id: string; title: string; wordCount: number }[]
  onExport: (options: ExportOptions) => Promise<void>
}

const exportFormats: ExportFormat[] = [
  {
    id: 'pdf',
    name: 'PDF Document',
    extension: 'pdf',
    description: 'Professional document format for printing and sharing',
    icon: FileText,
    category: 'document',
    features: ['Preserves formatting', 'Print-ready', 'Universal compatibility'],
    fileSize: '~2-5MB'
  },
  {
    id: 'docx',
    name: 'Microsoft Word',
    extension: 'docx',
    description: 'Editable document format for Microsoft Word',
    icon: FileText,
    category: 'document',
    features: ['Fully editable', 'Track changes', 'Comments preserved'],
    fileSize: '~1-3MB'
  },
  {
    id: 'epub',
    name: 'EPUB E-book',
    extension: 'epub',
    description: 'Standard e-book format for digital readers',
    icon: Book,
    category: 'ebook',
    features: ['Responsive text', 'Table of contents', 'Metadata support'],
    fileSize: '~500KB-2MB'
  },
  {
    id: 'mobi',
    name: 'Kindle (MOBI)',
    extension: 'mobi',
    description: 'Amazon Kindle compatible e-book format',
    icon: Book,
    category: 'ebook',
    features: ['Kindle compatible', 'Built-in navigation', 'Optimized text'],
    fileSize: '~500KB-2MB',
    premium: true
  },
  {
    id: 'html',
    name: 'Web Page',
    extension: 'html',
    description: 'Standalone web page with embedded styles',
    icon: Globe,
    category: 'web',
    features: ['Web compatible', 'Responsive design', 'Easy sharing'],
    fileSize: '~100KB-1MB'
  },
  {
    id: 'markdown',
    name: 'Markdown',
    extension: 'md',
    description: 'Plain text format with simple markup',
    icon: FileText,
    category: 'document',
    features: ['Platform independent', 'Version control friendly', 'Lightweight'],
    fileSize: '~50-200KB'
  }
]

const steps = [
  { id: 'format', title: 'Choose Format', description: 'Select your export format' },
  { id: 'content', title: 'Select Content', description: 'Choose what to include' },
  { id: 'styling', title: 'Customize Style', description: 'Adjust formatting options' },
  { id: 'preview', title: 'Preview & Export', description: 'Review and download' }
]

export function ExportWizard({ 
  isOpen, 
  onClose, 
  projectTitle, 
  availableChapters,
  onExport 
}: ExportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null)
  const [selectedChapters, setSelectedChapters] = useState<string[]>(
    availableChapters.map(c => c.id)
  )
  const [exportOptions, setExportOptions] = useState<Partial<ExportOptions>>({
    includeMetadata: true,
    includeComments: false,
    includeChanges: false,
    customCover: true,
    tableOfContents: true,
    styling: {
      fontSize: 12,
      fontFamily: 'Georgia',
      lineSpacing: 1.5,
      margins: 1
    }
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleExport = async () => {
    if (!selectedFormat) return
    
    setIsExporting(true)
    setExportProgress(0)
    
    try {
      const fullOptions: ExportOptions = {
        format: selectedFormat,
        chapters: selectedChapters,
        ...exportOptions
      } as ExportOptions

      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 300)

      await onExport(fullOptions)
      
      clearInterval(progressInterval)
      setExportProgress(100)
      
      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
        onClose()
      }, 1000)
    } catch (error) {
      setIsExporting(false)
      setExportProgress(0)
      console.error('Export failed:', error)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedFormat !== null
      case 1: return selectedChapters.length > 0
      case 2: return true
      case 3: return true
      default: return false
    }
  }

  const getTotalWordCount = () => {
    return availableChapters
      .filter(chapter => selectedChapters.includes(chapter.id))
      .reduce((total, chapter) => total + chapter.wordCount, 0)
  }

  const getEstimatedPages = () => {
    const wordCount = getTotalWordCount()
    return Math.ceil(wordCount / 250) // ~250 words per page
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export "{projectTitle}"
          </DialogTitle>
          <DialogDescription>
            Export your project in your preferred format with custom styling options
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                index <= currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              )}>
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  'w-16 h-0.5 mx-2',
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          {currentStep === 0 && (
            <FormatSelection 
              formats={exportFormats}
              selectedFormat={selectedFormat}
              onSelectFormat={setSelectedFormat}
            />
          )}
          
          {currentStep === 1 && (
            <ContentSelection
              chapters={availableChapters}
              selectedChapters={selectedChapters}
              onSelectChapters={setSelectedChapters}
              exportOptions={exportOptions}
              onUpdateOptions={setExportOptions}
            />
          )}
          
          {currentStep === 2 && selectedFormat && (
            <StylingOptions
              format={selectedFormat}
              options={exportOptions}
              onUpdateOptions={setExportOptions}
            />
          )}
          
          {currentStep === 3 && selectedFormat && (
            <PreviewAndExport
              format={selectedFormat}
              options={exportOptions}
              projectTitle={projectTitle}
              totalWords={getTotalWordCount()}
              estimatedPages={getEstimatedPages()}
              isExporting={isExporting}
              exportProgress={exportProgress}
              onExport={handleExport}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 0 || isExporting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button 
                onClick={handleNext}
                disabled={!canProceed() || isExporting}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleExport}
                disabled={!canProceed() || isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step Components
interface FormatSelectionProps {
  formats: ExportFormat[]
  selectedFormat: ExportFormat | null
  onSelectFormat: (format: ExportFormat) => void
}

function FormatSelection({ formats, selectedFormat, onSelectFormat }: FormatSelectionProps) {
  const groupedFormats = formats.reduce((acc, format) => {
    if (!acc[format.category]) {
      acc[format.category] = []
    }
    acc[format.category].push(format)
    return acc
  }, {} as Record<string, ExportFormat[]>)

  const categoryLabels = {
    document: 'Documents',
    ebook: 'E-books', 
    web: 'Web',
    print: 'Print'
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Export Format</h3>
        <p className="text-muted-foreground">
          Select the format that best suits your needs
        </p>
      </div>

      {Object.entries(groupedFormats).map(([category, categoryFormats]) => (
        <div key={category}>
          <h4 className="font-medium mb-3">
            {categoryLabels[category as keyof typeof categoryLabels]}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categoryFormats.map(format => {
              const Icon = format.icon
              const isSelected = selectedFormat?.id === format.id
              
              return (
                <Card 
                  key={format.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    isSelected && 'ring-2 ring-primary border-primary'
                  )}
                  onClick={() => onSelectFormat(format)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{format.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              .{format.extension}
                            </Badge>
                            {format.premium && (
                              <Badge variant="default" className="text-xs">
                                Pro
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <CardDescription className="mb-3">
                      {format.description}
                    </CardDescription>
                    
                    <div className="space-y-2">
                      {format.features.map(feature => (
                        <div key={feature} className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    
                    {format.fileSize && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Estimated size: {format.fileSize}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

interface ContentSelectionProps {
  chapters: { id: string; title: string; wordCount: number }[]
  selectedChapters: string[]
  onSelectChapters: (chapters: string[]) => void
  exportOptions: Partial<ExportOptions>
  onUpdateOptions: (options: Partial<ExportOptions>) => void
}

function ContentSelection({ 
  chapters, 
  selectedChapters, 
  onSelectChapters, 
  exportOptions, 
  onUpdateOptions 
}: ContentSelectionProps) {
  const toggleChapter = (chapterId: string) => {
    if (selectedChapters.includes(chapterId)) {
      onSelectChapters(selectedChapters.filter(id => id !== chapterId))
    } else {
      onSelectChapters([...selectedChapters, chapterId])
    }
  }

  const selectAll = () => {
    onSelectChapters(chapters.map(c => c.id))
  }

  const selectNone = () => {
    onSelectChapters([])
  }

  const getTotalWordCount = () => {
    return chapters
      .filter(chapter => selectedChapters.includes(chapter.id))
      .reduce((total, chapter) => total + chapter.wordCount, 0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Content</h3>
        <p className="text-muted-foreground">
          Choose which chapters and additional content to include
        </p>
      </div>

      {/* Chapter Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Chapters ({selectedChapters.length} of {chapters.length})</h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={selectNone}>
              Select None
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {chapters.map(chapter => (
            <div
              key={chapter.id}
              className={cn(
                'flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors',
                selectedChapters.includes(chapter.id) 
                  ? 'border-primary bg-primary/5' 
                  : 'hover:bg-muted/50'
              )}
              onClick={() => toggleChapter(chapter.id)}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-4 h-4 border-2 rounded',
                  selectedChapters.includes(chapter.id) 
                    ? 'bg-primary border-primary' 
                    : 'border-muted-foreground'
                )}>
                  {selectedChapters.includes(chapter.id) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <span className="font-medium">{chapter.title}</span>
              </div>
              <Badge variant="outline">
                {chapter.wordCount.toLocaleString()} words
              </Badge>
            </div>
          ))}
        </div>

        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium">
            Total: {getTotalWordCount().toLocaleString()} words
          </div>
          <div className="text-xs text-muted-foreground">
            Estimated {Math.ceil(getTotalWordCount() / 250)} pages
          </div>
        </div>
      </div>

      {/* Additional Options */}
      <div>
        <h4 className="font-medium mb-3">Additional Content</h4>
        <div className="space-y-3">
          {[
            { key: 'includeMetadata', label: 'Include metadata (title, author, date)' },
            { key: 'includeComments', label: 'Include comments and annotations' },
            { key: 'includeChanges', label: 'Include change tracking information' },
            { key: 'tableOfContents', label: 'Generate table of contents' },
            { key: 'customCover', label: 'Include custom cover page' }
          ].map(option => (
            <label key={option.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                onChange={(e) => onUpdateOptions({
                  ...exportOptions,
                  [option.key]: e.target.checked
                })}
                className="w-4 h-4"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

interface StylingOptionsProps {
  format: ExportFormat
  options: Partial<ExportOptions>
  onUpdateOptions: (options: Partial<ExportOptions>) => void
}

function StylingOptions({ format, options, onUpdateOptions }: StylingOptionsProps) {
  const updateStyling = (key: string, value: any) => {
    onUpdateOptions({
      ...options,
      styling: {
        ...options.styling,
        [key]: value
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Customize Styling</h3>
        <p className="text-muted-foreground">
          Adjust the appearance and formatting for {format.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Font Family</label>
          <select
            value={options.styling?.fontFamily || 'Georgia'}
            onChange={(e) => updateStyling('fontFamily', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="Georgia">Georgia (Serif)</option>
            <option value="Times New Roman">Times New Roman (Serif)</option>
            <option value="Arial">Arial (Sans-serif)</option>
            <option value="Helvetica">Helvetica (Sans-serif)</option>
            <option value="Courier New">Courier New (Monospace)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Font Size</label>
          <select
            value={options.styling?.fontSize || 12}
            onChange={(e) => updateStyling('fontSize', parseInt(e.target.value))}
            className="w-full p-2 border rounded-md"
          >
            <option value={10}>10pt</option>
            <option value={11}>11pt</option>
            <option value={12}>12pt</option>
            <option value={14}>14pt</option>
            <option value={16}>16pt</option>
            <option value={18}>18pt</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Line Spacing</label>
          <select
            value={options.styling?.lineSpacing || 1.5}
            onChange={(e) => updateStyling('lineSpacing', parseFloat(e.target.value))}
            className="w-full p-2 border rounded-md"
          >
            <option value={1}>Single</option>
            <option value={1.15}>1.15</option>
            <option value={1.5}>1.5</option>
            <option value={2}>Double</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Margins</label>
          <select
            value={options.styling?.margins || 1}
            onChange={(e) => updateStyling('margins', parseFloat(e.target.value))}
            className="w-full p-2 border rounded-md"
          >
            <option value={0.5}>Narrow (0.5")</option>
            <option value={1}>Normal (1")</option>
            <option value={1.25}>Moderate (1.25")</option>
            <option value={1.5}>Wide (1.5")</option>
          </select>
        </div>
      </div>

      {/* Format-specific options */}
      {format.category === 'ebook' && (
        <div>
          <h4 className="font-medium mb-3">E-book Options</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-sm">Include navigation menu</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-sm">Optimize for mobile reading</span>
            </label>
          </div>
        </div>
      )}

      {/* Preview */}
      <div>
        <h4 className="font-medium mb-3">Preview</h4>
        <div 
          className="border rounded-lg p-4 bg-white"
          style={{
            fontFamily: options.styling?.fontFamily || 'Georgia',
            fontSize: `${(options.styling?.fontSize || 12) * 1.2}px`,
            lineHeight: options.styling?.lineSpacing || 1.5
          }}
        >
          <h5 className="font-bold mb-2">Chapter 1: The Beginning</h5>
          <p className="mb-2">
            The morning sun cast long shadows across the cobblestone streets of Elderbrook, 
            painting the old Victorian houses in shades of gold and amber. Sarah pulled her 
            coat tighter against the crisp autumn air as she walked toward the imposing 
            structure that had been her grandmother's home for over sixty years.
          </p>
          <p>
            She had inherited more than just a house—she had inherited a mystery that 
            would change everything she thought she knew about her family.
          </p>
        </div>
      </div>
    </div>
  )
}

interface PreviewAndExportProps {
  format: ExportFormat
  options: Partial<ExportOptions>
  projectTitle: string
  totalWords: number
  estimatedPages: number
  isExporting: boolean
  exportProgress: number
  onExport: () => void
}

function PreviewAndExport({ 
  format, 
  options, 
  projectTitle, 
  totalWords, 
  estimatedPages,
  isExporting,
  exportProgress,
  onExport 
}: PreviewAndExportProps) {
  const Icon = format.icon

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review & Export</h3>
        <p className="text-muted-foreground">
          Review your settings and export your project
        </p>
      </div>

      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Export Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Format</label>
              <div className="font-medium">{format.name}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">File Extension</label>
              <div className="font-medium">.{format.extension}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total Words</label>
              <div className="font-medium">{totalWords.toLocaleString()}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estimated Pages</label>
              <div className="font-medium">{estimatedPages}</div>
            </div>
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium text-muted-foreground">Styling</label>
            <div className="text-sm mt-1">
              {options.styling?.fontFamily} • {options.styling?.fontSize}pt • 
              {options.styling?.lineSpacing} line spacing • {options.styling?.margins}" margins
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Included Content</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {options.includeMetadata && <Badge variant="outline">Metadata</Badge>}
              {options.includeComments && <Badge variant="outline">Comments</Badge>}
              {options.includeChanges && <Badge variant="outline">Changes</Badge>}
              {options.tableOfContents && <Badge variant="outline">Table of Contents</Badge>}
              {options.customCover && <Badge variant="outline">Custom Cover</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Progress */}
      {isExporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Preparing export...</span>
                <span className="text-sm text-muted-foreground">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
              <div className="text-xs text-muted-foreground">
                This may take a few moments depending on your project size
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!isExporting && (
        <div className="flex gap-2">
          <Button onClick={onExport} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Export {format.name}
          </Button>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Share Link
          </Button>
        </div>
      )}
    </div>
  )
}