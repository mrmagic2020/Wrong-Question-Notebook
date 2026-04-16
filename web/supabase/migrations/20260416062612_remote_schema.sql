create extension if not exists "pg_cron" with schema "pg_catalog";

create extension if not exists "hypopg" with schema "extensions";

create extension if not exists "index_advisor" with schema "extensions";

create extension if not exists "vector" with schema "extensions";

drop extension if exists "pg_net";

create type "public"."problem_status_enum" as enum ('wrong', 'needs_review', 'mastered');

create type "public"."problem_type_enum" as enum ('mcq', 'short', 'extended');

create type "public"."sharing_level" as enum ('private', 'limited', 'public');


  create table "public"."admin_settings" (
    "id" uuid not null default gen_random_uuid(),
    "key" character varying(100) not null,
    "value" jsonb not null,
    "description" text,
    "updated_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."admin_settings" enable row level security;


  create table "public"."attempts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "problem_id" uuid not null,
    "submitted_answer" jsonb not null,
    "is_correct" boolean,
    "cause" text,
    "created_at" timestamp with time zone not null default now(),
    "is_self_assessed" boolean not null default false,
    "confidence" smallint,
    "reflection_notes" text,
    "updated_at" timestamp with time zone not null default now(),
    "selected_status" character varying
      );


alter table "public"."attempts" enable row level security;


  create table "public"."content_limit_overrides" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "resource_type" text not null,
    "limit_value" bigint not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."content_limit_overrides" enable row level security;


  create table "public"."error_categorisations" (
    "id" uuid not null default gen_random_uuid(),
    "attempt_id" uuid not null,
    "problem_id" uuid not null,
    "subject_id" uuid not null,
    "user_id" uuid not null,
    "broad_category" text not null,
    "granular_tag" text not null,
    "topic_label" text not null,
    "topic_label_normalised" text not null,
    "ai_confidence" real not null,
    "ai_reasoning" text,
    "is_user_override" boolean not null default false,
    "original_broad_category" text,
    "original_granular_tag" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."error_categorisations" enable row level security;


  create table "public"."insight_digests" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "generated_at" timestamp with time zone not null default now(),
    "headline" text not null default ''::text,
    "error_pattern_summary" text not null default ''::text,
    "subject_health" jsonb not null default '{}'::jsonb,
    "weak_spots" jsonb not null default '[]'::jsonb,
    "topic_clusters" jsonb not null default '{}'::jsonb,
    "progress_narratives" jsonb not null default '{}'::jsonb,
    "raw_aggregation_data" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "subject_error_patterns" jsonb default '{}'::jsonb,
    "status" text not null default 'completed'::text,
    "digest_tier" text
      );


