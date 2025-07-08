import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Clock, Save, SkipForward } from 'lucide-react';

interface SetupStep {
  id: string;
  type: string;
  title: string;
  required: boolean;
  estimated_minutes: number;
}

interface SetupStepFormProps {
  step: SetupStep;
  onComplete: (data: any) => void;
  onSkip: () => void;
}

export function SetupStepForm({ step, onComplete, onSkip }: SetupStepFormProps) {
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await onComplete(formData);
    } catch (err: any) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  const renderFormFields = () => {
    switch (step.type) {
      case 'character_creation':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Character Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter character name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role in Story</Label>
              <Input
                id="role"
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., Protagonist, Antagonist, Mentor"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Character Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Physical appearance, personality traits, background..."
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="motivation">Primary Motivation</Label>
              <Input
                id="motivation"
                value={formData.motivation || ''}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                placeholder="What drives this character?"
              />
            </div>
          </>
        );

      case 'location_creation':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="location_name">Location Name</Label>
              <Input
                id="location_name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Chicago, The Forbidden Forest"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location_type">Location Type</Label>
              <select
                id="location_type"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={formData.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="">Select type...</option>
                <option value="city">City</option>
                <option value="building">Building</option>
                <option value="natural">Natural Setting</option>
                <option value="fictional">Fictional Place</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location_desc">Description</Label>
              <Textarea
                id="location_desc"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the atmosphere, key features, significance..."
                rows={4}
              />
            </div>
          </>
        );

      case 'mystery_elements':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="crime">The Crime/Mystery</Label>
              <Textarea
                id="crime"
                value={formData.crime || ''}
                onChange={(e) => setFormData({ ...formData, crime: e.target.value })}
                placeholder="What is the central mystery that needs to be solved?"
                rows={3}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="victim">Victim/Subject</Label>
              <Input
                id="victim"
                value={formData.victim || ''}
                onChange={(e) => setFormData({ ...formData, victim: e.target.value })}
                placeholder="Who or what is at the center of the mystery?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clues">Key Clues (one per line)</Label>
              <Textarea
                id="clues"
                value={formData.clues || ''}
                onChange={(e) => setFormData({ ...formData, clues: e.target.value })}
                placeholder="Important clues that will be discovered..."
                rows={4}
              />
            </div>
          </>
        );

      case 'worldbuilding':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="world_name">World Name</Label>
              <Input
                id="world_name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Name of your world or setting"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="magic_system">Magic/Technology System</Label>
              <Textarea
                id="magic_system"
                value={formData.magic_system || ''}
                onChange={(e) => setFormData({ ...formData, magic_system: e.target.value })}
                placeholder="How does magic or advanced technology work in your world?"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unique_elements">Unique Elements</Label>
              <Textarea
                id="unique_elements"
                value={formData.unique_elements || ''}
                onChange={(e) => setFormData({ ...formData, unique_elements: e.target.value })}
                placeholder="What makes your world different or special?"
                rows={3}
              />
            </div>
          </>
        );

      case 'timeline_creation':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="timeline">Story Timeline</Label>
              <Textarea
                id="timeline"
                value={formData.timeline || ''}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                placeholder="Key events in chronological order..."
                rows={6}
              />
              <p className="text-sm text-gray-500">
                List major events, one per line. For example:
                <br />- Day 1: Murder discovered
                <br />- Day 2: Detective arrives
                <br />- Day 5: First suspect questioned
              </p>
            </div>
          </>
        );

      case 'theme_exploration':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="themes">Main Themes</Label>
              <Textarea
                id="themes"
                value={formData.themes || ''}
                onChange={(e) => setFormData({ ...formData, themes: e.target.value })}
                placeholder="What themes will your story explore? (one per line)"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Core Message</Label>
              <Textarea
                id="message"
                value={formData.message || ''}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="What do you want readers to take away from your story?"
                rows={3}
              />
            </div>
          </>
        );

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any relevant information..."
              rows={4}
            />
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{step.title}</CardTitle>
            <CardDescription>
              {step.required ? 'Required step' : 'Optional step - you can skip if needed'}
            </CardDescription>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="mr-1 h-4 w-4" />
            ~{step.estimated_minutes} min
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save & Continue
                </>
              )}
            </Button>
            
            {!step.required && (
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                disabled={isSaving}
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Skip
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
