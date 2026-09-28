ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sustainability_goal text;

UPDATE vendor_actions va
SET evidence_file_name = ef.file_name
FROM (
  SELECT DISTINCT ON (vendor_action_id) vendor_action_id, file_name
  FROM evidence_files
  ORDER BY vendor_action_id, id DESC
) ef
WHERE va.id = ef.vendor_action_id
  AND va.evidence_file_name IS NULL;
