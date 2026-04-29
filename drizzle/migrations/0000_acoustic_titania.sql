CREATE TYPE "public"."claude_item_kind" AS ENUM('agent', 'skill', 'hook', 'command', 'output_style', 'config', 'other');--> statement-breakpoint
CREATE TYPE "public"."hook_event" AS ENUM('pre_tool_use', 'post_tool_use', 'user_prompt_submit', 'stop', 'subagent_stop', 'pre_compact', 'notification', 'session_start', 'session_end');--> statement-breakpoint
CREATE TYPE "public"."repo_source_kind" AS ENUM('url_public', 'zip_upload', 'github_oauth', 'local_path');--> statement-breakpoint
CREATE TYPE "public"."repo_visibility" AS ENUM('public', 'private', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('pending', 'running', 'success', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."scan_trigger" AS ENUM('manual', 'webhook', 'scheduled', 'api');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'pro_monthly', 'pro_yearly');--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repo_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repo_id" uuid NOT NULL,
	"kind" "repo_source_kind" NOT NULL,
	"url" text,
	"default_branch" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"visibility" "repo_visibility" DEFAULT 'unknown' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_agent_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"tool_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"model" text,
	"frontmatter" jsonb,
	"body_md" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"path" text NOT NULL,
	"kind" "claude_item_kind" NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"sha256" text NOT NULL,
	"raw_content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_hooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"event" "hook_event" NOT NULL,
	"matcher" text,
	"command" text NOT NULL,
	"timeout_ms" integer,
	"run_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_skill_triggers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"trigger_text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"frontmatter" jsonb,
	"body_md" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_stats" (
	"scan_id" uuid PRIMARY KEY NOT NULL,
	"agents_count" integer DEFAULT 0 NOT NULL,
	"skills_count" integer DEFAULT 0 NOT NULL,
	"hooks_count" integer DEFAULT 0 NOT NULL,
	"commands_count" integer DEFAULT 0 NOT NULL,
	"output_styles_count" integer DEFAULT 0 NOT NULL,
	"total_files" integer DEFAULT 0 NOT NULL,
	"total_size_bytes" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repo_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"status" "scan_status" DEFAULT 'pending' NOT NULL,
	"trigger" "scan_trigger" DEFAULT 'manual' NOT NULL,
	"commit_sha" text,
	"branch" text,
	"claude_md_raw" text,
	"agents_md_raw" text,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "repo_sources" ADD CONSTRAINT "repo_sources_repo_id_repos_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repos" ADD CONSTRAINT "repos_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_agent_tools" ADD CONSTRAINT "scan_agent_tools_agent_id_scan_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."scan_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_agents" ADD CONSTRAINT "scan_agents_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_agents" ADD CONSTRAINT "scan_agents_file_id_scan_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."scan_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_files" ADD CONSTRAINT "scan_files_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_hooks" ADD CONSTRAINT "scan_hooks_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_hooks" ADD CONSTRAINT "scan_hooks_file_id_scan_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."scan_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_skill_triggers" ADD CONSTRAINT "scan_skill_triggers_skill_id_scan_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."scan_skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_skills" ADD CONSTRAINT "scan_skills_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_skills" ADD CONSTRAINT "scan_skills_file_id_scan_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."scan_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_stats" ADD CONSTRAINT "scan_stats_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_repo_id_repos_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_source_id_repo_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."repo_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "repo_sources_repo_idx" ON "repo_sources" USING btree ("repo_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repos_user_slug_unique" ON "repos" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX "repos_user_idx" ON "repos" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scan_agent_tools_agent_tool_unique" ON "scan_agent_tools" USING btree ("agent_id","tool_name");--> statement-breakpoint
CREATE INDEX "scan_agent_tools_tool_idx" ON "scan_agent_tools" USING btree ("tool_name");--> statement-breakpoint
CREATE UNIQUE INDEX "scan_agents_scan_name_unique" ON "scan_agents" USING btree ("scan_id","name");--> statement-breakpoint
CREATE INDEX "scan_agents_scan_idx" ON "scan_agents" USING btree ("scan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scan_files_scan_path_unique" ON "scan_files" USING btree ("scan_id","path");--> statement-breakpoint
CREATE INDEX "scan_files_kind_idx" ON "scan_files" USING btree ("scan_id","kind");--> statement-breakpoint
CREATE INDEX "scan_hooks_scan_event_idx" ON "scan_hooks" USING btree ("scan_id","event");--> statement-breakpoint
CREATE INDEX "scan_skill_triggers_skill_idx" ON "scan_skill_triggers" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scan_skills_scan_name_unique" ON "scan_skills" USING btree ("scan_id","name");--> statement-breakpoint
CREATE INDEX "scan_skills_scan_idx" ON "scan_skills" USING btree ("scan_id");--> statement-breakpoint
CREATE INDEX "scans_repo_started_idx" ON "scans" USING btree ("repo_id","started_at");--> statement-breakpoint
CREATE INDEX "scans_status_idx" ON "scans" USING btree ("status");