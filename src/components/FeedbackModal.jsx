import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, TrendingUp, Lightbulb, Target } from 'lucide-react';

const FeedbackModal = ({ isOpen, onClose, feedbackContent, isLoading }) => {
  // Parse feedback sections if structured (simple implementation)
  const renderFeedback = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-muted-foreground">Feedback wird generiert...</p>
        </div>
      );
    }

    if (!feedbackContent) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Kein Feedback verfügbar.
        </div>
      );
    }

    // Split feedback into sections (basic parsing)
    const sections = feedbackContent.split('\n\n');

    return (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {sections.map((section, index) => {
          // Determine icon based on keywords
          let Icon = Lightbulb;
          if (section.includes('Struktur') || section.includes('struktur')) {
            Icon = Target;
          } else if (section.includes('Verbesserung') || section.includes('Tipp')) {
            Icon = TrendingUp;
          } else if (section.includes('Positiv') || section.includes('Gut')) {
            Icon = CheckCircle2;
          }

          return (
            <div key={index} className="flex gap-3 p-4 bg-muted/50 rounded-lg">
              <Icon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1 text-sm whitespace-pre-wrap">{section}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            Dein Bewerbungsgespräch-Feedback
          </DialogTitle>
          <DialogDescription>
            Hier ist deine persönliche Auswertung basierend auf dem geführten Gespräch
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderFeedback()}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
