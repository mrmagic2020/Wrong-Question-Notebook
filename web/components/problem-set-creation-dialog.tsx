'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PROBLEM_SET_CONSTANTS } from '@/lib/constants';

interface ProblemSetCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  selectedProblemIds: string[];
  onSuccess?: () => void;
}

export default function ProblemSetCreationDialog({
  open,
  onOpenChange,
  subjectId,
  selectedProblemIds,
  onSuccess,
}: ProblemSetCreationDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sharing_level: 'private' as 'private' | 'limited' | 'public',
    shared_with_emails: [] as string[],
  });
  const [emailInput, setEmailInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter a name for the problem set');
      return;
    }

    if (selectedProblemIds.length === 0) {
      toast.error('Please select at least one problem');
      return;
    }

    if (!subjectId) {
      toast.error('Invalid subject');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        subject_id: subjectId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        sharing_level: formData.sharing_level,
        shared_with_emails:
          formData.shared_with_emails.length > 0
            ? formData.shared_with_emails
            : undefined,
        problem_ids: selectedProblemIds,
      };

      const response = await fetch('/api/problem-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create problem set';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success('Problem set created successfully');

      // Reset form
      setFormData({
        name: '',
        description: '',
        sharing_level: PROBLEM_SET_CONSTANTS.SHARING_LEVELS.PRIVATE,
        shared_with_emails: [],
      });
      setEmailInput('');

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }

      // Navigate to the new problem set
      router.push(`/problem-sets/${result.data.id}`);
    } catch (error) {
      console.error('Error creating problem set:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create problem set'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (formData.shared_with_emails.includes(email)) {
      toast.error('This email is already added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      shared_with_emails: [...prev.shared_with_emails, email],
    }));
    setEmailInput('');
  };

  const removeEmail = (emailToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      shared_with_emails: prev.shared_with_emails.filter(
        email => email !== emailToRemove
      ),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && formData.sharing_level === 'limited') {
      e.preventDefault();
      addEmail();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Problem Set</DialogTitle>
          <DialogDescription>
            Create a new problem set with {selectedProblemIds.length} selected
            problem{selectedProblemIds.length !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter problem set name"
              maxLength={50}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="Enter problem set description (optional)"
              maxLength={1000}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sharing">Sharing</Label>
            <Select
              value={formData.sharing_level}
              onValueChange={value =>
                setFormData(prev => ({ ...prev, sharing_level: value as any }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value={PROBLEM_SET_CONSTANTS.SHARING_LEVELS.PRIVATE}
                >
                  Private - Only you can view
                </SelectItem>
                <SelectItem
                  value={PROBLEM_SET_CONSTANTS.SHARING_LEVELS.LIMITED}
                >
                  Limited - Share with specific people
                </SelectItem>
                <SelectItem value={PROBLEM_SET_CONSTANTS.SHARING_LEVELS.PUBLIC}>
                  Public - Anyone with the link can view
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.sharing_level === 'limited' && (
            <div className="space-y-2">
              <Label htmlFor="emails">Share with</Label>
              <div className="flex gap-2">
                <Input
                  id="emails"
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter email address"
                />
                <Button type="button" onClick={addEmail} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.shared_with_emails.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.shared_with_emails.map(email => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Problem Set'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
