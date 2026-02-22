
-- Add unique constraint: one answer per user per question
ALTER TABLE public.answers 
ADD CONSTRAINT answers_question_author_unique UNIQUE (question_id, author_id);

-- Add unique constraint on votes for upsert to work properly
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'votes_voter_answer_unique'
  ) THEN
    ALTER TABLE public.votes ADD CONSTRAINT votes_voter_answer_unique UNIQUE (voter_id, answer_id);
  END IF;
END $$;

-- Add new subscription plan values
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'bronze';
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'silver';
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'gold';
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'platinum';
