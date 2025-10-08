'use client';

import { useState, useEffect } from 'react';
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
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { VALIDATION_CONSTANTS } from '@/lib/constants';
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
import { ProblemSetSharingLevel } from '@/lib/schemas';

interface ProblemSetEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemSet: {
    id: string;
    name: string;
    description: string | null;
    sharing_level: ProblemSetSharingLevel;
    shared_with_emails?: string[];
  };
  onSuccess?: () => void;
}

export default function ProblemSetEditDialog({
  open,
  onOpenChange,
  problemSet,
  onSuccess,
}: ProblemSetEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sharing_level: ProblemSetSharingLevel.enum
      .private as ProblemSetSharingLevel,
    shared_with_emails: [] as string[],
  });
  const [emailInput, setEmailInput] = useState('');

  // Initialize form data when problem set changes
  useEffect(() => {
    if (problemSet) {
      setFormData({
        name: problemSet.name,
        description: problemSet.description || '',
        sharing_level: problemSet.sharing_level,
        shared_with_emails: problemSet.shared_with_emails || [],
      });
    }
  }, [problemSet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter a name for the problem set');
      return;
    }

    if (!problemSet?.id) {
      toast.error('Invalid problem set');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        sharing_level: formData.sharing_level,
        shared_with_emails:
          formData.shared_with_emails.length > 0
            ? formData.shared_with_emails
            : undefined,
      };

      const response = await fetch(`/api/problem-sets/${problemSet.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update problem set';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success('Problem set updated successfully');
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating problem set:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update problem set'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email) return;

    // Parse comma separated emails
    const emails = email.split(',').map(e => e.trim());

    const newEmails: string[] = [];

    for (const email of emails) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      if (!formData.shared_with_emails.includes(email)) {
        newEmails.push(email);
      }
    }

    setFormData(prev => ({
      ...prev,
      shared_with_emails: [...prev.shared_with_emails, ...newEmails],
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
    if (
      e.key === 'Enter' &&
      formData.sharing_level === ProblemSetSharingLevel.enum.limited
    ) {
      e.preventDefault();
      addEmail();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Problem Set</DialogTitle>
          <DialogDescription>
            Update the problem set details and sharing settings.
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
            <RichTextEditor
              content={formData.description}
              onChange={content =>
                setFormData(prev => ({ ...prev, description: content }))
              }
              placeholder="Enter problem set description (optional)"
              minHeight="100px"
              maxHeight="250px"
              maxLength={VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX}
              showCharacterCount={true}
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
                <SelectItem value={ProblemSetSharingLevel.enum.private}>
                  Private - Only you can view
                </SelectItem>
                <SelectItem value={ProblemSetSharingLevel.enum.limited}>
                  Limited - Share with specific people
                </SelectItem>
                <SelectItem value={ProblemSetSharingLevel.enum.public}>
                  Public - Anyone with the link can view
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.sharing_level === ProblemSetSharingLevel.enum.limited && (
            <div className="space-y-2">
              <Label htmlFor="emails">Share with</Label>
              <div className="flex gap-2">
                <Input
                  id="emails"
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={handleKeyPress}
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
              {isLoading ? 'Updating...' : 'Update Problem Set'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
