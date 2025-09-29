import { ProblemType, ProblemStatus } from '@/lib/schemas';

/**
 * Get display name for problem types
 */
export function getProblemTypeDisplayName(type: ProblemType): string {
  switch (type) {
    case 'mcq':
      return 'Multiple Choice';
    case 'short':
      return 'Short Answer';
    case 'extended':
      return 'Extended Response';
    default:
      return type;
  }
}

/**
 * Get display name for problem status
 */
export function getProblemStatusDisplayName(status: ProblemStatus): string {
  switch (status) {
    case 'wrong':
      return 'Wrong';
    case 'needs_review':
      return 'Needs Review';
    case 'mastered':
      return 'Mastered';
    default:
      return status;
  }
}

/**
 * Get display name for status (string version for backward compatibility)
 */
export function getStatusDisplayName(status: string): string {
  switch (status) {
    case 'wrong':
      return 'Wrong';
    case 'needs_review':
      return 'Needs Review';
    case 'mastered':
      return 'Mastered';
    default:
      return status;
  }
}

/**
 * Get display name for table column IDs
 */
export function getColumnDisplayName(columnId: string): string {
  switch (columnId) {
    case 'select':
      return 'Select';
    case 'title':
      return 'Title';
    case 'problem_type':
      return 'Problem Type';
    case 'tags':
      return 'Tags';
    case 'status':
      return 'Status';
    case 'actions':
      return 'Actions';
    case 'created_at':
      return 'Created';
    case 'updated_at':
      return 'Updated';
    default:
      // Convert snake_case to Title Case for unknown columns
      return columnId
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }
}
