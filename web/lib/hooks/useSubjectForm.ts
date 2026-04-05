import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
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
import { apiUrl } from '@/lib/api-utils';

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

  // Ref to track current fetch abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

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

    console.log('[useSubjectForm] Submitting:', {
      name: name.trim(),
      color,
      icon,
    });
    console.log('[useSubjectForm] API URL:', apiUrl('/api/subjects'));

    // Cancel any existing in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setBusy(true);
    try {
      const res = await fetch(apiUrl('/api/subjects'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color, icon }),
        signal: abortController.signal,
      });

      console.log('[useSubjectForm] Response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[useSubjectForm] API error:', errorData);
        throw new Error(
          `HTTP ${res.status}: ${errorData.error?.message || res.statusText}`
        );
      }

      const result = await res.json();
      console.log('[useSubjectForm] Success:', result);

      if (resetOnSuccess) {
        resetForm();
      }

      onSuccess?.(result.data);
      toast.success('Subject created');
      router.refresh();

      return result.data;
    } catch (err: unknown) {
      console.error('[useSubjectForm] Catch error:', err);
      // Ignore abort errors - they happen when user navigates away or closes dialog
      if (err instanceof Error) {
        // AbortError is thrown when fetch is cancelled by AbortController
        if (err.name === 'AbortError') {
          console.log('[useSubjectForm] AbortError ignored');
          return;
        }
        // TypeError with 'Failed to fetch' message usually means network error or CORS issue
        // This can happen if the request is cancelled due to page navigation
        if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
          console.log('[useSubjectForm] Failed to fetch ignored');
          return;
        }
        toast.error('Failed to create subject: ' + err.message);
        throw new Error(`Failed to create subject: ${err.message}`);
      }
      toast.error('Failed to create subject');
      throw new Error(`Failed to create subject: ${String(err)}`);
    } finally {
      setBusy(false);
      abortControllerRef.current = null;
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
