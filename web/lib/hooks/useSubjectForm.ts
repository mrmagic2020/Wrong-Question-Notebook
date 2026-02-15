import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  SUBJECT_CONSTANTS,
  getNextSubjectColor,
  suggestIconForSubject,
  SubjectColor,
  SubjectIcon,
} from '@/lib/constants';
import { SubjectWithMetadata } from '@/lib/types';

interface UseSubjectFormProps {
  existingSubjects?: Array<{ color?: string }>;
  onSuccess?: (subject: SubjectWithMetadata) => void;
  resetOnSuccess?: boolean;
}

export function useSubjectForm({
  existingSubjects = [],
  onSuccess,
  resetOnSuccess = true,
}: UseSubjectFormProps = {}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<SubjectColor>(
    SUBJECT_CONSTANTS.DEFAULT_COLOR
  );
  const [icon, setIcon] = useState<SubjectIcon>(SUBJECT_CONSTANTS.DEFAULT_ICON);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  // Auto-suggest icon when name changes
  useEffect(() => {
    if (name.trim()) {
      setIcon(suggestIconForSubject(name));
    }
  }, [name]);

  // Auto-rotate color on mount or when existingSubjects changes
  useEffect(() => {
    setColor(getNextSubjectColor(existingSubjects));
  }, [existingSubjects]);

  const resetForm = useCallback(() => {
    setName('');
    setColor(getNextSubjectColor(existingSubjects));
    setIcon(SUBJECT_CONSTANTS.DEFAULT_ICON);
  }, [existingSubjects]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color, icon }),
      });
      if (!res.ok) throw new Error('Failed to create subject');

      const result = await res.json();

      if (resetOnSuccess) {
        resetForm();
      }

      onSuccess?.(result.data);
      toast.success('Subject created');
      router.refresh();

      return result.data;
    } catch (err: unknown) {
      toast.error('Failed to create subject');
      const originalMessage = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to create subject: ${originalMessage}`);
    } finally {
      setBusy(false);
    }
  };

  return {
    // Form state
    name,
    color,
    icon,
    busy,
    // Setters
    setName,
    setColor,
    setIcon,
    // Actions
    handleSubmit,
    resetForm,
  };
}
