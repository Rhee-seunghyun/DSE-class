-- Add 'description' type to question_type enum for section descriptions
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'description';

-- Add 'has_other' column to form_questions for "기타" option support
ALTER TABLE form_questions ADD COLUMN IF NOT EXISTS has_other boolean NOT NULL DEFAULT false;