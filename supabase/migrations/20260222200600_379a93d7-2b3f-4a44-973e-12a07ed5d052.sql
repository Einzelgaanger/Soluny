
-- 1. Create missing triggers for answer count sync and vote sync
CREATE TRIGGER trg_sync_answer_count
AFTER INSERT OR DELETE ON public.answers
FOR EACH ROW EXECUTE FUNCTION public.sync_question_answer_count();

CREATE TRIGGER trg_sync_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.sync_answer_votes();

-- 2. Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (lower(username));

-- 3. Fix existing answer counts to be accurate
UPDATE public.questions q SET answer_count = (
  SELECT COUNT(*) FROM public.answers a WHERE a.question_id = q.id
);

-- 4. Create messages table for DMs
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read"
ON public.messages FOR UPDATE
USING (auth.uid() = receiver_id);

CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at DESC);

-- 5. Add withdrawal limits table for retention
CREATE TABLE public.withdrawal_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan text NOT NULL UNIQUE,
  min_withdrawal numeric NOT NULL DEFAULT 500,
  max_withdrawal numeric NOT NULL DEFAULT 5000,
  daily_limit numeric NOT NULL DEFAULT 1,
  cooldown_hours integer NOT NULL DEFAULT 24,
  fee_percentage numeric NOT NULL DEFAULT 5
);

INSERT INTO public.withdrawal_settings (plan, min_withdrawal, max_withdrawal, daily_limit, cooldown_hours, fee_percentage) VALUES
('free', 500, 2000, 1, 72, 10),
('bronze', 300, 5000, 1, 48, 8),
('silver', 200, 10000, 2, 24, 5),
('gold', 100, 25000, 3, 12, 3),
('platinum', 50, 100000, 5, 6, 1);

ALTER TABLE public.withdrawal_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Withdrawal settings are viewable by everyone"
ON public.withdrawal_settings FOR SELECT USING (true);

-- 6. Add last_withdrawal_at to profiles for cooldown tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_withdrawal_at timestamptz;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
