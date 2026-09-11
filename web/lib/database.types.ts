export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          key: string;
          updated_at: string | null;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          key: string;
          updated_at?: string | null;
          updated_by?: string | null;
          value: Json;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          key?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      attempts: {
        Row: {
          cause: string | null;
          confidence: number | null;
          created_at: string;
          id: string;
          is_correct: boolean | null;
          is_self_assessed: boolean;
          problem_id: string;
          reflection_notes: string | null;
          selected_status: string | null;
          submitted_answer: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cause?: string | null;
          confidence?: number | null;
          created_at?: string;
          id?: string;
          is_correct?: boolean | null;
          is_self_assessed?: boolean;
          problem_id: string;
          reflection_notes?: string | null;
          selected_status?: string | null;
          submitted_answer: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cause?: string | null;
          confidence?: number | null;
          created_at?: string;
          id?: string;
          is_correct?: boolean | null;
          is_self_assessed?: boolean;
          problem_id?: string;
          reflection_notes?: string | null;
          selected_status?: string | null;
          submitted_answer?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'attempts_problem_id_fkey';
            columns: ['problem_id'];
            isOneToOne: false;
            referencedRelation: 'problems';
            referencedColumns: ['id'];
          },
        ];
      };
      content_limit_overrides: {
        Row: {
          created_at: string;
          id: string;
          limit_value: number;
          resource_type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          limit_value: number;
          resource_type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          limit_value?: number;
          resource_type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      error_categorisations: {
        Row: {
          ai_confidence: number;
          ai_reasoning: string | null;
          attempt_id: string;
          broad_category: string;
          created_at: string;
          granular_tag: string;
          id: string;
          is_user_override: boolean;
          original_broad_category: string | null;
          original_granular_tag: string | null;
          problem_id: string;
          subject_id: string;
          topic_label: string;
          topic_label_normalised: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ai_confidence: number;
          ai_reasoning?: string | null;
          attempt_id: string;
          broad_category: string;
          created_at?: string;
          granular_tag: string;
          id?: string;
          is_user_override?: boolean;
          original_broad_category?: string | null;
          original_granular_tag?: string | null;
          problem_id: string;
          subject_id: string;
          topic_label: string;
          topic_label_normalised: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ai_confidence?: number;
          ai_reasoning?: string | null;
          attempt_id?: string;
          broad_category?: string;
          created_at?: string;
          granular_tag?: string;
          id?: string;
          is_user_override?: boolean;
          original_broad_category?: string | null;
          original_granular_tag?: string | null;
          problem_id?: string;
          subject_id?: string;
          topic_label?: string;
          topic_label_normalised?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'error_categorisations_attempt_id_fkey';
            columns: ['attempt_id'];
            isOneToOne: true;
            referencedRelation: 'attempts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'error_categorisations_problem_id_fkey';
            columns: ['problem_id'];
            isOneToOne: false;
            referencedRelation: 'problems';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'error_categorisations_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
        ];
      };
      insight_digests: {
        Row: {
          created_at: string;
          digest_tier: string | null;
          error_pattern_summary: string;
          generated_at: string;
          headline: string;
          id: string;
          progress_narratives: Json;
          raw_aggregation_data: Json | null;
          status: string;
          subject_error_patterns: Json | null;
          subject_health: Json;
          topic_clusters: Json;
          user_id: string;
          weak_spots: Json;
        };
        Insert: {
          created_at?: string;
          digest_tier?: string | null;
          error_pattern_summary?: string;
          generated_at?: string;
          headline?: string;
          id?: string;
          progress_narratives?: Json;
          raw_aggregation_data?: Json | null;
          status?: string;
          subject_error_patterns?: Json | null;
          subject_health?: Json;
          topic_clusters?: Json;
          user_id: string;
          weak_spots?: Json;
        };
        Update: {
          created_at?: string;
          digest_tier?: string | null;
          error_pattern_summary?: string;
          generated_at?: string;
          headline?: string;
          id?: string;
          progress_narratives?: Json;
          raw_aggregation_data?: Json | null;
          status?: string;
          subject_error_patterns?: Json | null;
          subject_health?: Json;
          topic_clusters?: Json;
          user_id?: string;
          weak_spots?: Json;
        };
        Relationships: [];
      };
      problem_set_copies: {
        Row: {
          created_at: string;
          problem_set_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          problem_set_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          problem_set_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'problem_set_copies_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'discoverable_problem_sets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'problem_set_copies_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'problem_sets';
            referencedColumns: ['id'];
          },
        ];
      };
      problem_set_favourites: {
        Row: {
          created_at: string;
          problem_set_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          problem_set_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          problem_set_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'problem_set_favourites_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'discoverable_problem_sets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'problem_set_favourites_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'problem_sets';
            referencedColumns: ['id'];
          },
        ];
      };
      problem_set_likes: {
        Row: {
          created_at: string;
          problem_set_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          problem_set_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          problem_set_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'problem_set_likes_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'discoverable_problem_sets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'problem_set_likes_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'problem_sets';
            referencedColumns: ['id'];
          },
        ];
      };
      problem_set_problems: {
        Row: {
          added_at: string | null;
          id: string;
          problem_id: string;
          problem_set_id: string;
          user_id: string;
        };
        Insert: {
          added_at?: string | null;
          id?: string;
          problem_id: string;
          problem_set_id: string;
          user_id: string;
        };
        Update: {
          added_at?: string | null;
          id?: string;
          problem_id?: string;
          problem_set_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'problem_set_problems_problem_id_fkey';
            columns: ['problem_id'];
            isOneToOne: false;
            referencedRelation: 'problems';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'problem_set_problems_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'discoverable_problem_sets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'problem_set_problems_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'problem_sets';
            referencedColumns: ['id'];
          },
        ];
      };
      problem_set_reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          problem_set_id: string;
          reason: string;
          reporter_user_id: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: string;
          problem_set_id: string;
          reason: string;
          reporter_user_id: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: string;
          problem_set_id?: string;
          reason?: string;
          reporter_user_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'problem_set_reports_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'discoverable_problem_sets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'problem_set_reports_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'problem_sets';
            referencedColumns: ['id'];
          },
        ];
      };
      problem_set_shares: {
        Row: {
          created_at: string | null;
          id: string;
          problem_set_id: string;
          shared_by_user_id: string;
          shared_with_email: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          problem_set_id: string;
          shared_by_user_id: string;
          shared_with_email: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          problem_set_id?: string;
          shared_by_user_id?: string;
          shared_with_email?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'problem_set_shares_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'discoverable_problem_sets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'problem_set_shares_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'problem_sets';
            referencedColumns: ['id'];
          },
        ];
      };
      problem_set_stats: {
        Row: {
          copy_count: number;
          like_count: number;
          problem_count: number;
          problem_set_id: string;
          ranking_score: number;
          unique_view_count: number;
          updated_at: string;
          view_count: number;
        };
        Insert: {
          copy_count?: number;
          like_count?: number;
          problem_count?: number;
          problem_set_id: string;
          ranking_score?: number;
          unique_view_count?: number;
          updated_at?: string;
          view_count?: number;
        };
        Update: {
          copy_count?: number;
          like_count?: number;
          problem_count?: number;
          problem_set_id?: string;
          ranking_score?: number;
          unique_view_count?: number;
          updated_at?: string;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'problem_set_stats_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: true;
            referencedRelation: 'discoverable_problem_sets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'problem_set_stats_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: true;
            referencedRelation: 'problem_sets';
            referencedColumns: ['id'];
          },
        ];
      };
      problem_set_views: {
        Row: {
          created_at: string;
          id: string;
          problem_set_id: string;
          time_bucket: string;
          user_id: string | null;
          viewer_hash: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          problem_set_id: string;
          time_bucket: string;
          user_id?: string | null;
          viewer_hash: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          problem_set_id?: string;
          time_bucket?: string;
          user_id?: string | null;
          viewer_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'problem_set_views_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'discoverable_problem_sets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'problem_set_views_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'problem_sets';
            referencedColumns: ['id'];
          },
        ];
      };
      problem_sets: {
        Row: {
          allow_copying: boolean;
          created_at: string | null;
          description: string | null;
          discovery_subject: string | null;
          filter_config: Json | null;
          fts: unknown;
          id: string;
          is_listed: boolean;
          is_smart: boolean;
          name: string;
          session_config: Json | null;
          sharing_level: Database['public']['Enums']['sharing_level'];
          subject_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          allow_copying?: boolean;
          created_at?: string | null;
          description?: string | null;
          discovery_subject?: string | null;
          filter_config?: Json | null;
          fts?: unknown;
          id?: string;
          is_listed?: boolean;
          is_smart?: boolean;
          name: string;
          session_config?: Json | null;
          sharing_level?: Database['public']['Enums']['sharing_level'];
          subject_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          allow_copying?: boolean;
          created_at?: string | null;
          description?: string | null;
          discovery_subject?: string | null;
          filter_config?: Json | null;
          fts?: unknown;
          id?: string;
          is_listed?: boolean;
          is_smart?: boolean;
          name?: string;
          session_config?: Json | null;
          sharing_level?: Database['public']['Enums']['sharing_level'];
          subject_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'problem_sets_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
        ];
      };
      problem_status_history: {
        Row: {
          changed_at: string;
          changed_date: string;
          id: string;
          new_status: string;
          old_status: string | null;
          problem_id: string;
          user_id: string;
        };
        Insert: {
          changed_at?: string;
          changed_date?: string;
          id?: string;
          new_status: string;
          old_status?: string | null;
          problem_id: string;
          user_id: string;
        };
        Update: {
          changed_at?: string;
          changed_date?: string;
          id?: string;
          new_status?: string;
          old_status?: string | null;
          problem_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'problem_status_history_problem_id_fkey';
            columns: ['problem_id'];
            isOneToOne: false;
            referencedRelation: 'problems';
            referencedColumns: ['id'];
          },
        ];
      };
      problem_tag: {
        Row: {
          created_at: string;
          problem_id: string;
          tag_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          problem_id: string;
          tag_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          problem_id?: string;
          tag_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'problem_tag_problem_id_fkey';
            columns: ['problem_id'];
            isOneToOne: false;
            referencedRelation: 'problems';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'problem_tag_tag_id_fkey';
            columns: ['tag_id'];
            isOneToOne: false;
            referencedRelation: 'tags';
            referencedColumns: ['id'];
          },
        ];
      };
      problems: {
        Row: {
          answer_config: Json | null;
          assets: Json;
          auto_mark: boolean;
          content: string | null;
          correct_answer: string | null;
          created_at: string;
          embedding: string | null;
          id: string;
          last_reviewed_date: string | null;
          problem_type: Database['public']['Enums']['problem_type_enum'];
          solution_assets: Json;
          solution_text: string | null;
          status: Database['public']['Enums']['problem_status_enum'];
          subject_id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          answer_config?: Json | null;
          assets?: Json;
          auto_mark?: boolean;
          content?: string | null;
          correct_answer?: string | null;
          created_at?: string;
          embedding?: string | null;
          id?: string;
          last_reviewed_date?: string | null;
          problem_type: Database['public']['Enums']['problem_type_enum'];
          solution_assets?: Json;
          solution_text?: string | null;
          status: Database['public']['Enums']['problem_status_enum'];
          subject_id: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          answer_config?: Json | null;
          assets?: Json;
          auto_mark?: boolean;
          content?: string | null;
          correct_answer?: string | null;
          created_at?: string;
          embedding?: string | null;
          id?: string;
          last_reviewed_date?: string | null;
          problem_type?: Database['public']['Enums']['problem_type_enum'];
          solution_assets?: Json;
          solution_text?: string | null;
          status?: Database['public']['Enums']['problem_status_enum'];
          subject_id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'problems_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
        ];
      };
      qr_upload_sessions: {
        Row: {
          consumed_at: string | null;
          created_at: string;
          expires_at: string;
          file_path: string | null;
          id: string;
          mime_type: string | null;
          status: string;
          token_hash: string;
          uploaded_at: string | null;
          user_id: string;
        };
        Insert: {
          consumed_at?: string | null;
          created_at?: string;
          expires_at?: string;
          file_path?: string | null;
          id?: string;
          mime_type?: string | null;
          status?: string;
          token_hash: string;
          uploaded_at?: string | null;
          user_id: string;
        };
        Update: {
          consumed_at?: string | null;
          created_at?: string;
          expires_at?: string;
          file_path?: string | null;
          id?: string;
          mime_type?: string | null;
          status?: string;
          token_hash?: string;
          uploaded_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      review_schedule: {
        Row: {
          created_at: string;
          ease_factor: number;
          id: string;
          interval_days: number;
          last_reviewed_at: string | null;
          next_review_at: string;
          problem_id: string;
          repetition_number: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          ease_factor?: number;
          id?: string;
          interval_days?: number;
          last_reviewed_at?: string | null;
          next_review_at: string;
          problem_id: string;
          repetition_number?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          ease_factor?: number;
          id?: string;
          interval_days?: number;
          last_reviewed_at?: string | null;
          next_review_at?: string;
          problem_id?: string;
          repetition_number?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'review_schedule_problem_id_fkey';
            columns: ['problem_id'];
            isOneToOne: false;
            referencedRelation: 'problems';
            referencedColumns: ['id'];
          },
        ];
      };
      review_session_results: {
        Row: {
          completed_at: string;
          id: string;
          problem_id: string;
          session_state_id: string;
          was_correct: boolean | null;
          was_skipped: boolean;
        };
        Insert: {
          completed_at?: string;
          id?: string;
          problem_id: string;
          session_state_id: string;
          was_correct?: boolean | null;
          was_skipped?: boolean;
        };
        Update: {
          completed_at?: string;
          id?: string;
          problem_id?: string;
          session_state_id?: string;
          was_correct?: boolean | null;
          was_skipped?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'review_session_results_problem_id_fkey';
            columns: ['problem_id'];
            isOneToOne: false;
            referencedRelation: 'problems';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'review_session_results_session_state_id_fkey';
            columns: ['session_state_id'];
            isOneToOne: false;
            referencedRelation: 'review_session_state';
            referencedColumns: ['id'];
          },
        ];
      };
      review_session_state: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          last_activity_at: string;
          problem_set_id: string | null;
          session_state: Json;
          session_type: string;
          started_at: string;
          subject_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          last_activity_at?: string;
          problem_set_id?: string | null;
          session_state?: Json;
          session_type?: string;
          started_at?: string;
          subject_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          last_activity_at?: string;
          problem_set_id?: string | null;
          session_state?: Json;
          session_type?: string;
          started_at?: string;
          subject_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'review_session_state_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'discoverable_problem_sets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'review_session_state_problem_set_id_fkey';
            columns: ['problem_set_id'];
            isOneToOne: false;
            referencedRelation: 'problem_sets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'review_session_state_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
        ];
      };
      subjects: {
        Row: {
          color: string | null;
          created_at: string;
          icon: string | null;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          subject_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          subject_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          subject_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tags_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
        ];
      };
      usage_quotas: {
        Row: {
          created_at: string;
          id: string;
          period_start: string;
          resource_type: string;
          updated_at: string;
          usage_count: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          period_start?: string;
          resource_type: string;
          updated_at?: string;
          usage_count?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          period_start?: string;
          resource_type?: string;
          updated_at?: string;
          usage_count?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      user_activity_log: {
        Row: {
          action: string;
          created_at: string | null;
          details: Json | null;
          id: string;
          ip_address: unknown;
          resource_id: string | null;
          resource_type: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: unknown;
          resource_id?: string | null;
          resource_type?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: unknown;
          resource_id?: string | null;
          resource_type?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          date_of_birth: string | null;
          first_name: string | null;
          gender: string | null;
          id: string;
          is_active: boolean | null;
          last_login_at: string | null;
          last_name: string | null;
          onboarding_completed_at: string | null;
          region: string | null;
          timezone: string | null;
          updated_at: string | null;
          user_role: string | null;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          date_of_birth?: string | null;
          first_name?: string | null;
          gender?: string | null;
          id: string;
          is_active?: boolean | null;
          last_login_at?: string | null;
          last_name?: string | null;
          onboarding_completed_at?: string | null;
          region?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          user_role?: string | null;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          date_of_birth?: string | null;
          first_name?: string | null;
          gender?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_login_at?: string | null;
          last_name?: string | null;
          onboarding_completed_at?: string | null;
          region?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          user_role?: string | null;
          username?: string;
        };
        Relationships: [];
      };
      user_quota_overrides: {
        Row: {
          created_at: string;
          daily_limit: number;
          id: string;
          resource_type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          daily_limit: number;
          id?: string;
          resource_type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          daily_limit?: number;
          id?: string;
          resource_type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      discoverable_problem_sets: {
        Row: {
          copy_count: number | null;
          created_at: string | null;
          description: string | null;
          discovery_subject: string | null;
          fts: unknown;
          id: string | null;
          is_smart: boolean | null;
          like_count: number | null;
          name: string | null;
          problem_count: number | null;
          ranking_score: number | null;
          unique_view_count: number | null;
          user_id: string | null;
          view_count: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      can_view_problem: { Args: { p_problem_id: string }; Returns: boolean };
      check_and_increment_quota: {
        Args: {
          p_default_limit: number;
          p_resource_type: string;
          p_user_id: string;
          p_user_tz?: string;
        };
        Returns: Json;
      };
      compute_problem_set_count: {
        Args: { p_problem_set_id: string };
        Returns: number;
      };
      find_problem_by_asset: { Args: { p_path: string }; Returns: string };
      generate_username_from_email: {
        Args: { p_email: string };
        Returns: string;
      };
      get_activity_heatmap: {
        Args: { p_user_id: string; p_user_tz?: string };
        Returns: Json;
      };
      get_activity_summary: {
        Args: { p_user_id: string };
        Returns: {
          problems_with_errors: number;
          total_attempts: number;
          total_problems: number;
          total_subjects: number;
        }[];
      };
      get_discovery_subject_counts: {
        Args: never;
        Returns: {
          count: number;
          name: string;
        }[];
      };
      get_due_problems_count: {
        Args: never;
        Returns: {
          due_count: number;
          subject_id: string;
        }[];
      };
      get_due_problems_for_subject: {
        Args: { p_limit?: number; p_subject_id: string };
        Returns: {
          answer_config: Json | null;
          assets: Json;
          auto_mark: boolean;
          content: string | null;
          correct_answer: string | null;
          created_at: string;
          embedding: string | null;
          id: string;
          last_reviewed_date: string | null;
          problem_type: Database['public']['Enums']['problem_type_enum'];
          solution_assets: Json;
          solution_text: string | null;
          status: Database['public']['Enums']['problem_status_enum'];
          subject_id: string;
          title: string;
          updated_at: string;
          user_id: string;
        }[];
        SetofOptions: {
          from: '*';
          to: 'problems';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_error_aggregation_data: {
        Args: { p_user_id: string };
        Returns: {
          ai_confidence: number;
          attempt_created_at: string;
          attempt_id: string;
          attempt_selected_status: string;
          broad_category: string;
          categorisation_created_at: string;
          categorisation_id: string;
          granular_tag: string;
          is_user_override: boolean;
          problem_id: string;
          problem_status: string;
          problem_title: string;
          subject_id: string;
          subject_name: string;
          topic_label: string;
          topic_label_normalised: string;
        }[];
      };
      get_problem_set_progress: {
        Args: { problem_set_uuid: string; user_uuid: string };
        Returns: {
          mastered_count: number;
          needs_review_count: number;
          total_problems: number;
          wrong_count: number;
        }[];
      };
      get_recent_study_activity: {
        Args: { p_user_id: string };
        Returns: {
          changed_at: string;
          new_status: string;
          old_status: string;
          problem_id: string;
          problem_title: string;
          subject_name: string;
        }[];
      };
      get_session_statistics: { Args: { p_user_id: string }; Returns: Json };
      get_study_streaks: {
        Args: { p_user_id: string; p_user_tz?: string };
        Returns: Json;
      };
      get_subject_breakdown: {
        Args: { p_user_id: string };
        Returns: {
          mastered: number;
          mastery_pct: number;
          needs_review: number;
          subject_id: string;
          subject_name: string;
          total: number;
          wrong: number;
        }[];
      };
      get_subjects_with_metadata: {
        Args: never;
        Returns: {
          color: string;
          created_at: string;
          due_count: number;
          icon: string;
          id: string;
          last_activity: string;
          name: string;
          problem_count: number;
          user_id: string;
        }[];
      };
      get_uncategorised_attempts: {
        Args: { p_limit: number; p_user_id: string };
        Returns: {
          attempt_created_at: string;
          attempt_id: string;
          cause: string;
          correct_answer: string;
          is_correct: boolean;
          problem_content: string;
          problem_id: string;
          problem_title: string;
          problem_type: string;
          reflection_notes: string;
          selected_status: string;
          subject_id: string;
          subject_name: string;
          submitted_answer: Json;
        }[];
      };
      get_unreferenced_asset_paths: {
        Args: { p_exclude_problem_id: string; p_paths: string[] };
        Returns: string[];
      };
      get_user_statistics:
        | {
            Args: never;
            Returns: {
              active_users: number;
              admin_users: number;
              new_users_this_week: number;
              new_users_today: number;
              total_users: number;
            }[];
          }
        | { Args: { p_user_id: string }; Returns: Json };
      get_user_storage_bytes: { Args: { p_user_id: string }; Returns: number };
      get_weekly_progress: {
        Args: { p_user_id: string; p_user_tz?: string };
        Returns: Json;
      };
      increment_copy_count: {
        Args: { p_problem_set_id: string };
        Returns: undefined;
      };
      log_user_activity: {
        Args: {
          p_action: string;
          p_details?: Json;
          p_resource_id?: string;
          p_resource_type?: string;
        };
        Returns: string;
      };
      record_problem_set_copy: {
        Args: { p_problem_set_id: string; p_user_id: string };
        Returns: undefined;
      };
      record_problem_set_view: {
        Args: {
          p_problem_set_id: string;
          p_user_id?: string;
          p_viewer_hash: string;
        };
        Returns: undefined;
      };
      refresh_ranking_scores: { Args: never; Returns: undefined };
      to_user_date: { Args: { p_ts: string; p_tz?: string }; Returns: string };
      toggle_problem_set_like: {
        Args: { p_problem_set_id: string; p_user_id: string };
        Returns: {
          like_count: number;
          liked: boolean;
        }[];
      };
      user_owns_problem_with_asset: {
        Args: { p_path: string };
        Returns: boolean;
      };
      user_today: { Args: { p_tz?: string }; Returns: string };
    };
    Enums: {
      problem_status_enum: 'wrong' | 'needs_review' | 'mastered';
      problem_type_enum: 'mcq' | 'short' | 'extended';
      sharing_level: 'private' | 'limited' | 'public';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      problem_status_enum: ['wrong', 'needs_review', 'mastered'],
      problem_type_enum: ['mcq', 'short', 'extended'],
      sharing_level: ['private', 'limited', 'public'],
    },
  },
} as const;
