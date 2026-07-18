/*
# Add full_lesson content type for comprehensive lesson generation

1. Changes
- Alter the CHECK constraint on generated_content.content_type to include 'full_lesson'.
- The full_lesson payload stores the complete university-level structured lesson with all sections.

2. Notes
- Non-destructive: drops and recreates only the constraint, preserving all existing rows.
- The 'full_lesson' type uses the same caching mechanism (slug + content_type + difficulty).
*/

ALTER TABLE generated_content DROP CONSTRAINT IF EXISTS generated_content_content_type_check;
ALTER TABLE generated_content ADD CONSTRAINT generated_content_content_type_check
  CHECK (content_type IN ('lesson','quiz','flashcards','summary','glossary','full_lesson'));
