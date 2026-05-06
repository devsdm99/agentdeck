DROP INDEX "scan_agents_scan_name_unique";--> statement-breakpoint
DROP INDEX "scan_skills_scan_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "scan_agents_scan_file_unique" ON "scan_agents" USING btree ("scan_id","file_id");--> statement-breakpoint
CREATE INDEX "scan_agents_scan_name_idx" ON "scan_agents" USING btree ("scan_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "scan_skills_scan_file_unique" ON "scan_skills" USING btree ("scan_id","file_id");--> statement-breakpoint
CREATE INDEX "scan_skills_scan_name_idx" ON "scan_skills" USING btree ("scan_id","name");