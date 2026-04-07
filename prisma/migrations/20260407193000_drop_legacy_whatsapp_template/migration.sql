-- Backfill checkout template from legacy column when needed
UPDATE "stores"
SET "settings" = jsonb_set(
  COALESCE("settings", '{}'::jsonb),
  '{checkout,whatsappTemplate}',
  to_jsonb(COALESCE(NULLIF("whatsappTemplate", ''), 'Ola! Segue meu pedido:')),
  true
)
WHERE "whatsappTemplate" IS NOT NULL
  AND COALESCE("settings"->'checkout'->>'whatsappTemplate', '') = '';

ALTER TABLE "stores"
DROP COLUMN IF EXISTS "whatsappTemplate";
