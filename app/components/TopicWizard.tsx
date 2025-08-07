'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TopicWizardProps {
  onTopicSubmit: (topic: string, category: string, tone: string) => void;
  isLoading?: boolean;
}

const CATEGORIES = [
  'Technology',
  'Business',
  'Science',
  'Health',
  'Education',
  'Entertainment',
  'Sports',
  'Politics',
  'Environment',
  'Other'
];

const TONES = [
  { value: 'casual', label: 'Casual', description: 'Friendly and conversational' },
  { value: 'professional', label: 'Professional', description: 'Business-like and authoritative' },
  { value: 'academic', label: 'Academic', description: 'Formal and scholarly' }
];

export default function TopicWizard({ onTopicSubmit, isLoading }: TopicWizardProps) {
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('');
  const [tone, setTone] = useState('');

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    if (topic && category && tone) {
      onTopicSubmit(topic, category, tone);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= stepNumber ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {stepNumber}
            </div>
            {stepNumber < 3 && (
              <div className={`w-16 h-1 mx-2 ${
                step > stepNumber ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Topic Input */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="topic">What would you like to write about?</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., The Future of Artificial Intelligence"
              className="mt-2"
            />
          </div>
          <Button onClick={handleNext} disabled={!topic.trim()}>
            Next
          </Button>
        </div>
      )}

      {/* Step 2: Category Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>Choose a category</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? 'default' : 'outline'}
                  onClick={() => setCategory(cat)}
                  className="justify-start"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleNext} disabled={!category}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Tone Selection */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label>Choose your writing tone</Label>
            <div className="space-y-3 mt-2">
              {TONES.map((toneOption) => (
                <div
                  key={toneOption.value}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    tone === toneOption.value ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => setTone(toneOption.value)}
                >
                  <div className="font-medium">{toneOption.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {toneOption.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={!tone || isLoading}>
              {isLoading ? 'Generating...' : 'Generate Blog Post'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
