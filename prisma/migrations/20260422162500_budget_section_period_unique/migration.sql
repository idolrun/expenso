-- This migration changes the unique constraint on section_budget
-- from (section, period, periodStart) to (section, period).
-- This enforces one budget per section+period combination.
--
-- NOTE: If duplicate (section, period) rows exist, this migration will fail.
-- Resolve duplicates manually before running (keep the row you want, delete others).

-- DropIndex
DROP INDEX IF EXISTS "section_budget_section_period_periodStart_key";

-- CreateIndex
CREATE UNIQUE INDEX "section_budget_section_period_key" ON "section_budget"("section", "period");
