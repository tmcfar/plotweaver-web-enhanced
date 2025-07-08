import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, AlertCircle, Edit2, Save, X } from 'lucide-react';
import { worldbuildingApi } from '@/services/worldbuildingApi';

interface Assumption {
  category: string;
  key: string;
  value: string;
  confidence: number;
  reason: string;
  can_override: boolean;
}

interface AssumptionReviewProps {
  assumptions: Assumption[];
  onConfirm: (updatedAssumptions: Assumption[]) => void;
  projectPath: string;
}

export function AssumptionReview({ assumptions, onConfirm, projectPath }: AssumptionReviewProps) {
  const [editingAssumptions, setEditingAssumptions] = useState<{[key: string]: string}>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (assumption: Assumption) => {
    setEditingAssumptions(prev => ({
      ...prev,
      [assumption.key]: assumption.value
    }));
  };

  const handleSave = async (assumption: Assumption) => {
    const newValue = editingAssumptions[assumption.key];
    if (!newValue || newValue === assumption.value) {
      handleCancel(assumption.key);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await worldbuildingApi.overrideAssumption(assumption.key, {
        value: newValue,
        project_path: projectPath,
      });

      // Update local state
      assumption.value = newValue;
      setEditingAssumptions(prev => {
        const updated = { ...prev };
        delete updated[assumption.key];
        return updated;
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (key: string) => {
    setEditingAssumptions(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const handleConfirmAll = () => {
    const updatedAssumptions = assumptions.map(assumption => ({
      ...assumption,
      value: editingAssumptions[assumption.key] || assumption.value
    }));
    onConfirm(updatedAssumptions);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'genre':
        return '📚';
      case 'setting':
        return '🌍';
      case 'tone':
        return '🎭';
      case 'structure':
        return '🏗️';
      case 'worldbuilding':
        return '🏰';
      case 'detail':
        return '📝';
      default:
        return '💡';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review Our Assumptions</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Based on your concept, we've made some assumptions to streamline the setup process. 
          You can modify any of these if they don't match your vision.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {assumptions.map((assumption) => {
          const isEditing = assumption.key in editingAssumptions;
          
          return (
            <Card key={assumption.key} className={isEditing ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(assumption.category)}</span>
                    <div>
                      <CardTitle className="text-lg">
                        {assumption.category.charAt(0).toUpperCase() + assumption.category.slice(1)}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {assumption.reason}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getConfidenceColor(assumption.confidence)}>
                      {Math.round(assumption.confidence * 100)}% confident
                    </Badge>
                    {assumption.can_override && !isEditing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(assumption)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingAssumptions[assumption.key]}
                      onChange={(e) => setEditingAssumptions(prev => ({
                        ...prev,
                        [assumption.key]: e.target.value
                      }))}
                      placeholder="Enter new value"
                      disabled={isSaving}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSave(assumption)}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancel(assumption.key)}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-600">{assumption.key}:</Label>
                    <span className="font-medium">{assumption.value}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end gap-4">
        <Button
          size="lg"
          onClick={handleConfirmAll}
          disabled={isSaving}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Looks Good, Continue
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          These assumptions help us create a tailored experience. 
          You can always change story details later as you write.
        </AlertDescription>
      </Alert>
    </div>
  );
}
