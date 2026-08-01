-- Deduplicate trade_model_options (keep oldest/smallest id per model/storage/condition).
-- Re-point trade_requests first so FK trade_requests_optionId_fkey is not violated.

-- 1) Point requests at the survivor row for each duplicate group
UPDATE "trade_requests" tr
SET "optionId" = keeper.id
FROM "trade_model_options" dup
JOIN "trade_model_options" keeper
  ON keeper."modelId" = dup."modelId"
 AND keeper.storage = dup.storage
 AND keeper.condition::text = dup.condition::text
 AND keeper.id < dup.id
 AND NOT EXISTS (
   SELECT 1
   FROM "trade_model_options" k2
   WHERE k2."modelId" = dup."modelId"
     AND k2.storage = dup.storage
     AND k2.condition::text = dup.condition::text
     AND k2.id < keeper.id
 )
WHERE tr."optionId" = dup.id
  AND dup.id <> keeper.id;

-- 2) Remove duplicate options (accessory rules cascade via FK)
DELETE FROM "trade_model_options" a
USING "trade_model_options" b
WHERE a.id > b.id
  AND a."modelId" = b."modelId"
  AND a.storage = b.storage
  AND a.condition::text = b.condition::text;

-- 3) Enforce uniqueness going forward
CREATE UNIQUE INDEX IF NOT EXISTS "trade_model_options_modelId_storage_condition_key"
  ON "trade_model_options" ("modelId", storage, condition);