alter table "public"."insight_digests" enable row level security;


  create table "public"."problem_set_copies" (
    "user_id" uuid not null,
    "problem_set_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."problem_set_copies" enable row level security;


  create table "public"."problem_set_favourites" (
    "user_id" uuid not null,
    "problem_set_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."problem_set_favourites" enable row level security;


  create table "public"."problem_set_likes" (
    "user_id" uuid not null,
    "problem_set_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."problem_set_likes" enable row level security;


  create table "public"."problem_set_problems" (
    "id" uuid not null default gen_random_uuid(),
    "problem_set_id" uuid not null,
    "problem_id" uuid not null,
    "user_id" uuid not null,
    "added_at" timestamp with time zone default now()
      );


alter table "public"."problem_set_problems" enable row level security;


  create table "public"."problem_set_reports" (
    "id" uuid not null default gen_random_uuid(),
    "problem_set_id" uuid not null,
    "reporter_user_id" uuid not null,
    "reason" text not null,
    "details" text,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."problem_set_reports" enable row level security;


  create table "public"."problem_set_shares" (
    "id" uuid not null default gen_random_uuid(),
    "problem_set_id" uuid not null,
    "shared_with_email" character varying(255) not null,
    "shared_by_user_id" uuid not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."problem_set_shares" enable row level security;


  create table "public"."problem_set_stats" (
    "problem_set_id" uuid not null,
    "view_count" bigint not null default 0,
    "unique_view_count" bigint not null default 0,
    "like_count" bigint not null default 0,
    "copy_count" bigint not null default 0,
    "problem_count" integer not null default 0,
    "ranking_score" double precision not null default 0,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."problem_set_stats" enable row level security;


  create table "public"."problem_set_views" (
    "id" uuid not null default gen_random_uuid(),
    "problem_set_id" uuid not null,
    "viewer_hash" text not null,
    "user_id" uuid,
    "time_bucket" timestamp with time zone not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."problem_set_views" enable row level security;


  create table "public"."problem_sets" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "subject_id" uuid not null,
    "name" text not null,
    "description" text,
    "sharing_level" public.sharing_level not null default 'private'::public.sharing_level,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_smart" boolean not null default false,
    "filter_config" jsonb,
    "session_config" jsonb,
    "allow_copying" boolean not null default true,
    "is_listed" boolean not null default true,
    "fts" tsvector generated always as ((setweight(to_tsvector('english'::regconfig, COALESCE(name, ''::text)), 'A'::"char") || setweight(to_tsvector('english'::regconfig, regexp_replace(COALESCE(description, ''::text), '<[^>]*>'::text, ' '::text, 'g'::text)), 'B'::"char"))) stored,
    "discovery_subject" text
      );


alter table "public"."problem_sets" enable row level security;


  create table "public"."problem_status_history" (
    "id" uuid not null default gen_random_uuid(),
    "problem_id" uuid not null,
    "user_id" uuid not null,
    "old_status" text,
    "new_status" text not null,
    "changed_at" timestamp with time zone not null default now(),
    "changed_date" date not null default CURRENT_DATE
      );


alter table "public"."problem_status_history" enable row level security;


  create table "public"."problem_tag" (
    "problem_id" uuid not null,
    "tag_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."problem_tag" enable row level security;


  create table "public"."problems" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "subject_id" uuid not null,
    "content" text,
    "assets" jsonb not null default '[]'::jsonb,
    "auto_mark" boolean not null default false,
    "embedding" extensions.vector(1536),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "solution_text" text,
    "solution_assets" jsonb not null default '[]'::jsonb,
    "title" text not null,
    "problem_type" public.problem_type_enum not null,
    "status" public.problem_status_enum not null,
    "correct_answer" text,
    "last_reviewed_date" timestamp with time zone,
    "answer_config" jsonb
      );


alter table "public"."problems" enable row level security;


  create table "public"."qr_upload_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "token_hash" text not null,
    "status" text not null default 'pending'::text,
    "file_path" text,
    "mime_type" text,
    "created_at" timestamp with time zone not null default now(),
    "expires_at" timestamp with time zone not null default (now() + '00:05:00'::interval),
    "uploaded_at" timestamp with time zone,
    "consumed_at" timestamp with time zone
      );


alter table "public"."qr_upload_sessions" enable row level security;


  create table "public"."review_schedule" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "problem_id" uuid not null,
    "next_review_at" timestamp with time zone not null,
    "interval_days" integer not null default 1,
    "created_at" timestamp with time zone not null default now(),
    "ease_factor" real not null default 2.5,
    "repetition_number" integer not null default 0,
    "last_reviewed_at" timestamp with time zone,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."review_schedule" enable row level security;


  create table "public"."review_session_results" (
    "id" uuid not null default gen_random_uuid(),
    "session_state_id" uuid not null,
    "problem_id" uuid not null,
    "completed_at" timestamp with time zone not null default now(),
    "was_correct" boolean,
    "was_skipped" boolean not null default false
      );


alter table "public"."review_session_results" enable row level security;


  create table "public"."review_session_state" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "problem_set_id" uuid,
    "started_at" timestamp with time zone not null default now(),
    "last_activity_at" timestamp with time zone not null default now(),
    "is_active" boolean not null default true,
    "session_state" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "session_type" text not null default 'problem_set'::text,
    "subject_id" uuid
      );


alter table "public"."review_session_state" enable row level security;


  create table "public"."subjects" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "color" character varying(20) default 'amber'::character varying,
    "icon" character varying(30) default 'BookOpen'::character varying
      );


alter table "public"."subjects" enable row level security;


  create table "public"."tags" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "subject_id" uuid not null
      );


alter table "public"."tags" enable row level security;


  create table "public"."usage_quotas" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "resource_type" text not null,
    "period_start" date not null default CURRENT_DATE,
    "usage_count" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."usage_quotas" enable row level security;


  create table "public"."user_activity_log" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "action" character varying(100) not null,
    "resource_type" character varying(50),
    "resource_id" uuid,
    "details" jsonb,
    "ip_address" inet,
    "user_agent" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."user_activity_log" enable row level security;


  create table "public"."user_profiles" (
    "id" uuid not null,
    "username" character varying(50) not null,
    "first_name" text,
    "last_name" text,
    "date_of_birth" date,
    "gender" text,
    "region" text,
    "timezone" character varying(50) default 'UTC'::character varying,
    "avatar_url" text,
    "bio" text,
    "user_role" character varying(20) default 'user'::character varying,
    "is_active" boolean default true,
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "onboarding_completed_at" timestamp with time zone
      );


alter table "public"."user_profiles" enable row level security;


  create table "public"."user_quota_overrides" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "resource_type" text not null,
    "daily_limit" integer not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."user_quota_overrides" enable row level security;

CREATE UNIQUE INDEX admin_settings_key_key ON public.admin_settings USING btree (key);

CREATE UNIQUE INDEX admin_settings_pkey ON public.admin_settings USING btree (id);

CREATE INDEX attempts_created_at_idx ON public.attempts USING btree (created_at);

CREATE UNIQUE INDEX attempts_pkey ON public.attempts USING btree (id);

CREATE INDEX attempts_selected_status_idx ON public.attempts USING btree (selected_status);

CREATE UNIQUE INDEX content_limit_overrides_pkey ON public.content_limit_overrides USING btree (id);

CREATE UNIQUE INDEX content_limit_overrides_user_id_resource_type_key ON public.content_limit_overrides USING btree (user_id, resource_type);

CREATE UNIQUE INDEX error_categorisations_pkey ON public.error_categorisations USING btree (id);

CREATE INDEX idx_admin_settings_updated_by ON public.admin_settings USING btree (updated_by);

CREATE INDEX idx_attempts_problem ON public.attempts USING btree (problem_id);

CREATE INDEX idx_attempts_user_id ON public.attempts USING btree (user_id);

CREATE INDEX idx_error_categorisations_broad_category ON public.error_categorisations USING btree (user_id, broad_category);

CREATE INDEX idx_error_categorisations_problem_id ON public.error_categorisations USING btree (problem_id);

CREATE INDEX idx_error_categorisations_subject_id ON public.error_categorisations USING btree (subject_id);

CREATE INDEX idx_error_categorisations_topic_normalised ON public.error_categorisations USING btree (user_id, topic_label_normalised);

CREATE INDEX idx_error_categorisations_user_id ON public.error_categorisations USING btree (user_id);

CREATE UNIQUE INDEX idx_insight_digests_one_generating_per_user ON public.insight_digests USING btree (user_id) WHERE (status = 'generating'::text);

CREATE INDEX idx_insight_digests_user_generated ON public.insight_digests USING btree (user_id, generated_at DESC);

CREATE INDEX idx_insight_digests_user_id ON public.insight_digests USING btree (user_id);

CREATE INDEX idx_problem_set_problems_problem_id ON public.problem_set_problems USING btree (problem_id);

CREATE INDEX idx_problem_set_problems_problem_set_id ON public.problem_set_problems USING btree (problem_set_id);

CREATE INDEX idx_problem_set_problems_user_id ON public.problem_set_problems USING btree (user_id);

CREATE INDEX idx_problem_set_shares_problem_set_id ON public.problem_set_shares USING btree (problem_set_id);

CREATE INDEX idx_problem_set_shares_shared_with_email ON public.problem_set_shares USING btree (shared_with_email);

CREATE INDEX idx_problem_sets_discovery_subject ON public.problem_sets USING btree (discovery_subject) WHERE ((sharing_level = 'public'::public.sharing_level) AND (is_listed = true) AND (discovery_subject IS NOT NULL));

CREATE INDEX idx_problem_sets_listed_public ON public.problem_sets USING btree (created_at DESC) WHERE ((sharing_level = 'public'::public.sharing_level) AND (is_listed = true));

CREATE INDEX idx_problem_sets_sharing_level ON public.problem_sets USING btree (sharing_level);

CREATE INDEX idx_problem_sets_subject_id ON public.problem_sets USING btree (subject_id);

CREATE INDEX idx_problem_sets_user_id ON public.problem_sets USING btree (user_id);

CREATE INDEX idx_problem_tag_tag_id ON public.problem_tag USING btree (tag_id);

CREATE INDEX idx_problems_answer_config ON public.problems USING gin (answer_config);

CREATE INDEX idx_problems_assets ON public.problems USING gin (assets jsonb_path_ops);

CREATE INDEX idx_problems_solution_assets ON public.problems USING gin (solution_assets jsonb_path_ops);

CREATE INDEX idx_problems_subject ON public.problems USING btree (subject_id);

CREATE INDEX idx_problems_user ON public.problems USING btree (user_id);

CREATE INDEX idx_ps_fts ON public.problem_sets USING gin (fts);

CREATE INDEX idx_psc_set_id ON public.problem_set_copies USING btree (problem_set_id);

CREATE INDEX idx_psf_user ON public.problem_set_favourites USING btree (user_id, created_at DESC);

CREATE INDEX idx_psh_problem_id ON public.problem_status_history USING btree (problem_id);

CREATE INDEX idx_psh_user_date ON public.problem_status_history USING btree (user_id, changed_date DESC);

CREATE INDEX idx_psl_set_id ON public.problem_set_likes USING btree (problem_set_id);

CREATE INDEX idx_psr_set_id ON public.problem_set_reports USING btree (problem_set_id);

CREATE INDEX idx_psr_status ON public.problem_set_reports USING btree (status) WHERE (status = 'pending'::text);

CREATE INDEX idx_pss_ranking ON public.problem_set_stats USING btree (ranking_score DESC, problem_set_id DESC);

CREATE UNIQUE INDEX idx_psv_dedup ON public.problem_set_views USING btree (problem_set_id, viewer_hash, time_bucket);

CREATE INDEX idx_psv_set_id ON public.problem_set_views USING btree (problem_set_id);

CREATE INDEX idx_qr_sessions_expires ON public.qr_upload_sessions USING btree (expires_at) WHERE (status = ANY (ARRAY['pending'::text, 'uploaded'::text]));

CREATE INDEX idx_qr_sessions_user_status ON public.qr_upload_sessions USING btree (user_id, status);

CREATE INDEX idx_review_next ON public.review_schedule USING btree (next_review_at);

CREATE INDEX idx_review_schedule_problem_id ON public.review_schedule USING btree (problem_id);

CREATE INDEX idx_review_session_results_problem ON public.review_session_results USING btree (problem_id);

CREATE INDEX idx_review_session_results_session ON public.review_session_results USING btree (session_state_id);

CREATE INDEX idx_review_session_state_problem_set ON public.review_session_state USING btree (problem_set_id);

CREATE INDEX idx_review_session_state_subject_id ON public.review_session_state USING btree (subject_id);

CREATE INDEX idx_review_session_state_user_active ON public.review_session_state USING btree (user_id, problem_set_id, is_active);

CREATE INDEX idx_subjects_user ON public.subjects USING btree (user_id);

CREATE INDEX idx_tags_subject ON public.tags USING btree (subject_id);

CREATE INDEX idx_usage_quotas_user_resource ON public.usage_quotas USING btree (user_id, resource_type, period_start);

CREATE INDEX idx_user_activity_log_action ON public.user_activity_log USING btree (action);

CREATE INDEX idx_user_activity_log_created_at ON public.user_activity_log USING btree (created_at);

CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log USING btree (user_id);

CREATE INDEX idx_user_profiles_active ON public.user_profiles USING btree (is_active);

CREATE INDEX idx_user_profiles_role ON public.user_profiles USING btree (user_role);

CREATE INDEX idx_user_profiles_username ON public.user_profiles USING btree (username);

CREATE INDEX idx_user_quota_overrides_user ON public.user_quota_overrides USING btree (user_id, resource_type);

CREATE UNIQUE INDEX insight_digests_pkey ON public.insight_digests USING btree (id);

CREATE UNIQUE INDEX problem_set_copies_pkey ON public.problem_set_copies USING btree (user_id, problem_set_id);

CREATE UNIQUE INDEX problem_set_favourites_pkey ON public.problem_set_favourites USING btree (user_id, problem_set_id);

CREATE UNIQUE INDEX problem_set_likes_pkey ON public.problem_set_likes USING btree (user_id, problem_set_id);

CREATE UNIQUE INDEX problem_set_problems_pkey ON public.problem_set_problems USING btree (id);

CREATE UNIQUE INDEX problem_set_problems_problem_set_id_problem_id_key ON public.problem_set_problems USING btree (problem_set_id, problem_id);

CREATE UNIQUE INDEX problem_set_reports_pkey ON public.problem_set_reports USING btree (id);

CREATE UNIQUE INDEX problem_set_reports_problem_set_id_reporter_user_id_key ON public.problem_set_reports USING btree (problem_set_id, reporter_user_id);

CREATE UNIQUE INDEX problem_set_shares_pkey ON public.problem_set_shares USING btree (id);

CREATE UNIQUE INDEX problem_set_shares_problem_set_id_shared_with_email_key ON public.problem_set_shares USING btree (problem_set_id, shared_with_email);

CREATE INDEX problem_set_shares_shared_by_user_id_idx ON public.problem_set_shares USING btree (shared_by_user_id);

CREATE UNIQUE INDEX problem_set_stats_pkey ON public.problem_set_stats USING btree (problem_set_id);

CREATE UNIQUE INDEX problem_set_views_pkey ON public.problem_set_views USING btree (id);

CREATE UNIQUE INDEX problem_sets_pkey ON public.problem_sets USING btree (id);

CREATE UNIQUE INDEX problem_status_history_pkey ON public.problem_status_history USING btree (id);

CREATE UNIQUE INDEX problem_status_history_problem_id_changed_date_key ON public.problem_status_history USING btree (problem_id, changed_date);

CREATE UNIQUE INDEX problem_tag_pkey ON public.problem_tag USING btree (problem_id, tag_id);

CREATE INDEX problem_tag_user_id_idx ON public.problem_tag USING btree (user_id);

CREATE INDEX problems_correct_answer_idx ON public.problems USING btree (correct_answer);

CREATE INDEX problems_last_reviewed_date_idx ON public.problems USING btree (last_reviewed_date);

CREATE UNIQUE INDEX problems_pkey ON public.problems USING btree (id);

CREATE INDEX problems_title_idx ON public.problems USING btree (title);

CREATE UNIQUE INDEX qr_upload_sessions_pkey ON public.qr_upload_sessions USING btree (id);

CREATE INDEX review_schedule_created_at_idx ON public.review_schedule USING btree (created_at);

CREATE INDEX review_schedule_ease_factor_idx ON public.review_schedule USING btree (ease_factor);

CREATE INDEX review_schedule_interval_days_idx ON public.review_schedule USING btree (interval_days);

CREATE INDEX review_schedule_last_reviewed_at_idx ON public.review_schedule USING btree (last_reviewed_at);

CREATE UNIQUE INDEX review_schedule_pkey ON public.review_schedule USING btree (id);

CREATE INDEX review_schedule_repetition_number_idx ON public.review_schedule USING btree (repetition_number);

CREATE INDEX review_schedule_updated_at_idx ON public.review_schedule USING btree (updated_at);

CREATE INDEX review_schedule_user_id_idx ON public.review_schedule USING btree (user_id);

CREATE UNIQUE INDEX review_schedule_user_id_problem_id_key ON public.review_schedule USING btree (user_id, problem_id);

CREATE UNIQUE INDEX review_session_results_pkey ON public.review_session_results USING btree (id);

CREATE INDEX review_session_state_created_at_idx ON public.review_session_state USING btree (created_at);

CREATE INDEX review_session_state_is_active_idx ON public.review_session_state USING btree (is_active);

CREATE INDEX review_session_state_last_activity_at_idx ON public.review_session_state USING btree (last_activity_at);

CREATE UNIQUE INDEX review_session_state_pkey ON public.review_session_state USING btree (id);

CREATE INDEX review_session_state_started_at_idx ON public.review_session_state USING btree (started_at);

CREATE INDEX review_session_state_user_id_idx ON public.review_session_state USING btree (user_id);

CREATE UNIQUE INDEX subjects_pkey ON public.subjects USING btree (id);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

CREATE UNIQUE INDEX tags_user_subject_name_unique ON public.tags USING btree (user_id, subject_id, name);

CREATE UNIQUE INDEX unique_attempt_categorisation ON public.error_categorisations USING btree (attempt_id);

CREATE UNIQUE INDEX usage_quotas_pkey ON public.usage_quotas USING btree (id);

CREATE UNIQUE INDEX usage_quotas_unique ON public.usage_quotas USING btree (user_id, resource_type, period_start);

CREATE UNIQUE INDEX user_activity_log_pkey ON public.user_activity_log USING btree (id);

CREATE INDEX user_profiles_onboarding_completed_at_idx ON public.user_profiles USING btree (onboarding_completed_at);

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);

CREATE UNIQUE INDEX user_profiles_username_key ON public.user_profiles USING btree (username);

CREATE UNIQUE INDEX user_quota_overrides_pkey ON public.user_quota_overrides USING btree (id);

CREATE UNIQUE INDEX user_quota_overrides_unique ON public.user_quota_overrides USING btree (user_id, resource_type);

alter table "public"."admin_settings" add constraint "admin_settings_pkey" PRIMARY KEY using index "admin_settings_pkey";

alter table "public"."attempts" add constraint "attempts_pkey" PRIMARY KEY using index "attempts_pkey";

alter table "public"."content_limit_overrides" add constraint "content_limit_overrides_pkey" PRIMARY KEY using index "content_limit_overrides_pkey";

alter table "public"."error_categorisations" add constraint "error_categorisations_pkey" PRIMARY KEY using index "error_categorisations_pkey";

alter table "public"."insight_digests" add constraint "insight_digests_pkey" PRIMARY KEY using index "insight_digests_pkey";

alter table "public"."problem_set_copies" add constraint "problem_set_copies_pkey" PRIMARY KEY using index "problem_set_copies_pkey";

alter table "public"."problem_set_favourites" add constraint "problem_set_favourites_pkey" PRIMARY KEY using index "problem_set_favourites_pkey";

alter table "public"."problem_set_likes" add constraint "problem_set_likes_pkey" PRIMARY KEY using index "problem_set_likes_pkey";

alter table "public"."problem_set_problems" add constraint "problem_set_problems_pkey" PRIMARY KEY using index "problem_set_problems_pkey";

alter table "public"."problem_set_reports" add constraint "problem_set_reports_pkey" PRIMARY KEY using index "problem_set_reports_pkey";

alter table "public"."problem_set_shares" add constraint "problem_set_shares_pkey" PRIMARY KEY using index "problem_set_shares_pkey";

alter table "public"."problem_set_stats" add constraint "problem_set_stats_pkey" PRIMARY KEY using index "problem_set_stats_pkey";

alter table "public"."problem_set_views" add constraint "problem_set_views_pkey" PRIMARY KEY using index "problem_set_views_pkey";

alter table "public"."problem_sets" add constraint "problem_sets_pkey" PRIMARY KEY using index "problem_sets_pkey";

alter table "public"."problem_status_history" add constraint "problem_status_history_pkey" PRIMARY KEY using index "problem_status_history_pkey";

alter table "public"."problem_tag" add constraint "problem_tag_pkey" PRIMARY KEY using index "problem_tag_pkey";

alter table "public"."problems" add constraint "problems_pkey" PRIMARY KEY using index "problems_pkey";

alter table "public"."qr_upload_sessions" add constraint "qr_upload_sessions_pkey" PRIMARY KEY using index "qr_upload_sessions_pkey";

alter table "public"."review_schedule" add constraint "review_schedule_pkey" PRIMARY KEY using index "review_schedule_pkey";

alter table "public"."review_session_results" add constraint "review_session_results_pkey" PRIMARY KEY using index "review_session_results_pkey";

alter table "public"."review_session_state" add constraint "review_session_state_pkey" PRIMARY KEY using index "review_session_state_pkey";

alter table "public"."subjects" add constraint "subjects_pkey" PRIMARY KEY using index "subjects_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."usage_quotas" add constraint "usage_quotas_pkey" PRIMARY KEY using index "usage_quotas_pkey";

alter table "public"."user_activity_log" add constraint "user_activity_log_pkey" PRIMARY KEY using index "user_activity_log_pkey";

alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey";

alter table "public"."user_quota_overrides" add constraint "user_quota_overrides_pkey" PRIMARY KEY using index "user_quota_overrides_pkey";

alter table "public"."admin_settings" add constraint "admin_settings_key_key" UNIQUE using index "admin_settings_key_key";

alter table "public"."admin_settings" add constraint "admin_settings_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."admin_settings" validate constraint "admin_settings_updated_by_fkey";

alter table "public"."attempts" add constraint "attempts_confidence_check" CHECK (((confidence IS NULL) OR ((confidence >= 1) AND (confidence <= 5)))) not valid;

alter table "public"."attempts" validate constraint "attempts_confidence_check";

alter table "public"."attempts" add constraint "attempts_problem_id_fkey" FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON DELETE CASCADE not valid;

alter table "public"."attempts" validate constraint "attempts_problem_id_fkey";

alter table "public"."attempts" add constraint "attempts_selected_status_check" CHECK (((selected_status)::text = ANY ((ARRAY['wrong'::character varying, 'needs_review'::character varying, 'mastered'::character varying])::text[]))) not valid;

alter table "public"."attempts" validate constraint "attempts_selected_status_check";

alter table "public"."attempts" add constraint "attempts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."attempts" validate constraint "attempts_user_id_fkey";

alter table "public"."content_limit_overrides" add constraint "content_limit_overrides_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."content_limit_overrides" validate constraint "content_limit_overrides_user_id_fkey";

alter table "public"."content_limit_overrides" add constraint "content_limit_overrides_user_id_resource_type_key" UNIQUE using index "content_limit_overrides_user_id_resource_type_key";

alter table "public"."error_categorisations" add constraint "error_categorisations_ai_confidence_check" CHECK (((ai_confidence >= (0)::double precision) AND (ai_confidence <= (1)::double precision))) not valid;

alter table "public"."error_categorisations" validate constraint "error_categorisations_ai_confidence_check";

alter table "public"."error_categorisations" add constraint "error_categorisations_attempt_id_fkey" FOREIGN KEY (attempt_id) REFERENCES public.attempts(id) ON DELETE CASCADE not valid;

alter table "public"."error_categorisations" validate constraint "error_categorisations_attempt_id_fkey";

alter table "public"."error_categorisations" add constraint "error_categorisations_broad_category_check" CHECK ((broad_category = ANY (ARRAY['conceptual_misunderstanding'::text, 'procedural_error'::text, 'knowledge_gap'::text, 'misread_question'::text, 'careless_mistake'::text, 'time_pressure'::text, 'incomplete_answer'::text]))) not valid;

alter table "public"."error_categorisations" validate constraint "error_categorisations_broad_category_check";

alter table "public"."error_categorisations" add constraint "error_categorisations_problem_id_fkey" FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON DELETE CASCADE not valid;

alter table "public"."error_categorisations" validate constraint "error_categorisations_problem_id_fkey";

alter table "public"."error_categorisations" add constraint "error_categorisations_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE not valid;

alter table "public"."error_categorisations" validate constraint "error_categorisations_subject_id_fkey";

alter table "public"."error_categorisations" add constraint "error_categorisations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."error_categorisations" validate constraint "error_categorisations_user_id_fkey";

alter table "public"."error_categorisations" add constraint "unique_attempt_categorisation" UNIQUE using index "unique_attempt_categorisation";

alter table "public"."insight_digests" add constraint "insight_digests_status_check" CHECK ((status = ANY (ARRAY['generating'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."insight_digests" validate constraint "insight_digests_status_check";

alter table "public"."insight_digests" add constraint "insight_digests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."insight_digests" validate constraint "insight_digests_user_id_fkey";

alter table "public"."problem_set_copies" add constraint "problem_set_copies_problem_set_id_fkey" FOREIGN KEY (problem_set_id) REFERENCES public.problem_sets(id) ON DELETE CASCADE not valid;

alter table "public"."problem_set_copies" validate constraint "problem_set_copies_problem_set_id_fkey";

alter table "public"."problem_set_copies" add constraint "problem_set_copies_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."problem_set_copies" validate constraint "problem_set_copies_user_id_fkey";

alter table "public"."problem_set_favourites" add constraint "problem_set_favourites_problem_set_id_fkey" FOREIGN KEY (problem_set_id) REFERENCES public.problem_sets(id) ON DELETE CASCADE not valid;

alter table "public"."problem_set_favourites" validate constraint "problem_set_favourites_problem_set_id_fkey";

alter table "public"."problem_set_favourites" add constraint "problem_set_favourites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."problem_set_favourites" validate constraint "problem_set_favourites_user_id_fkey";

alter table "public"."problem_set_likes" add constraint "problem_set_likes_problem_set_id_fkey" FOREIGN KEY (problem_set_id) REFERENCES public.problem_sets(id) ON DELETE CASCADE not valid;

alter table "public"."problem_set_likes" validate constraint "problem_set_likes_problem_set_id_fkey";

alter table "public"."problem_set_likes" add constraint "problem_set_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."problem_set_likes" validate constraint "problem_set_likes_user_id_fkey";

alter table "public"."problem_set_problems" add constraint "problem_set_problems_problem_id_fkey" FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON DELETE CASCADE not valid;

alter table "public"."problem_set_problems" validate constraint "problem_set_problems_problem_id_fkey";

alter table "public"."problem_set_problems" add constraint "problem_set_problems_problem_set_id_fkey" FOREIGN KEY (problem_set_id) REFERENCES public.problem_sets(id) ON DELETE CASCADE not valid;

alter table "public"."problem_set_problems" validate constraint "problem_set_problems_problem_set_id_fkey";

alter table "public"."problem_set_problems" add constraint "problem_set_problems_problem_set_id_problem_id_key" UNIQUE using index "problem_set_problems_problem_set_id_problem_id_key";

alter table "public"."problem_set_problems" add constraint "problem_set_problems_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."problem_set_problems" validate constraint "problem_set_problems_user_id_fkey";

alter table "public"."problem_set_reports" add constraint "problem_set_reports_problem_set_id_fkey" FOREIGN KEY (problem_set_id) REFERENCES public.problem_sets(id) ON DELETE CASCADE not valid;

alter table "public"."problem_set_reports" validate constraint "problem_set_reports_problem_set_id_fkey";

alter table "public"."problem_set_reports" add constraint "problem_set_reports_problem_set_id_reporter_user_id_key" UNIQUE using index "problem_set_reports_problem_set_id_reporter_user_id_key";

alter table "public"."problem_set_reports" add constraint "problem_set_reports_reporter_user_id_fkey" FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."problem_set_reports" validate constraint "problem_set_reports_reporter_user_id_fkey";

alter table "public"."problem_set_shares" add constraint "problem_set_shares_problem_set_id_fkey" FOREIGN KEY (problem_set_id) REFERENCES public.problem_sets(id) ON DELETE CASCADE not valid;

alter table "public"."problem_set_shares" validate constraint "problem_set_shares_problem_set_id_fkey";

alter table "public"."problem_set_shares" add constraint "problem_set_shares_problem_set_id_shared_with_email_key" UNIQUE using index "problem_set_shares_problem_set_id_shared_with_email_key";

alter table "public"."problem_set_shares" add constraint "problem_set_shares_shared_by_user_id_fkey" FOREIGN KEY (shared_by_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."problem_set_shares" validate constraint "problem_set_shares_shared_by_user_id_fkey";

alter table "public"."problem_set_stats" add constraint "problem_set_stats_problem_set_id_fkey" FOREIGN KEY (problem_set_id) REFERENCES public.problem_sets(id) ON DELETE CASCADE not valid;

alter table "public"."problem_set_stats" validate constraint "problem_set_stats_problem_set_id_fkey";

alter table "public"."problem_set_views" add constraint "problem_set_views_problem_set_id_fkey" FOREIGN KEY (problem_set_id) REFERENCES public.problem_sets(id) ON DELETE CASCADE not valid;

alter table "public"."problem_set_views" validate constraint "problem_set_views_problem_set_id_fkey";

alter table "public"."problem_set_views" add constraint "problem_set_views_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."problem_set_views" validate constraint "problem_set_views_user_id_fkey";

alter table "public"."problem_sets" add constraint "problem_sets_description_check" CHECK ((length(description) <= 1000)) not valid;

alter table "public"."problem_sets" validate constraint "problem_sets_description_check";

alter table "public"."problem_sets" add constraint "problem_sets_name_check" CHECK (((length(name) >= 1) AND (length(name) <= 50))) not valid;

alter table "public"."problem_sets" validate constraint "problem_sets_name_check";

alter table "public"."problem_sets" add constraint "problem_sets_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE not valid;

alter table "public"."problem_sets" validate constraint "problem_sets_subject_id_fkey";

alter table "public"."problem_sets" add constraint "problem_sets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."problem_sets" validate constraint "problem_sets_user_id_fkey";

alter table "public"."problem_status_history" add constraint "problem_status_history_problem_id_changed_date_key" UNIQUE using index "problem_status_history_problem_id_changed_date_key";

alter table "public"."problem_status_history" add constraint "problem_status_history_problem_id_fkey" FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON DELETE CASCADE not valid;

alter table "public"."problem_status_history" validate constraint "problem_status_history_problem_id_fkey";

alter table "public"."problem_status_history" add constraint "problem_status_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."problem_status_history" validate constraint "problem_status_history_user_id_fkey";

alter table "public"."problem_tag" add constraint "problem_tag_problem_id_fkey" FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON DELETE CASCADE not valid;

alter table "public"."problem_tag" validate constraint "problem_tag_problem_id_fkey";

alter table "public"."problem_tag" add constraint "problem_tag_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE not valid;

alter table "public"."problem_tag" validate constraint "problem_tag_tag_id_fkey";

alter table "public"."problem_tag" add constraint "problem_tag_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."problem_tag" validate constraint "problem_tag_user_id_fkey";

alter table "public"."problems" add constraint "check_answer_config_structure" CHECK (((answer_config IS NULL) OR (answer_config ? 'type'::text))) not valid;

alter table "public"."problems" validate constraint "check_answer_config_structure";

alter table "public"."problems" add constraint "problems_problem_type_check" CHECK ((problem_type = ANY (ARRAY['mcq'::public.problem_type_enum, 'short'::public.problem_type_enum, 'extended'::public.problem_type_enum]))) not valid;

alter table "public"."problems" validate constraint "problems_problem_type_check";

alter table "public"."problems" add constraint "problems_status_check" CHECK ((status = ANY (ARRAY['wrong'::public.problem_status_enum, 'needs_review'::public.problem_status_enum, 'mastered'::public.problem_status_enum]))) not valid;

alter table "public"."problems" validate constraint "problems_status_check";

alter table "public"."problems" add constraint "problems_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE not valid;

alter table "public"."problems" validate constraint "problems_subject_id_fkey";

alter table "public"."problems" add constraint "problems_title_not_empty" CHECK ((length(TRIM(BOTH FROM title)) > 0)) not valid;

alter table "public"."problems" validate constraint "problems_title_not_empty";

alter table "public"."problems" add constraint "problems_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."problems" validate constraint "problems_user_id_fkey";

alter table "public"."qr_upload_sessions" add constraint "qr_upload_sessions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'uploaded'::text, 'consumed'::text, 'expired'::text]))) not valid;

alter table "public"."qr_upload_sessions" validate constraint "qr_upload_sessions_status_check";

alter table "public"."qr_upload_sessions" add constraint "qr_upload_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."qr_upload_sessions" validate constraint "qr_upload_sessions_user_id_fkey";

alter table "public"."review_schedule" add constraint "review_schedule_problem_id_fkey" FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON DELETE CASCADE not valid;

alter table "public"."review_schedule" validate constraint "review_schedule_problem_id_fkey";

alter table "public"."review_schedule" add constraint "review_schedule_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."review_schedule" validate constraint "review_schedule_user_id_fkey";

alter table "public"."review_schedule" add constraint "review_schedule_user_id_problem_id_key" UNIQUE using index "review_schedule_user_id_problem_id_key";

alter table "public"."review_session_results" add constraint "review_session_results_problem_id_fkey" FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON DELETE CASCADE not valid;

alter table "public"."review_session_results" validate constraint "review_session_results_problem_id_fkey";

alter table "public"."review_session_results" add constraint "review_session_results_session_state_id_fkey" FOREIGN KEY (session_state_id) REFERENCES public.review_session_state(id) ON DELETE CASCADE not valid;

alter table "public"."review_session_results" validate constraint "review_session_results_session_state_id_fkey";

alter table "public"."review_session_state" add constraint "review_session_state_problem_set_id_fkey" FOREIGN KEY (problem_set_id) REFERENCES public.problem_sets(id) ON DELETE CASCADE not valid;

alter table "public"."review_session_state" validate constraint "review_session_state_problem_set_id_fkey";

alter table "public"."review_session_state" add constraint "review_session_state_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL not valid;

alter table "public"."review_session_state" validate constraint "review_session_state_subject_id_fkey";

alter table "public"."review_session_state" add constraint "review_session_state_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."review_session_state" validate constraint "review_session_state_user_id_fkey";

alter table "public"."review_session_state" add constraint "session_type_check" CHECK ((((session_type = 'problem_set'::text) AND (problem_set_id IS NOT NULL)) OR ((session_type = 'spaced_repetition'::text) AND (subject_id IS NOT NULL)) OR ((session_type = 'insights_review'::text) AND (subject_id IS NOT NULL)))) not valid;

alter table "public"."review_session_state" validate constraint "session_type_check";

alter table "public"."subjects" add constraint "subjects_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."subjects" validate constraint "subjects_user_id_fkey";

alter table "public"."tags" add constraint "tags_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE not valid;

alter table "public"."tags" validate constraint "tags_subject_id_fkey";

alter table "public"."tags" add constraint "tags_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."tags" validate constraint "tags_user_id_fkey";

alter table "public"."tags" add constraint "tags_user_subject_name_unique" UNIQUE using index "tags_user_subject_name_unique";

alter table "public"."usage_quotas" add constraint "usage_quotas_unique" UNIQUE using index "usage_quotas_unique";

alter table "public"."usage_quotas" add constraint "usage_quotas_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."usage_quotas" validate constraint "usage_quotas_user_id_fkey";

alter table "public"."user_activity_log" add constraint "user_activity_log_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_activity_log" validate constraint "user_activity_log_user_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_gender_check" CHECK ((gender = ANY (ARRAY[('male'::character varying)::text, ('female'::character varying)::text, ('other'::character varying)::text, ('prefer_not_to_say'::character varying)::text]))) not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_gender_check";

alter table "public"."user_profiles" add constraint "user_profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_user_role_check" CHECK (((user_role)::text = ANY ((ARRAY['user'::character varying, 'moderator'::character varying, 'admin'::character varying, 'super_admin'::character varying])::text[]))) not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_user_role_check";

alter table "public"."user_profiles" add constraint "user_profiles_username_key" UNIQUE using index "user_profiles_username_key";

alter table "public"."user_quota_overrides" add constraint "user_quota_overrides_daily_limit_check" CHECK ((daily_limit > 0)) not valid;

alter table "public"."user_quota_overrides" validate constraint "user_quota_overrides_daily_limit_check";

alter table "public"."user_quota_overrides" add constraint "user_quota_overrides_unique" UNIQUE using index "user_quota_overrides_unique";

alter table "public"."user_quota_overrides" add constraint "user_quota_overrides_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_quota_overrides" validate constraint "user_quota_overrides_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.can_view_problem(p_problem_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  WITH requester AS (
    SELECT
      auth.uid() AS uid,
      COALESCE(NULLIF(auth.jwt()->>'email',''),'__noemail__') AS email
  )
  SELECT
    -- Owner can always see
    EXISTS (
      SELECT 1
      FROM public.problems pr, requester r
      WHERE pr.id = p_problem_id
        AND pr.user_id = r.uid
    )
    OR
    -- Public via any manual problem set that includes this problem
    EXISTS (
      SELECT 1
      FROM public.problem_set_problems psp
      JOIN public.problem_sets ps ON ps.id = psp.problem_set_id
      WHERE psp.problem_id = p_problem_id
        AND ps.sharing_level = 'public'::sharing_level
    )
    OR
    -- Limited via email match on manual problem sets
    EXISTS (
      SELECT 1
      FROM public.problem_set_problems psp
      JOIN public.problem_sets ps  ON ps.id = psp.problem_set_id
      JOIN public.problem_set_shares pss ON pss.problem_set_id = ps.id
      JOIN requester r ON TRUE
      WHERE psp.problem_id = p_problem_id
        AND ps.sharing_level = 'limited'::sharing_level
        AND lower(pss.shared_with_email) = lower(r.email)
    )
    OR
    -- Public via smart problem set in the same subject as the problem's owner
    EXISTS (
      SELECT 1
      FROM public.problems pr
      JOIN public.problem_sets ps
        ON ps.subject_id = pr.subject_id
        AND ps.user_id = pr.user_id
      WHERE pr.id = p_problem_id
        AND ps.is_smart = true
        AND ps.sharing_level = 'public'::sharing_level
    )
    OR
    -- Limited via smart problem set in the same subject with email match
    EXISTS (
      SELECT 1
      FROM public.problems pr
      JOIN public.problem_sets ps
        ON ps.subject_id = pr.subject_id
        AND ps.user_id = pr.user_id
      JOIN public.problem_set_shares pss ON pss.problem_set_id = ps.id
      JOIN requester r ON TRUE
      WHERE pr.id = p_problem_id
        AND ps.is_smart = true
        AND ps.sharing_level = 'limited'::sharing_level
        AND lower(pss.shared_with_email) = lower(r.email)
    );
$function$
;

CREATE OR REPLACE FUNCTION public.check_and_increment_quota(p_user_id uuid, p_resource_type text, p_default_limit integer, p_user_tz text DEFAULT 'UTC'::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_effective_limit INT;
  v_current_usage INT;
  v_today DATE;
BEGIN
  v_today := user_today(p_user_tz);

  SELECT COALESCE(
    (SELECT daily_limit FROM user_quota_overrides
     WHERE user_id = p_user_id AND resource_type = p_resource_type),
    p_default_limit
  ) INTO v_effective_limit;

  INSERT INTO usage_quotas (user_id, resource_type, period_start, usage_count)
  VALUES (p_user_id, p_resource_type, v_today, 1)
  ON CONFLICT (user_id, resource_type, period_start)
  DO UPDATE SET usage_count = usage_quotas.usage_count + 1,
               updated_at = now()
  RETURNING usage_count INTO v_current_usage;

  IF v_current_usage > v_effective_limit THEN
    UPDATE usage_quotas
    SET usage_count = usage_count - 1
    WHERE user_id = p_user_id
      AND resource_type = p_resource_type
      AND period_start = v_today;

    v_current_usage := v_current_usage - 1;

    RETURN json_build_object(
      'allowed', false,
      'current_usage', v_current_usage,
      'daily_limit', v_effective_limit,
      'remaining', 0
    );
  END IF;

  RETURN json_build_object(
    'allowed', true,
    'current_usage', v_current_usage,
    'daily_limit', v_effective_limit,
    'remaining', GREATEST(v_effective_limit - v_current_usage, 0)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.compute_problem_set_count(p_problem_set_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_ps record;
  v_count integer;
BEGIN
  SELECT * INTO v_ps FROM problem_sets WHERE id = p_problem_set_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF v_ps.is_smart THEN
    SELECT COUNT(*)::integer INTO v_count
    FROM problems p
    WHERE p.user_id = v_ps.user_id
      AND p.subject_id = v_ps.subject_id
      AND (
        jsonb_array_length(COALESCE(v_ps.filter_config->'statuses', '[]'::jsonb)) = 0
        OR p.status::text IN (SELECT jsonb_array_elements_text(v_ps.filter_config->'statuses'))
      )
      AND (
        jsonb_array_length(COALESCE(v_ps.filter_config->'problem_types', '[]'::jsonb)) = 0
        OR p.problem_type::text IN (SELECT jsonb_array_elements_text(v_ps.filter_config->'problem_types'))
      )
      AND (
        jsonb_array_length(COALESCE(v_ps.filter_config->'tag_ids', '[]'::jsonb)) = 0
        OR EXISTS (
          SELECT 1 FROM problem_tag pt
          WHERE pt.problem_id = p.id
            AND pt.tag_id::text IN (SELECT jsonb_array_elements_text(v_ps.filter_config->'tag_ids'))
        )
      )
      AND (
        (v_ps.filter_config->>'days_since_review') IS NULL
        OR p.last_reviewed_date < now() - ((v_ps.filter_config->>'days_since_review')::int * interval '1 day')
        OR (p.last_reviewed_date IS NULL AND COALESCE((v_ps.filter_config->>'include_never_reviewed')::boolean, true))
      );
  ELSE
    SELECT COUNT(*)::integer INTO v_count
    FROM problem_set_problems
    WHERE problem_set_id = p_problem_set_id;
  END IF;

  RETURN v_count;
END;
$function$
;

create or replace view "public"."discoverable_problem_sets" as  SELECT ps.id,
    ps.user_id,
    ps.name,
    ps.description,
    ps.is_smart,
    ps.created_at,
    ps.discovery_subject,
    ps.fts,
    pss.view_count,
    pss.unique_view_count,
    pss.like_count,
    pss.copy_count,
    pss.problem_count,
    pss.ranking_score
   FROM (public.problem_sets ps
     JOIN public.problem_set_stats pss ON ((pss.problem_set_id = ps.id)))
  WHERE ((ps.sharing_level = 'public'::public.sharing_level) AND (ps.is_listed = true) AND (pss.problem_count > 0));


CREATE OR REPLACE FUNCTION public.ensure_problem_set_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_count integer;
BEGIN
  -- Only act when sharing_level is public or limited
  IF NEW.sharing_level NOT IN ('public', 'limited') THEN
    RETURN NEW;
  END IF;

  -- On UPDATE, skip if sharing_level hasn't changed and set was already non-private
  -- (stats row already exists; cron handles periodic refresh)
  IF TG_OP = 'UPDATE'
    AND OLD.sharing_level IN ('public', 'limited')
    AND NEW.sharing_level = OLD.sharing_level
  THEN
    RETURN NEW;
  END IF;

  -- Compute count once (only reached on first publish or sharing_level change)
  v_count := compute_problem_set_count(NEW.id);

  INSERT INTO problem_set_stats (problem_set_id, problem_count)
  VALUES (NEW.id, v_count)
  ON CONFLICT (problem_set_id) DO NOTHING;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.find_problem_by_asset(p_path text)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id
  FROM public.problems
  WHERE assets @> jsonb_build_array(jsonb_build_object('path', p_path))
     OR solution_assets @> jsonb_build_array(jsonb_build_object('path', p_path))
  ORDER BY
    -- Prefer the problem whose owner matches the user in the file path
    CASE WHEN user_id::text = split_part(p_path, '/', 2) THEN 0 ELSE 1 END
  LIMIT 1
$function$
;

CREATE OR REPLACE FUNCTION public.generate_username_from_email(p_email text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_prefix text;
  v_candidate text;
  v_attempt int := 0;
BEGIN
  -- Extract prefix before @, strip non-alphanumeric, lowercase
  v_prefix := lower(regexp_replace(split_part(p_email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));

  -- Ensure prefix is at least 3 chars
  IF length(v_prefix) < 3 THEN
    v_prefix := v_prefix || 'user';
  END IF;

  -- Truncate to leave room for suffix
  v_prefix := left(v_prefix, 20);

  -- Try up to 5 times with random 4-digit suffix
  LOOP
    v_attempt := v_attempt + 1;
    v_candidate := v_prefix || lpad(floor(random() * 10000)::text, 4, '0');

    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE username = v_candidate) THEN
      RETURN v_candidate;
    END IF;

    IF v_attempt >= 5 THEN
      -- Fallback: use first 8 chars of UUID
      RETURN v_prefix || left(replace(gen_random_uuid()::text, '-', ''), 8);
    END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_activity_heatmap(p_user_id uuid, p_user_tz text DEFAULT 'UTC'::text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_today DATE;
BEGIN
  v_today := user_today(p_user_tz);

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT activity_date, SUM(activity_count)::int AS activity_count
      FROM (
        SELECT to_user_date(p.created_at, p_user_tz) AS activity_date,
               COUNT(*)::int AS activity_count
        FROM problems p
        WHERE p.user_id = p_user_id
          AND to_user_date(p.created_at, p_user_tz) >= v_today - 179
        GROUP BY 1

        UNION ALL

        SELECT to_user_date(rsr.completed_at, p_user_tz) AS activity_date,
               COUNT(*)::int AS activity_count
        FROM review_session_results rsr
        JOIN review_session_state rss ON rss.id = rsr.session_state_id
        WHERE rss.user_id = p_user_id
          AND rsr.completed_at IS NOT NULL
          AND to_user_date(rsr.completed_at, p_user_tz) >= v_today - 179
        GROUP BY 1

        UNION ALL

        SELECT psh.changed_date AS activity_date,
               COUNT(*)::int AS activity_count
        FROM problem_status_history psh
        WHERE psh.user_id = p_user_id
          AND psh.changed_date >= v_today - 179
        GROUP BY 1
      ) sub
      GROUP BY activity_date
      ORDER BY activity_date
    ) t
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_activity_summary(p_user_id uuid)
 RETURNS TABLE(total_problems bigint, total_attempts bigint, total_subjects bigint, problems_with_errors bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT
    COALESCE(COUNT(DISTINCT p.id), 0) AS total_problems,
    COALESCE(COUNT(DISTINCT a.id), 0) AS total_attempts,
    COALESCE(COUNT(DISTINCT p.subject_id), 0) AS total_subjects,
    COALESCE(COUNT(DISTINCT ec.problem_id), 0) AS problems_with_errors
  FROM problems p
    INNER JOIN attempts a ON a.problem_id = p.id
    LEFT JOIN error_categorisations ec
      ON ec.problem_id = p.id AND ec.user_id = p_user_id
  WHERE p.user_id = p_user_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_discovery_subject_counts()
 RETURNS TABLE(name text, count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT d.discovery_subject, COUNT(*)::bigint
  FROM discoverable_problem_sets d
  WHERE d.discovery_subject IS NOT NULL
  GROUP BY d.discovery_subject
  ORDER BY COUNT(*) DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_due_problems_count()
 RETURNS TABLE(subject_id uuid, due_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT p.subject_id, COUNT(*) as due_count
  FROM review_schedule rs
  JOIN problems p ON p.id = rs.problem_id
  WHERE rs.user_id = auth.uid()
    AND rs.next_review_at <= now()
  GROUP BY p.subject_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_due_problems_for_subject(p_subject_id uuid, p_limit integer DEFAULT 20)
 RETURNS SETOF public.problems
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT p.*
  FROM review_schedule rs
  JOIN problems p ON p.id = rs.problem_id
  WHERE rs.user_id = auth.uid()
    AND p.subject_id = p_subject_id
    AND rs.next_review_at <= now()
  ORDER BY rs.next_review_at ASC
  LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.get_error_aggregation_data(p_user_id uuid)
 RETURNS TABLE(categorisation_id uuid, attempt_id uuid, problem_id uuid, subject_id uuid, subject_name text, broad_category text, granular_tag text, topic_label text, topic_label_normalised text, ai_confidence real, is_user_override boolean, problem_status text, problem_title text, attempt_created_at timestamp with time zone, categorisation_created_at timestamp with time zone, attempt_selected_status text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ec.id AS categorisation_id,
    ec.attempt_id,
    ec.problem_id,
    ec.subject_id,
    s.name AS subject_name,
    ec.broad_category,
    ec.granular_tag,
    ec.topic_label,
    ec.topic_label_normalised,
    ec.ai_confidence,
    ec.is_user_override,
    p.status::text AS problem_status,
    p.title AS problem_title,
    a.created_at AS attempt_created_at,
    ec.created_at AS categorisation_created_at,
    a.selected_status::text AS attempt_selected_status
  FROM error_categorisations ec
  JOIN problems p ON p.id = ec.problem_id AND p.user_id = p_user_id
  JOIN subjects s ON s.id = ec.subject_id AND s.user_id = p_user_id
  JOIN attempts a ON a.id = ec.attempt_id AND a.user_id = p_user_id
  WHERE ec.user_id = p_user_id
  ORDER BY a.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_problem_set_progress(problem_set_uuid uuid, user_uuid uuid)
 RETURNS TABLE(total_problems bigint, wrong_count bigint, needs_review_count bigint, mastered_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(psp.problem_id) as total_problems,
        COUNT(CASE WHEN p.status = 'wrong' THEN 1 END) as wrong_count,
        COUNT(CASE WHEN p.status = 'needs_review' THEN 1 END) as needs_review_count,
        COUNT(CASE WHEN p.status = 'mastered' THEN 1 END) as mastered_count
    FROM problem_set_problems psp
    JOIN problems p ON p.id = psp.problem_id
    WHERE psp.problem_set_id = problem_set_uuid
    AND psp.user_id = user_uuid;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_recent_study_activity(p_user_id uuid)
 RETURNS TABLE(problem_id uuid, problem_title text, subject_name text, old_status text, new_status text, changed_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    psh.problem_id,
    p.title AS problem_title,
    s.name AS subject_name,
    psh.old_status,
    psh.new_status,
    psh.changed_at
  FROM problem_status_history psh
  JOIN problems p ON p.id = psh.problem_id
  JOIN subjects s ON s.id = p.subject_id
  WHERE psh.user_id = p_user_id
  ORDER BY psh.changed_at DESC
  LIMIT 5;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_session_statistics(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_sessions', COUNT(*),
    'avg_duration_ms', COALESCE(AVG((session_state->>'elapsed_ms')::bigint), 0)::bigint,
    'avg_problems_per_session', COALESCE(
      AVG(jsonb_array_length(session_state->'completed_problem_ids') +
          jsonb_array_length(session_state->'skipped_problem_ids')), 0
    )::numeric(10,1),
    'total_review_time_ms', COALESCE(SUM((session_state->>'elapsed_ms')::bigint), 0)::bigint
  ) INTO result
  FROM review_session_state
  WHERE user_id = p_user_id AND is_active = false;

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_study_streaks(p_user_id uuid, p_user_tz text DEFAULT 'UTC'::text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_current_streak INT := 0;
  v_longest_streak INT := 0;
  v_streak INT := 0;
  v_prev_date DATE := NULL;
  v_today DATE;
  rec RECORD;
BEGIN
  v_today := user_today(p_user_tz);

  FOR rec IN
    SELECT DISTINCT activity_date
    FROM (
      SELECT to_user_date(p.created_at, p_user_tz) AS activity_date
      FROM problems p
      WHERE p.user_id = p_user_id

      UNION

      SELECT to_user_date(rsr.completed_at, p_user_tz) AS activity_date
      FROM review_session_results rsr
      JOIN review_session_state rss ON rss.id = rsr.session_state_id
      WHERE rss.user_id = p_user_id
        AND rsr.completed_at IS NOT NULL

      UNION

      SELECT psh.changed_date AS activity_date
      FROM problem_status_history psh
      WHERE psh.user_id = p_user_id
    ) all_dates
    ORDER BY activity_date DESC
  LOOP
    IF v_prev_date IS NULL THEN
      IF rec.activity_date >= v_today - 1 THEN
        v_streak := 1;
      ELSE
        v_streak := 1;
        v_longest_streak := GREATEST(v_longest_streak, v_streak);
        v_streak := 0;
        v_prev_date := rec.activity_date;
        CONTINUE;
      END IF;
    ELSIF v_prev_date - rec.activity_date = 1 THEN
      v_streak := v_streak + 1;
    ELSE
      IF v_current_streak = 0 AND v_prev_date >= v_today - 1 THEN
        v_current_streak := v_streak;
      END IF;
      v_longest_streak := GREATEST(v_longest_streak, v_streak);
      v_streak := 1;
    END IF;

    v_prev_date := rec.activity_date;
  END LOOP;

  IF v_streak > 0 THEN
    IF v_current_streak = 0 AND (v_prev_date IS NULL OR v_prev_date >= v_today - 1) THEN
      v_current_streak := v_streak;
    END IF;
    v_longest_streak := GREATEST(v_longest_streak, v_streak);
  END IF;

  IF v_current_streak = 0 AND v_prev_date = v_today THEN
    v_current_streak := v_streak;
  END IF;

  RETURN json_build_object(
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_subject_breakdown(p_user_id uuid)
 RETURNS TABLE(subject_id uuid, subject_name text, total bigint, mastered bigint, needs_review bigint, wrong bigint, mastery_pct numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS subject_id,
    s.name AS subject_name,
    COUNT(p.id) AS total,
    COUNT(p.id) FILTER (WHERE p.status = 'mastered') AS mastered,
    COUNT(p.id) FILTER (WHERE p.status = 'needs_review') AS needs_review,
    COUNT(p.id) FILTER (WHERE p.status = 'wrong') AS wrong,
    CASE
      WHEN COUNT(p.id) = 0 THEN 0
      ELSE ROUND((COUNT(p.id) FILTER (WHERE p.status = 'mastered')::numeric / COUNT(p.id)) * 100, 1)
    END AS mastery_pct
  FROM subjects s
  LEFT JOIN problems p ON p.subject_id = s.id AND p.user_id = p_user_id
  WHERE s.user_id = p_user_id
  GROUP BY s.id, s.name
  ORDER BY total DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_subjects_with_metadata()
 RETURNS TABLE(id uuid, user_id uuid, name text, color text, icon text, created_at timestamp with time zone, problem_count bigint, last_activity timestamp with time zone, due_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT
    s.id,
    s.user_id,
    s.name,
    s.color,
    s.icon,
    s.created_at,
    COALESCE(COUNT(p.id), 0)::bigint as problem_count,
    MAX(p.last_reviewed_date) as last_activity,
    COALESCE(due.cnt, 0)::bigint as due_count
  FROM subjects s
  LEFT JOIN problems p ON p.subject_id = s.id
  LEFT JOIN (
    SELECT p2.subject_id, COUNT(*)::bigint AS cnt
    FROM review_schedule rs
    JOIN problems p2 ON p2.id = rs.problem_id
    WHERE rs.user_id = auth.uid() AND rs.next_review_at <= now()
    GROUP BY p2.subject_id
  ) due ON due.subject_id = s.id
  WHERE s.user_id = auth.uid()
  GROUP BY s.id, s.user_id, s.name, s.color, s.icon, s.created_at, due.cnt
  ORDER BY s.created_at ASC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_uncategorised_attempts(p_user_id uuid, p_limit integer)
 RETURNS TABLE(attempt_id uuid, problem_id uuid, subject_id uuid, submitted_answer jsonb, is_correct boolean, cause text, reflection_notes text, selected_status text, attempt_created_at timestamp with time zone, problem_title text, problem_content text, problem_type text, correct_answer text, subject_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS attempt_id,
    a.problem_id,
    p.subject_id,
    to_jsonb(a.submitted_answer) AS submitted_answer,
    a.is_correct,
    a.cause,
    a.reflection_notes,
    a.selected_status::text,
    a.created_at AS attempt_created_at,
    p.title AS problem_title,
    p.content AS problem_content,
    p.problem_type::text,
    p.correct_answer,
    s.name AS subject_name
  FROM attempts a
  JOIN problems p ON p.id = a.problem_id AND p.user_id = p_user_id
  JOIN subjects s ON s.id = p.subject_id AND s.user_id = p_user_id
  LEFT JOIN error_categorisations ec ON ec.attempt_id = a.id
  WHERE a.user_id = p_user_id
    AND ec.id IS NULL
    AND a.selected_status IN ('wrong', 'needs_review')
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_unreferenced_asset_paths(p_paths text[], p_exclude_problem_id uuid)
 RETURNS text[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(array_agg(path), '{}')
  FROM unnest(p_paths) AS path
  WHERE NOT EXISTS (
    SELECT 1 FROM problems
    WHERE id != p_exclude_problem_id
      AND (
        assets @> jsonb_build_array(jsonb_build_object('path', path))
        OR solution_assets @> jsonb_build_array(jsonb_build_object('path', path))
      )
  )
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_statistics()
 RETURNS TABLE(total_users bigint, active_users bigint, admin_users bigint, new_users_today bigint, new_users_this_week bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE user_role IN ('admin', 'super_admin')) as admin_users,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as new_users_today,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_this_week
    FROM public.user_profiles;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_statistics(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_problems', COUNT(*),
    'mastered_count', COUNT(*) FILTER (WHERE status = 'mastered'),
    'needs_review_count', COUNT(*) FILTER (WHERE status = 'needs_review'),
    'wrong_count', COUNT(*) FILTER (WHERE status = 'wrong'),
    'mastery_rate', CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE status = 'mastered')::numeric / COUNT(*)) * 100, 1)
    END
  ) INTO result
  FROM problems
  WHERE user_id = p_user_id;

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_storage_bytes(p_user_id uuid)
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT COALESCE(sum((metadata->>'size')::bigint), 0)
  FROM storage.objects
  WHERE owner_id = p_user_id::text;
$function$
;

CREATE OR REPLACE FUNCTION public.get_weekly_progress(p_user_id uuid, p_user_tz text DEFAULT 'UTC'::text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_today DATE;
BEGIN
  v_today := user_today(p_user_tz);

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        week_start,
        SUM(mastered_count) OVER (ORDER BY week_start) AS cumulative_mastered
      FROM (
        SELECT
          date_trunc('week', psh.changed_date)::date AS week_start,
          COUNT(*) FILTER (WHERE psh.new_status = 'mastered')::int AS mastered_count
        FROM problem_status_history psh
        WHERE psh.user_id = p_user_id
          AND psh.changed_date >= v_today - 83
        GROUP BY 1
      ) weekly
      ORDER BY week_start
    ) t
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, username, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'username', ''),
      generate_username_from_email(COALESCE(NEW.email, NEW.id::text))
    ),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_copy_count(p_problem_set_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO problem_set_stats (problem_set_id, copy_count)
  VALUES (p_problem_set_id, 1)
  ON CONFLICT (problem_set_id)
  DO UPDATE SET copy_count = problem_set_stats.copy_count + 1, updated_at = now();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_user_activity(p_action character varying, p_resource_type character varying DEFAULT NULL::character varying, p_resource_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO public.user_activity_log (
        user_id, action, resource_type, resource_id, details
    ) VALUES (
        auth.uid(), p_action, p_resource_type, p_resource_id, p_details
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_problem_set_copy(p_problem_set_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_inserted boolean;
BEGIN
  -- Insert copy record (idempotent per user per set)
  INSERT INTO problem_set_copies (user_id, problem_set_id)
  VALUES (p_user_id, p_problem_set_id)
  ON CONFLICT (user_id, problem_set_id) DO NOTHING
  RETURNING true INTO v_inserted;

  -- Only increment if this is a new unique copy
  IF v_inserted THEN
    INSERT INTO problem_set_stats (problem_set_id, copy_count)
    VALUES (p_problem_set_id, 1)
    ON CONFLICT (problem_set_id)
    DO UPDATE SET copy_count = problem_set_stats.copy_count + 1,
                  updated_at = now();
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_problem_set_view(p_problem_set_id uuid, p_viewer_hash text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_bucket timestamptz;
  v_inserted boolean;
BEGIN
  v_bucket := date_trunc('hour', now())
    + (floor(extract(minute from now()) / 15) * interval '15 min');

  INSERT INTO problem_set_views (problem_set_id, viewer_hash, user_id, time_bucket)
  VALUES (p_problem_set_id, p_viewer_hash, p_user_id, v_bucket)
  ON CONFLICT (problem_set_id, viewer_hash, time_bucket) DO NOTHING
  RETURNING true INTO v_inserted;

  IF v_inserted THEN
    INSERT INTO problem_set_stats (problem_set_id, view_count, unique_view_count)
    VALUES (p_problem_set_id, 1, 1)
    ON CONFLICT (problem_set_id)
    DO UPDATE SET view_count = problem_set_stats.view_count + 1,
                  unique_view_count = problem_set_stats.unique_view_count + 1,
                  updated_at = now();
  ELSE
    INSERT INTO problem_set_stats (problem_set_id, view_count)
    VALUES (p_problem_set_id, 1)
    ON CONFLICT (problem_set_id)
    DO UPDATE SET view_count = problem_set_stats.view_count + 1,
                  updated_at = now();
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_ranking_scores()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Update problem_count for manual sets (from junction table)
  UPDATE problem_set_stats s
  SET problem_count = COALESCE(sub.cnt, 0)
  FROM problem_sets ps
  LEFT JOIN (
    SELECT problem_set_id, COUNT(*)::integer AS cnt
    FROM problem_set_problems
    GROUP BY problem_set_id
  ) sub ON sub.problem_set_id = ps.id
  WHERE s.problem_set_id = ps.id
    AND ps.is_smart = false
    AND ps.sharing_level = 'public';

  -- Update problem_count for smart sets (accurate filter_config evaluation)
  UPDATE problem_set_stats s
  SET problem_count = (
    SELECT COUNT(*)::integer
    FROM problems p
    WHERE p.user_id = ps.user_id
      AND p.subject_id = ps.subject_id
      -- Status filter: empty array = no filter
      AND (
        jsonb_array_length(COALESCE(ps.filter_config->'statuses', '[]'::jsonb)) = 0
        OR p.status::text IN (
          SELECT jsonb_array_elements_text(ps.filter_config->'statuses')
        )
      )
      -- Problem type filter: empty array = no filter
      AND (
        jsonb_array_length(COALESCE(ps.filter_config->'problem_types', '[]'::jsonb)) = 0
        OR p.problem_type::text IN (
          SELECT jsonb_array_elements_text(ps.filter_config->'problem_types')
        )
      )
      -- Tag filter: empty array = no filter
      AND (
        jsonb_array_length(COALESCE(ps.filter_config->'tag_ids', '[]'::jsonb)) = 0
        OR EXISTS (
          SELECT 1 FROM problem_tag pt
          WHERE pt.problem_id = p.id
            AND pt.tag_id::text IN (
              SELECT jsonb_array_elements_text(ps.filter_config->'tag_ids')
            )
        )
      )
      -- Days since review filter
      AND (
        (ps.filter_config->>'days_since_review') IS NULL
        OR (
          p.last_reviewed_date < now() - ((ps.filter_config->>'days_since_review')::int * interval '1 day')
        )
        OR (
          p.last_reviewed_date IS NULL
          AND COALESCE((ps.filter_config->>'include_never_reviewed')::boolean, true)
        )
      )
  )
  FROM problem_sets ps
  WHERE s.problem_set_id = ps.id
    AND ps.is_smart = true
    AND ps.sharing_level = 'public';

  -- Update ranking scores
  UPDATE problem_set_stats s
  SET ranking_score = (
    (s.like_count * 3) + (s.copy_count * 5) + (s.unique_view_count * 0.5)
  ) * (1.0 / (1.0 + EXTRACT(EPOCH FROM (now() - ps.created_at)) / 2592000.0)),
  updated_at = now()
  FROM problem_sets ps
  WHERE s.problem_set_id = ps.id
    AND ps.sharing_level = 'public'
    AND ps.is_listed = true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.to_user_date(p_ts timestamp with time zone, p_tz text DEFAULT 'UTC'::text)
 RETURNS date
 LANGUAGE sql
 STABLE
AS $function$ SELECT (p_ts AT TIME ZONE p_tz)::date; $function$
;

CREATE OR REPLACE FUNCTION public.toggle_problem_set_like(p_problem_set_id uuid, p_user_id uuid)
 RETURNS TABLE(liked boolean, like_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_existed boolean;
  v_new_count bigint;
BEGIN
  DELETE FROM problem_set_likes
  WHERE user_id = p_user_id AND problem_set_id = p_problem_set_id
  RETURNING true INTO v_existed;

  IF v_existed THEN
    UPDATE problem_set_stats
    SET like_count = GREATEST(problem_set_stats.like_count - 1, 0), updated_at = now()
    WHERE problem_set_stats.problem_set_id = p_problem_set_id;

    SELECT problem_set_stats.like_count INTO v_new_count
    FROM problem_set_stats WHERE problem_set_stats.problem_set_id = p_problem_set_id;

    RETURN QUERY SELECT false, COALESCE(v_new_count, 0::bigint);
  ELSE
    INSERT INTO problem_set_likes (user_id, problem_set_id)
    VALUES (p_user_id, p_problem_set_id);

    INSERT INTO problem_set_stats (problem_set_id, like_count)
    VALUES (p_problem_set_id, 1)
    ON CONFLICT (problem_set_id)
    DO UPDATE SET like_count = problem_set_stats.like_count + 1, updated_at = now();

    SELECT problem_set_stats.like_count INTO v_new_count
    FROM problem_set_stats WHERE problem_set_stats.problem_set_id = p_problem_set_id;

    RETURN QUERY SELECT true, COALESCE(v_new_count, 0::bigint);
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.track_problem_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_tz TEXT;
  v_changed_date DATE;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT COALESCE(timezone, 'UTC') INTO v_user_tz
    FROM user_profiles WHERE id = NEW.user_id;

    v_changed_date := (now() AT TIME ZONE COALESCE(v_user_tz, 'UTC'))::date;

    INSERT INTO problem_status_history (
      problem_id, user_id, old_status, new_status, changed_date
    ) VALUES (
      NEW.id, NEW.user_id, OLD.status, NEW.status, v_changed_date
    )
    ON CONFLICT (problem_id, changed_date)
    DO UPDATE SET
      new_status = EXCLUDED.new_status,
      changed_at = now();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_attempts_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_error_categorisation_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_owns_problem_with_asset(p_path text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM problems
    WHERE user_id = auth.uid()
      AND (
        assets @> jsonb_build_array(jsonb_build_object('path', p_path))
        OR solution_assets @> jsonb_build_array(jsonb_build_object('path', p_path))
      )
  )
$function$
;

CREATE OR REPLACE FUNCTION public.user_today(p_tz text DEFAULT 'UTC'::text)
 RETURNS date
 LANGUAGE sql
 STABLE
AS $function$ SELECT (now() AT TIME ZONE p_tz)::date; $function$
;

grant delete on table "public"."admin_settings" to "anon";

grant insert on table "public"."admin_settings" to "anon";

grant references on table "public"."admin_settings" to "anon";

grant select on table "public"."admin_settings" to "anon";

grant trigger on table "public"."admin_settings" to "anon";

grant truncate on table "public"."admin_settings" to "anon";

grant update on table "public"."admin_settings" to "anon";

grant delete on table "public"."admin_settings" to "authenticated";

grant insert on table "public"."admin_settings" to "authenticated";

grant references on table "public"."admin_settings" to "authenticated";

grant select on table "public"."admin_settings" to "authenticated";

grant trigger on table "public"."admin_settings" to "authenticated";

grant truncate on table "public"."admin_settings" to "authenticated";

grant update on table "public"."admin_settings" to "authenticated";

grant delete on table "public"."admin_settings" to "service_role";

grant insert on table "public"."admin_settings" to "service_role";

grant references on table "public"."admin_settings" to "service_role";

grant select on table "public"."admin_settings" to "service_role";

grant trigger on table "public"."admin_settings" to "service_role";

grant truncate on table "public"."admin_settings" to "service_role";

grant update on table "public"."admin_settings" to "service_role";

grant delete on table "public"."attempts" to "anon";

grant insert on table "public"."attempts" to "anon";

grant references on table "public"."attempts" to "anon";

grant select on table "public"."attempts" to "anon";

grant trigger on table "public"."attempts" to "anon";

grant truncate on table "public"."attempts" to "anon";

grant update on table "public"."attempts" to "anon";

grant delete on table "public"."attempts" to "authenticated";

grant insert on table "public"."attempts" to "authenticated";

grant references on table "public"."attempts" to "authenticated";

grant select on table "public"."attempts" to "authenticated";

grant trigger on table "public"."attempts" to "authenticated";

grant truncate on table "public"."attempts" to "authenticated";

grant update on table "public"."attempts" to "authenticated";

grant delete on table "public"."attempts" to "service_role";

grant insert on table "public"."attempts" to "service_role";

grant references on table "public"."attempts" to "service_role";

grant select on table "public"."attempts" to "service_role";

grant trigger on table "public"."attempts" to "service_role";

grant truncate on table "public"."attempts" to "service_role";

grant update on table "public"."attempts" to "service_role";

grant delete on table "public"."content_limit_overrides" to "anon";

grant insert on table "public"."content_limit_overrides" to "anon";

grant references on table "public"."content_limit_overrides" to "anon";

grant select on table "public"."content_limit_overrides" to "anon";

grant trigger on table "public"."content_limit_overrides" to "anon";

grant truncate on table "public"."content_limit_overrides" to "anon";

grant update on table "public"."content_limit_overrides" to "anon";

grant delete on table "public"."content_limit_overrides" to "authenticated";

grant insert on table "public"."content_limit_overrides" to "authenticated";

grant references on table "public"."content_limit_overrides" to "authenticated";

grant select on table "public"."content_limit_overrides" to "authenticated";

grant trigger on table "public"."content_limit_overrides" to "authenticated";

grant truncate on table "public"."content_limit_overrides" to "authenticated";

grant update on table "public"."content_limit_overrides" to "authenticated";

grant delete on table "public"."content_limit_overrides" to "service_role";

grant insert on table "public"."content_limit_overrides" to "service_role";

grant references on table "public"."content_limit_overrides" to "service_role";

grant select on table "public"."content_limit_overrides" to "service_role";

grant trigger on table "public"."content_limit_overrides" to "service_role";

grant truncate on table "public"."content_limit_overrides" to "service_role";

grant update on table "public"."content_limit_overrides" to "service_role";

grant delete on table "public"."error_categorisations" to "anon";

grant insert on table "public"."error_categorisations" to "anon";

grant references on table "public"."error_categorisations" to "anon";

grant select on table "public"."error_categorisations" to "anon";

grant trigger on table "public"."error_categorisations" to "anon";

grant truncate on table "public"."error_categorisations" to "anon";

grant update on table "public"."error_categorisations" to "anon";

grant delete on table "public"."error_categorisations" to "authenticated";

grant insert on table "public"."error_categorisations" to "authenticated";

grant references on table "public"."error_categorisations" to "authenticated";

grant select on table "public"."error_categorisations" to "authenticated";

grant trigger on table "public"."error_categorisations" to "authenticated";

grant truncate on table "public"."error_categorisations" to "authenticated";

grant update on table "public"."error_categorisations" to "authenticated";

grant delete on table "public"."error_categorisations" to "service_role";

grant insert on table "public"."error_categorisations" to "service_role";

grant references on table "public"."error_categorisations" to "service_role";

grant select on table "public"."error_categorisations" to "service_role";

grant trigger on table "public"."error_categorisations" to "service_role";

grant truncate on table "public"."error_categorisations" to "service_role";

grant update on table "public"."error_categorisations" to "service_role";

grant delete on table "public"."insight_digests" to "anon";

grant insert on table "public"."insight_digests" to "anon";

grant references on table "public"."insight_digests" to "anon";

grant select on table "public"."insight_digests" to "anon";

grant trigger on table "public"."insight_digests" to "anon";

grant truncate on table "public"."insight_digests" to "anon";

grant update on table "public"."insight_digests" to "anon";

grant delete on table "public"."insight_digests" to "authenticated";

grant insert on table "public"."insight_digests" to "authenticated";

grant references on table "public"."insight_digests" to "authenticated";

grant select on table "public"."insight_digests" to "authenticated";

grant trigger on table "public"."insight_digests" to "authenticated";

grant truncate on table "public"."insight_digests" to "authenticated";

grant update on table "public"."insight_digests" to "authenticated";

grant delete on table "public"."insight_digests" to "service_role";

grant insert on table "public"."insight_digests" to "service_role";

grant references on table "public"."insight_digests" to "service_role";

grant select on table "public"."insight_digests" to "service_role";

grant trigger on table "public"."insight_digests" to "service_role";

grant truncate on table "public"."insight_digests" to "service_role";

grant update on table "public"."insight_digests" to "service_role";

grant delete on table "public"."problem_set_copies" to "anon";

grant insert on table "public"."problem_set_copies" to "anon";

grant references on table "public"."problem_set_copies" to "anon";

grant select on table "public"."problem_set_copies" to "anon";

grant trigger on table "public"."problem_set_copies" to "anon";

grant truncate on table "public"."problem_set_copies" to "anon";

grant update on table "public"."problem_set_copies" to "anon";

grant delete on table "public"."problem_set_copies" to "authenticated";

grant insert on table "public"."problem_set_copies" to "authenticated";

grant references on table "public"."problem_set_copies" to "authenticated";

grant select on table "public"."problem_set_copies" to "authenticated";

grant trigger on table "public"."problem_set_copies" to "authenticated";

grant truncate on table "public"."problem_set_copies" to "authenticated";

grant update on table "public"."problem_set_copies" to "authenticated";

grant delete on table "public"."problem_set_copies" to "service_role";

grant insert on table "public"."problem_set_copies" to "service_role";

grant references on table "public"."problem_set_copies" to "service_role";

grant select on table "public"."problem_set_copies" to "service_role";

grant trigger on table "public"."problem_set_copies" to "service_role";

grant truncate on table "public"."problem_set_copies" to "service_role";

grant update on table "public"."problem_set_copies" to "service_role";

grant delete on table "public"."problem_set_favourites" to "anon";

grant insert on table "public"."problem_set_favourites" to "anon";

grant references on table "public"."problem_set_favourites" to "anon";

grant select on table "public"."problem_set_favourites" to "anon";

grant trigger on table "public"."problem_set_favourites" to "anon";

grant truncate on table "public"."problem_set_favourites" to "anon";

grant update on table "public"."problem_set_favourites" to "anon";

grant delete on table "public"."problem_set_favourites" to "authenticated";

grant insert on table "public"."problem_set_favourites" to "authenticated";

grant references on table "public"."problem_set_favourites" to "authenticated";

grant select on table "public"."problem_set_favourites" to "authenticated";

grant trigger on table "public"."problem_set_favourites" to "authenticated";

grant truncate on table "public"."problem_set_favourites" to "authenticated";

grant update on table "public"."problem_set_favourites" to "authenticated";

grant delete on table "public"."problem_set_favourites" to "service_role";

grant insert on table "public"."problem_set_favourites" to "service_role";

grant references on table "public"."problem_set_favourites" to "service_role";

grant select on table "public"."problem_set_favourites" to "service_role";

grant trigger on table "public"."problem_set_favourites" to "service_role";

grant truncate on table "public"."problem_set_favourites" to "service_role";

grant update on table "public"."problem_set_favourites" to "service_role";

grant delete on table "public"."problem_set_likes" to "anon";

grant insert on table "public"."problem_set_likes" to "anon";

grant references on table "public"."problem_set_likes" to "anon";

grant select on table "public"."problem_set_likes" to "anon";

grant trigger on table "public"."problem_set_likes" to "anon";

grant truncate on table "public"."problem_set_likes" to "anon";

grant update on table "public"."problem_set_likes" to "anon";

grant delete on table "public"."problem_set_likes" to "authenticated";

grant insert on table "public"."problem_set_likes" to "authenticated";

grant references on table "public"."problem_set_likes" to "authenticated";

grant select on table "public"."problem_set_likes" to "authenticated";

grant trigger on table "public"."problem_set_likes" to "authenticated";

grant truncate on table "public"."problem_set_likes" to "authenticated";

grant update on table "public"."problem_set_likes" to "authenticated";

grant delete on table "public"."problem_set_likes" to "service_role";

grant insert on table "public"."problem_set_likes" to "service_role";

grant references on table "public"."problem_set_likes" to "service_role";

grant select on table "public"."problem_set_likes" to "service_role";

grant trigger on table "public"."problem_set_likes" to "service_role";

grant truncate on table "public"."problem_set_likes" to "service_role";

grant update on table "public"."problem_set_likes" to "service_role";

grant delete on table "public"."problem_set_problems" to "anon";

grant insert on table "public"."problem_set_problems" to "anon";

grant references on table "public"."problem_set_problems" to "anon";

grant select on table "public"."problem_set_problems" to "anon";

grant trigger on table "public"."problem_set_problems" to "anon";

grant truncate on table "public"."problem_set_problems" to "anon";

grant update on table "public"."problem_set_problems" to "anon";

grant delete on table "public"."problem_set_problems" to "authenticated";

grant insert on table "public"."problem_set_problems" to "authenticated";

grant references on table "public"."problem_set_problems" to "authenticated";

grant select on table "public"."problem_set_problems" to "authenticated";

grant trigger on table "public"."problem_set_problems" to "authenticated";

grant truncate on table "public"."problem_set_problems" to "authenticated";

grant update on table "public"."problem_set_problems" to "authenticated";

grant delete on table "public"."problem_set_problems" to "service_role";

grant insert on table "public"."problem_set_problems" to "service_role";

grant references on table "public"."problem_set_problems" to "service_role";

grant select on table "public"."problem_set_problems" to "service_role";

grant trigger on table "public"."problem_set_problems" to "service_role";

grant truncate on table "public"."problem_set_problems" to "service_role";

grant update on table "public"."problem_set_problems" to "service_role";

grant delete on table "public"."problem_set_reports" to "anon";

grant insert on table "public"."problem_set_reports" to "anon";

grant references on table "public"."problem_set_reports" to "anon";

grant select on table "public"."problem_set_reports" to "anon";

grant trigger on table "public"."problem_set_reports" to "anon";

grant truncate on table "public"."problem_set_reports" to "anon";

grant update on table "public"."problem_set_reports" to "anon";

grant delete on table "public"."problem_set_reports" to "authenticated";

grant insert on table "public"."problem_set_reports" to "authenticated";

grant references on table "public"."problem_set_reports" to "authenticated";

grant select on table "public"."problem_set_reports" to "authenticated";

grant trigger on table "public"."problem_set_reports" to "authenticated";

grant truncate on table "public"."problem_set_reports" to "authenticated";

grant update on table "public"."problem_set_reports" to "authenticated";

grant delete on table "public"."problem_set_reports" to "service_role";

grant insert on table "public"."problem_set_reports" to "service_role";

grant references on table "public"."problem_set_reports" to "service_role";

grant select on table "public"."problem_set_reports" to "service_role";

grant trigger on table "public"."problem_set_reports" to "service_role";

grant truncate on table "public"."problem_set_reports" to "service_role";

grant update on table "public"."problem_set_reports" to "service_role";

grant delete on table "public"."problem_set_shares" to "anon";

grant insert on table "public"."problem_set_shares" to "anon";

grant references on table "public"."problem_set_shares" to "anon";

grant select on table "public"."problem_set_shares" to "anon";

grant trigger on table "public"."problem_set_shares" to "anon";

grant truncate on table "public"."problem_set_shares" to "anon";

grant update on table "public"."problem_set_shares" to "anon";

grant delete on table "public"."problem_set_shares" to "authenticated";

grant insert on table "public"."problem_set_shares" to "authenticated";

grant references on table "public"."problem_set_shares" to "authenticated";

grant select on table "public"."problem_set_shares" to "authenticated";

grant trigger on table "public"."problem_set_shares" to "authenticated";

grant truncate on table "public"."problem_set_shares" to "authenticated";

grant update on table "public"."problem_set_shares" to "authenticated";

grant delete on table "public"."problem_set_shares" to "service_role";

grant insert on table "public"."problem_set_shares" to "service_role";

grant references on table "public"."problem_set_shares" to "service_role";

grant select on table "public"."problem_set_shares" to "service_role";

grant trigger on table "public"."problem_set_shares" to "service_role";

grant truncate on table "public"."problem_set_shares" to "service_role";

grant update on table "public"."problem_set_shares" to "service_role";

grant delete on table "public"."problem_set_stats" to "anon";

grant insert on table "public"."problem_set_stats" to "anon";

grant references on table "public"."problem_set_stats" to "anon";

grant select on table "public"."problem_set_stats" to "anon";

grant trigger on table "public"."problem_set_stats" to "anon";

grant truncate on table "public"."problem_set_stats" to "anon";

grant update on table "public"."problem_set_stats" to "anon";

grant delete on table "public"."problem_set_stats" to "authenticated";

grant insert on table "public"."problem_set_stats" to "authenticated";

grant references on table "public"."problem_set_stats" to "authenticated";

grant select on table "public"."problem_set_stats" to "authenticated";

grant trigger on table "public"."problem_set_stats" to "authenticated";

grant truncate on table "public"."problem_set_stats" to "authenticated";

grant update on table "public"."problem_set_stats" to "authenticated";

grant delete on table "public"."problem_set_stats" to "service_role";

grant insert on table "public"."problem_set_stats" to "service_role";

grant references on table "public"."problem_set_stats" to "service_role";

grant select on table "public"."problem_set_stats" to "service_role";

grant trigger on table "public"."problem_set_stats" to "service_role";

grant truncate on table "public"."problem_set_stats" to "service_role";

grant update on table "public"."problem_set_stats" to "service_role";

grant delete on table "public"."problem_set_views" to "anon";

grant insert on table "public"."problem_set_views" to "anon";

grant references on table "public"."problem_set_views" to "anon";

grant select on table "public"."problem_set_views" to "anon";

grant trigger on table "public"."problem_set_views" to "anon";

grant truncate on table "public"."problem_set_views" to "anon";

grant update on table "public"."problem_set_views" to "anon";

grant delete on table "public"."problem_set_views" to "authenticated";

grant insert on table "public"."problem_set_views" to "authenticated";

grant references on table "public"."problem_set_views" to "authenticated";

grant select on table "public"."problem_set_views" to "authenticated";

grant trigger on table "public"."problem_set_views" to "authenticated";

grant truncate on table "public"."problem_set_views" to "authenticated";

grant update on table "public"."problem_set_views" to "authenticated";

grant delete on table "public"."problem_set_views" to "service_role";

grant insert on table "public"."problem_set_views" to "service_role";

grant references on table "public"."problem_set_views" to "service_role";

grant select on table "public"."problem_set_views" to "service_role";

grant trigger on table "public"."problem_set_views" to "service_role";

grant truncate on table "public"."problem_set_views" to "service_role";

grant update on table "public"."problem_set_views" to "service_role";

grant delete on table "public"."problem_sets" to "anon";

grant insert on table "public"."problem_sets" to "anon";

grant references on table "public"."problem_sets" to "anon";

grant select on table "public"."problem_sets" to "anon";

grant trigger on table "public"."problem_sets" to "anon";

grant truncate on table "public"."problem_sets" to "anon";

grant update on table "public"."problem_sets" to "anon";

grant delete on table "public"."problem_sets" to "authenticated";

grant insert on table "public"."problem_sets" to "authenticated";

grant references on table "public"."problem_sets" to "authenticated";

grant select on table "public"."problem_sets" to "authenticated";

grant trigger on table "public"."problem_sets" to "authenticated";

grant truncate on table "public"."problem_sets" to "authenticated";

grant update on table "public"."problem_sets" to "authenticated";

grant delete on table "public"."problem_sets" to "service_role";

grant insert on table "public"."problem_sets" to "service_role";

grant references on table "public"."problem_sets" to "service_role";

grant select on table "public"."problem_sets" to "service_role";

grant trigger on table "public"."problem_sets" to "service_role";

grant truncate on table "public"."problem_sets" to "service_role";

grant update on table "public"."problem_sets" to "service_role";

grant delete on table "public"."problem_status_history" to "anon";

grant insert on table "public"."problem_status_history" to "anon";

grant references on table "public"."problem_status_history" to "anon";

grant select on table "public"."problem_status_history" to "anon";

grant trigger on table "public"."problem_status_history" to "anon";

grant truncate on table "public"."problem_status_history" to "anon";

grant update on table "public"."problem_status_history" to "anon";

grant delete on table "public"."problem_status_history" to "authenticated";

grant insert on table "public"."problem_status_history" to "authenticated";

grant references on table "public"."problem_status_history" to "authenticated";

grant select on table "public"."problem_status_history" to "authenticated";

grant trigger on table "public"."problem_status_history" to "authenticated";

grant truncate on table "public"."problem_status_history" to "authenticated";

grant update on table "public"."problem_status_history" to "authenticated";

grant delete on table "public"."problem_status_history" to "service_role";

grant insert on table "public"."problem_status_history" to "service_role";

grant references on table "public"."problem_status_history" to "service_role";

grant select on table "public"."problem_status_history" to "service_role";

grant trigger on table "public"."problem_status_history" to "service_role";

grant truncate on table "public"."problem_status_history" to "service_role";

grant update on table "public"."problem_status_history" to "service_role";

grant delete on table "public"."problem_tag" to "anon";

grant insert on table "public"."problem_tag" to "anon";

grant references on table "public"."problem_tag" to "anon";

grant select on table "public"."problem_tag" to "anon";

grant trigger on table "public"."problem_tag" to "anon";

grant truncate on table "public"."problem_tag" to "anon";

grant update on table "public"."problem_tag" to "anon";

grant delete on table "public"."problem_tag" to "authenticated";

grant insert on table "public"."problem_tag" to "authenticated";

grant references on table "public"."problem_tag" to "authenticated";

grant select on table "public"."problem_tag" to "authenticated";

grant trigger on table "public"."problem_tag" to "authenticated";

grant truncate on table "public"."problem_tag" to "authenticated";

grant update on table "public"."problem_tag" to "authenticated";

grant delete on table "public"."problem_tag" to "service_role";

grant insert on table "public"."problem_tag" to "service_role";

grant references on table "public"."problem_tag" to "service_role";

grant select on table "public"."problem_tag" to "service_role";

grant trigger on table "public"."problem_tag" to "service_role";

grant truncate on table "public"."problem_tag" to "service_role";

grant update on table "public"."problem_tag" to "service_role";

grant delete on table "public"."problems" to "anon";

grant insert on table "public"."problems" to "anon";

grant references on table "public"."problems" to "anon";

grant select on table "public"."problems" to "anon";

grant trigger on table "public"."problems" to "anon";

grant truncate on table "public"."problems" to "anon";

grant update on table "public"."problems" to "anon";

grant delete on table "public"."problems" to "authenticated";

grant insert on table "public"."problems" to "authenticated";

grant references on table "public"."problems" to "authenticated";

grant select on table "public"."problems" to "authenticated";

grant trigger on table "public"."problems" to "authenticated";

grant truncate on table "public"."problems" to "authenticated";

grant update on table "public"."problems" to "authenticated";

grant delete on table "public"."problems" to "service_role";

grant insert on table "public"."problems" to "service_role";

grant references on table "public"."problems" to "service_role";

grant select on table "public"."problems" to "service_role";

grant trigger on table "public"."problems" to "service_role";

grant truncate on table "public"."problems" to "service_role";

grant update on table "public"."problems" to "service_role";

grant delete on table "public"."qr_upload_sessions" to "anon";

grant insert on table "public"."qr_upload_sessions" to "anon";

grant references on table "public"."qr_upload_sessions" to "anon";

grant select on table "public"."qr_upload_sessions" to "anon";

grant trigger on table "public"."qr_upload_sessions" to "anon";

grant truncate on table "public"."qr_upload_sessions" to "anon";

grant update on table "public"."qr_upload_sessions" to "anon";

grant delete on table "public"."qr_upload_sessions" to "authenticated";

grant insert on table "public"."qr_upload_sessions" to "authenticated";

grant references on table "public"."qr_upload_sessions" to "authenticated";

grant select on table "public"."qr_upload_sessions" to "authenticated";

grant trigger on table "public"."qr_upload_sessions" to "authenticated";

grant truncate on table "public"."qr_upload_sessions" to "authenticated";

grant update on table "public"."qr_upload_sessions" to "authenticated";

grant delete on table "public"."qr_upload_sessions" to "service_role";

grant insert on table "public"."qr_upload_sessions" to "service_role";

grant references on table "public"."qr_upload_sessions" to "service_role";

grant select on table "public"."qr_upload_sessions" to "service_role";

grant trigger on table "public"."qr_upload_sessions" to "service_role";

grant truncate on table "public"."qr_upload_sessions" to "service_role";

grant update on table "public"."qr_upload_sessions" to "service_role";

grant delete on table "public"."review_schedule" to "anon";

grant insert on table "public"."review_schedule" to "anon";

grant references on table "public"."review_schedule" to "anon";

grant select on table "public"."review_schedule" to "anon";

grant trigger on table "public"."review_schedule" to "anon";

grant truncate on table "public"."review_schedule" to "anon";

grant update on table "public"."review_schedule" to "anon";

grant delete on table "public"."review_schedule" to "authenticated";

grant insert on table "public"."review_schedule" to "authenticated";

grant references on table "public"."review_schedule" to "authenticated";

grant select on table "public"."review_schedule" to "authenticated";

grant trigger on table "public"."review_schedule" to "authenticated";

grant truncate on table "public"."review_schedule" to "authenticated";

grant update on table "public"."review_schedule" to "authenticated";

grant delete on table "public"."review_schedule" to "service_role";

grant insert on table "public"."review_schedule" to "service_role";

grant references on table "public"."review_schedule" to "service_role";

grant select on table "public"."review_schedule" to "service_role";

grant trigger on table "public"."review_schedule" to "service_role";

grant truncate on table "public"."review_schedule" to "service_role";

grant update on table "public"."review_schedule" to "service_role";

grant delete on table "public"."review_session_results" to "anon";

grant insert on table "public"."review_session_results" to "anon";

grant references on table "public"."review_session_results" to "anon";

grant select on table "public"."review_session_results" to "anon";

grant trigger on table "public"."review_session_results" to "anon";

grant truncate on table "public"."review_session_results" to "anon";

grant update on table "public"."review_session_results" to "anon";

grant delete on table "public"."review_session_results" to "authenticated";

grant insert on table "public"."review_session_results" to "authenticated";

grant references on table "public"."review_session_results" to "authenticated";

grant select on table "public"."review_session_results" to "authenticated";

grant trigger on table "public"."review_session_results" to "authenticated";

grant truncate on table "public"."review_session_results" to "authenticated";

grant update on table "public"."review_session_results" to "authenticated";

grant delete on table "public"."review_session_results" to "service_role";

grant insert on table "public"."review_session_results" to "service_role";

grant references on table "public"."review_session_results" to "service_role";

grant select on table "public"."review_session_results" to "service_role";

grant trigger on table "public"."review_session_results" to "service_role";

grant truncate on table "public"."review_session_results" to "service_role";

grant update on table "public"."review_session_results" to "service_role";

grant delete on table "public"."review_session_state" to "anon";

grant insert on table "public"."review_session_state" to "anon";

grant references on table "public"."review_session_state" to "anon";

grant select on table "public"."review_session_state" to "anon";

grant trigger on table "public"."review_session_state" to "anon";

grant truncate on table "public"."review_session_state" to "anon";

grant update on table "public"."review_session_state" to "anon";

grant delete on table "public"."review_session_state" to "authenticated";

grant insert on table "public"."review_session_state" to "authenticated";

grant references on table "public"."review_session_state" to "authenticated";

grant select on table "public"."review_session_state" to "authenticated";

grant trigger on table "public"."review_session_state" to "authenticated";

grant truncate on table "public"."review_session_state" to "authenticated";

grant update on table "public"."review_session_state" to "authenticated";

grant delete on table "public"."review_session_state" to "service_role";

grant insert on table "public"."review_session_state" to "service_role";

grant references on table "public"."review_session_state" to "service_role";

grant select on table "public"."review_session_state" to "service_role";

grant trigger on table "public"."review_session_state" to "service_role";

grant truncate on table "public"."review_session_state" to "service_role";

grant update on table "public"."review_session_state" to "service_role";

grant delete on table "public"."subjects" to "anon";

grant insert on table "public"."subjects" to "anon";

grant references on table "public"."subjects" to "anon";

grant select on table "public"."subjects" to "anon";

grant trigger on table "public"."subjects" to "anon";

grant truncate on table "public"."subjects" to "anon";

grant update on table "public"."subjects" to "anon";

grant delete on table "public"."subjects" to "authenticated";

grant insert on table "public"."subjects" to "authenticated";

grant references on table "public"."subjects" to "authenticated";

grant select on table "public"."subjects" to "authenticated";

grant trigger on table "public"."subjects" to "authenticated";

grant truncate on table "public"."subjects" to "authenticated";

grant update on table "public"."subjects" to "authenticated";

grant delete on table "public"."subjects" to "service_role";

grant insert on table "public"."subjects" to "service_role";

grant references on table "public"."subjects" to "service_role";

grant select on table "public"."subjects" to "service_role";

grant trigger on table "public"."subjects" to "service_role";

grant truncate on table "public"."subjects" to "service_role";

grant update on table "public"."subjects" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant references on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant trigger on table "public"."tags" to "anon";

grant truncate on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant references on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant trigger on table "public"."tags" to "authenticated";

grant truncate on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant references on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant trigger on table "public"."tags" to "service_role";

grant truncate on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";

grant delete on table "public"."usage_quotas" to "anon";

grant insert on table "public"."usage_quotas" to "anon";

grant references on table "public"."usage_quotas" to "anon";

grant select on table "public"."usage_quotas" to "anon";

grant trigger on table "public"."usage_quotas" to "anon";

grant truncate on table "public"."usage_quotas" to "anon";

grant update on table "public"."usage_quotas" to "anon";

grant delete on table "public"."usage_quotas" to "authenticated";

grant insert on table "public"."usage_quotas" to "authenticated";

grant references on table "public"."usage_quotas" to "authenticated";

grant select on table "public"."usage_quotas" to "authenticated";

grant trigger on table "public"."usage_quotas" to "authenticated";

grant truncate on table "public"."usage_quotas" to "authenticated";

grant update on table "public"."usage_quotas" to "authenticated";

grant delete on table "public"."usage_quotas" to "service_role";

grant insert on table "public"."usage_quotas" to "service_role";

grant references on table "public"."usage_quotas" to "service_role";

grant select on table "public"."usage_quotas" to "service_role";

grant trigger on table "public"."usage_quotas" to "service_role";

grant truncate on table "public"."usage_quotas" to "service_role";

grant update on table "public"."usage_quotas" to "service_role";

grant delete on table "public"."user_activity_log" to "anon";

grant insert on table "public"."user_activity_log" to "anon";

grant references on table "public"."user_activity_log" to "anon";

grant select on table "public"."user_activity_log" to "anon";

grant trigger on table "public"."user_activity_log" to "anon";

grant truncate on table "public"."user_activity_log" to "anon";

grant update on table "public"."user_activity_log" to "anon";

grant delete on table "public"."user_activity_log" to "authenticated";

grant insert on table "public"."user_activity_log" to "authenticated";

grant references on table "public"."user_activity_log" to "authenticated";

grant select on table "public"."user_activity_log" to "authenticated";

grant trigger on table "public"."user_activity_log" to "authenticated";

grant truncate on table "public"."user_activity_log" to "authenticated";

grant update on table "public"."user_activity_log" to "authenticated";

grant delete on table "public"."user_activity_log" to "service_role";

grant insert on table "public"."user_activity_log" to "service_role";

grant references on table "public"."user_activity_log" to "service_role";

grant select on table "public"."user_activity_log" to "service_role";

grant trigger on table "public"."user_activity_log" to "service_role";

grant truncate on table "public"."user_activity_log" to "service_role";

grant update on table "public"."user_activity_log" to "service_role";

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant references on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant trigger on table "public"."user_profiles" to "anon";

grant truncate on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant references on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant trigger on table "public"."user_profiles" to "authenticated";

grant truncate on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant references on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant trigger on table "public"."user_profiles" to "service_role";

grant truncate on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";

grant delete on table "public"."user_quota_overrides" to "anon";

grant insert on table "public"."user_quota_overrides" to "anon";

grant references on table "public"."user_quota_overrides" to "anon";

grant select on table "public"."user_quota_overrides" to "anon";

grant trigger on table "public"."user_quota_overrides" to "anon";

grant truncate on table "public"."user_quota_overrides" to "anon";

grant update on table "public"."user_quota_overrides" to "anon";

grant delete on table "public"."user_quota_overrides" to "authenticated";

grant insert on table "public"."user_quota_overrides" to "authenticated";

grant references on table "public"."user_quota_overrides" to "authenticated";

grant select on table "public"."user_quota_overrides" to "authenticated";

grant trigger on table "public"."user_quota_overrides" to "authenticated";

grant truncate on table "public"."user_quota_overrides" to "authenticated";

grant update on table "public"."user_quota_overrides" to "authenticated";

grant delete on table "public"."user_quota_overrides" to "service_role";

grant insert on table "public"."user_quota_overrides" to "service_role";

grant references on table "public"."user_quota_overrides" to "service_role";

grant select on table "public"."user_quota_overrides" to "service_role";

grant trigger on table "public"."user_quota_overrides" to "service_role";

grant truncate on table "public"."user_quota_overrides" to "service_role";

grant update on table "public"."user_quota_overrides" to "service_role";


  create policy "settings_service_role"
  on "public"."admin_settings"
  as permissive
  for all
  to authenticated
using ((( SELECT auth.role() AS role) = 'service_role'::text));



  create policy "Users can update own attempts"
  on "public"."attempts"
  as permissive
  for update
  to public
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "attempts_owner_all"
  on "public"."attempts"
  as permissive
  for all
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "attempts_problem_owner_read"
  on "public"."attempts"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.problems p
  WHERE ((p.id = attempts.problem_id) AND (p.user_id = ( SELECT auth.uid() AS uid))))));



  create policy "Service role can insert categorisations"
  on "public"."error_categorisations"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can read own categorisations"
  on "public"."error_categorisations"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can update own categorisations"
  on "public"."error_categorisations"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Service role can delete digests"
  on "public"."insight_digests"
  as permissive
  for delete
  to public
using (true);



  create policy "Service role can manage digests"
  on "public"."insight_digests"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can read own digests"
  on "public"."insight_digests"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "problem_set_copies_insert_policy"
  on "public"."problem_set_copies"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_set_copies_select_policy"
  on "public"."problem_set_copies"
  as permissive
  for select
  to authenticated
using (true);



  create policy "problem_set_favourites_delete_policy"
  on "public"."problem_set_favourites"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_set_favourites_insert_policy"
  on "public"."problem_set_favourites"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_set_favourites_select_policy"
  on "public"."problem_set_favourites"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_set_likes_delete_policy"
  on "public"."problem_set_likes"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_set_likes_insert_policy"
  on "public"."problem_set_likes"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_set_likes_select_policy"
  on "public"."problem_set_likes"
  as permissive
  for select
  to authenticated
using (true);



  create policy "problem_set_problems_delete_policy"
  on "public"."problem_set_problems"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_set_problems_insert_policy"
  on "public"."problem_set_problems"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_set_problems_select_policy"
  on "public"."problem_set_problems"
  as permissive
  for select
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.problem_sets ps
  WHERE ((ps.id = problem_set_problems.problem_set_id) AND (ps.sharing_level = 'public'::public.sharing_level)))) OR (EXISTS ( SELECT 1
   FROM (public.problem_sets ps
     JOIN public.problem_set_shares pss ON ((pss.problem_set_id = ps.id)))
  WHERE ((ps.id = problem_set_problems.problem_set_id) AND (ps.sharing_level = 'limited'::public.sharing_level) AND (lower((pss.shared_with_email)::text) = lower(( SELECT COALESCE(NULLIF((( SELECT auth.jwt() AS jwt) ->> 'email'::text), ''::text), '__noemail__'::text) AS "coalesce")))))) OR (EXISTS ( SELECT 1
   FROM public.problem_sets ps
  WHERE ((ps.id = problem_set_problems.problem_set_id) AND (ps.user_id = ( SELECT auth.uid() AS uid)))))));



  create policy "problem_set_problems_update_policy"
  on "public"."problem_set_problems"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_set_reports_insert_policy"
  on "public"."problem_set_reports"
  as permissive
  for insert
  to authenticated
with check ((reporter_user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_set_reports_select_policy"
  on "public"."problem_set_reports"
  as permissive
  for select
  to authenticated
using ((reporter_user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_set_shares_delete_policy"
  on "public"."problem_set_shares"
  as permissive
  for delete
  to authenticated
using ((shared_by_user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_set_shares_insert_policy"
  on "public"."problem_set_shares"
  as permissive
  for insert
  to authenticated
with check ((shared_by_user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_set_shares_select_policy"
  on "public"."problem_set_shares"
  as permissive
  for select
  to authenticated
using (((shared_by_user_id = ( SELECT auth.uid() AS uid)) OR (lower((shared_with_email)::text) = lower(( SELECT COALESCE(NULLIF((( SELECT auth.jwt() AS jwt) ->> 'email'::text), ''::text), '___noemail___'::text) AS "coalesce")))));



  create policy "problem_set_shares_update_policy"
  on "public"."problem_set_shares"
  as permissive
  for update
  to authenticated
using ((shared_by_user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_set_stats_anon_select_policy"
  on "public"."problem_set_stats"
  as permissive
  for select
  to anon
using (true);



  create policy "problem_set_stats_select_policy"
  on "public"."problem_set_stats"
  as permissive
  for select
  to authenticated
using (true);



  create policy "problem_sets_delete_policy"
  on "public"."problem_sets"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_sets_insert_policy"
  on "public"."problem_sets"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_sets_select_policy"
  on "public"."problem_sets"
  as permissive
  for select
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR (sharing_level = 'public'::public.sharing_level) OR (sharing_level = 'limited'::public.sharing_level)));



  create policy "problem_sets_update_policy"
  on "public"."problem_sets"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Users can insert own history"
  on "public"."problem_status_history"
  as permissive
  for insert
  to public
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Users can read own history"
  on "public"."problem_status_history"
  as permissive
  for select
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_tag_delete_policy"
  on "public"."problem_tag"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_tag_insert_policy"
  on "public"."problem_tag"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problem_tag_select_policy"
  on "public"."problem_tag"
  as permissive
  for select
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM (public.problem_set_problems psp
     JOIN public.problem_sets ps ON ((ps.id = psp.problem_set_id)))
  WHERE ((psp.problem_id = problem_tag.problem_id) AND (ps.sharing_level = 'public'::public.sharing_level)))) OR (EXISTS ( SELECT 1
   FROM ((public.problem_set_problems psp
     JOIN public.problem_sets ps ON ((ps.id = psp.problem_set_id)))
     JOIN public.problem_set_shares pss ON ((pss.problem_set_id = ps.id)))
  WHERE ((psp.problem_id = problem_tag.problem_id) AND (ps.sharing_level = 'limited'::public.sharing_level) AND (lower((pss.shared_with_email)::text) = lower(COALESCE(NULLIF((( SELECT auth.jwt() AS jwt) ->> 'email'::text), ''::text), '__noemail__'::text))))))));



  create policy "problem_tag_update_policy"
  on "public"."problem_tag"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problems_delete_policy"
  on "public"."problems"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problems_insert_policy"
  on "public"."problems"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "problems_select_policy"
  on "public"."problems"
  as permissive
  for select
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM (public.problem_set_problems psp
     JOIN public.problem_sets ps ON ((ps.id = psp.problem_set_id)))
  WHERE ((psp.problem_id = problems.id) AND (ps.sharing_level = 'public'::public.sharing_level)))) OR (EXISTS ( SELECT 1
   FROM ((public.problem_set_problems psp
     JOIN public.problem_sets ps ON ((ps.id = psp.problem_set_id)))
     JOIN public.problem_set_shares pss ON ((pss.problem_set_id = ps.id)))
  WHERE ((psp.problem_id = problems.id) AND (ps.sharing_level = 'limited'::public.sharing_level) AND (lower((pss.shared_with_email)::text) = lower(( SELECT COALESCE(NULLIF((( SELECT auth.jwt() AS jwt) ->> 'email'::text), ''::text), '__noemail__'::text) AS "coalesce"))))))));



  create policy "problems_update_policy"
  on "public"."problems"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "owner_insert"
  on "public"."qr_upload_sessions"
  as permissive
  for insert
  to public
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "owner_select"
  on "public"."qr_upload_sessions"
  as permissive
  for select
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "review_owner_all"
  on "public"."review_schedule"
  as permissive
  for all
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Users can create own session results"
  on "public"."review_session_results"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.review_session_state
  WHERE ((review_session_state.id = review_session_results.session_state_id) AND (review_session_state.user_id = ( SELECT auth.uid() AS uid))))));



  create policy "Users can update own session results"
  on "public"."review_session_results"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.review_session_state
  WHERE ((review_session_state.id = review_session_results.session_state_id) AND (review_session_state.user_id = ( SELECT auth.uid() AS uid))))));



  create policy "Users can view own session results"
  on "public"."review_session_results"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.review_session_state
  WHERE ((review_session_state.id = review_session_results.session_state_id) AND (review_session_state.user_id = ( SELECT auth.uid() AS uid))))));



  create policy "Users can create own sessions"
  on "public"."review_session_state"
  as permissive
  for insert
  to public
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Users can delete own sessions"
  on "public"."review_session_state"
  as permissive
  for delete
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Users can update own sessions"
  on "public"."review_session_state"
  as permissive
  for update
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Users can view own sessions"
  on "public"."review_session_state"
  as permissive
  for select
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "subjects_owner_all"
  on "public"."subjects"
  as permissive
  for all
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "tags_delete_policy"
  on "public"."tags"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "tags_insert_policy"
  on "public"."tags"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "tags_select_policy"
  on "public"."tags"
  as permissive
  for select
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.problem_tag pt
  WHERE ((pt.tag_id = tags.id) AND ((EXISTS ( SELECT 1
           FROM (public.problem_set_problems psp
             JOIN public.problem_sets ps ON ((ps.id = psp.problem_set_id)))
          WHERE ((psp.problem_id = pt.problem_id) AND (ps.sharing_level = 'public'::public.sharing_level)))) OR (EXISTS ( SELECT 1
           FROM ((public.problem_set_problems psp
             JOIN public.problem_sets ps ON ((ps.id = psp.problem_set_id)))
             JOIN public.problem_set_shares pss ON ((pss.problem_set_id = ps.id)))
          WHERE ((psp.problem_id = pt.problem_id) AND (ps.sharing_level = 'limited'::public.sharing_level) AND (lower((pss.shared_with_email)::text) = lower(COALESCE(NULLIF((( SELECT auth.jwt() AS jwt) ->> 'email'::text), ''::text), '__noemail__'::text))))))))))));



  create policy "tags_update_policy"
  on "public"."tags"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Users can view their own quota usage"
  on "public"."usage_quotas"
  as permissive
  for select
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "activity_log_select_own"
  on "public"."user_activity_log"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "user_profiles_select_own"
  on "public"."user_profiles"
  as permissive
  for select
  to authenticated
using ((id = ( SELECT auth.uid() AS uid)));



  create policy "user_profiles_update_own"
  on "public"."user_profiles"
  as permissive
  for update
  to authenticated
using ((id = ( SELECT auth.uid() AS uid)));



  create policy "Users can view their own quota overrides"
  on "public"."user_quota_overrides"
  as permissive
  for select
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));


CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_attempts_updated_at BEFORE UPDATE ON public.attempts FOR EACH ROW EXECUTE FUNCTION public.update_attempts_updated_at();

CREATE TRIGGER trigger_error_categorisation_updated_at BEFORE UPDATE ON public.error_categorisations FOR EACH ROW EXECUTE FUNCTION public.update_error_categorisation_updated_at();

CREATE TRIGGER trg_ensure_problem_set_stats AFTER INSERT OR UPDATE OF sharing_level ON public.problem_sets FOR EACH ROW EXECUTE FUNCTION public.ensure_problem_set_stats();

CREATE TRIGGER update_problem_sets_updated_at BEFORE UPDATE ON public.problem_sets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_problem_status_update AFTER UPDATE OF status ON public.problems FOR EACH ROW EXECUTE FUNCTION public.track_problem_status_change();

CREATE TRIGGER trg_problems_updated_at BEFORE UPDATE ON public.problems FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Avatars are publicly viewable"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Users can delete their own avatar"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can update their own avatar"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload their own avatar"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "owners can delete their files"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'problem-uploads'::text) AND ((storage.foldername(name))[1] = 'user'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));



  create policy "owners can read their files"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'problem-uploads'::text) AND ((storage.foldername(name))[1] = 'user'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));



  create policy "owners can update their files"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'problem-uploads'::text) AND ((storage.foldername(name))[1] = 'user'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)))
with check (((bucket_id = 'problem-uploads'::text) AND ((storage.foldername(name))[1] = 'user'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));



  create policy "users can upload to own folder"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'problem-uploads'::text) AND ((storage.foldername(name))[1] = 'user'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));



