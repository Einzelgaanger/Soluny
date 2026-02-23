
-- Wallet transactions table for internal transfers
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('transfer', 'top_up', 'tip')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can see transactions they're part of
CREATE POLICY "Users can view own transactions"
ON public.wallet_transactions FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can create transactions where they are the sender
CREATE POLICY "Users can send money"
ON public.wallet_transactions FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Function to transfer money between wallets
CREATE OR REPLACE FUNCTION public.transfer_funds(
  p_receiver_id UUID,
  p_amount NUMERIC,
  p_type TEXT DEFAULT 'transfer',
  p_note TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id UUID;
  v_sender_balance NUMERIC;
  v_tx_id UUID;
BEGIN
  v_sender_id := auth.uid();
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF v_sender_id = p_receiver_id THEN
    RAISE EXCEPTION 'Cannot send to yourself';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Lock sender row
  SELECT available_balance_kes INTO v_sender_balance
  FROM profiles WHERE user_id = v_sender_id FOR UPDATE;

  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Debit sender
  UPDATE profiles SET available_balance_kes = available_balance_kes - p_amount
  WHERE user_id = v_sender_id;

  -- Credit receiver
  UPDATE profiles SET available_balance_kes = available_balance_kes + p_amount
  WHERE user_id = p_receiver_id;

  -- Record transaction
  INSERT INTO wallet_transactions (sender_id, receiver_id, amount, type, note)
  VALUES (v_sender_id, p_receiver_id, p_amount, p_type, p_note)
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$;

-- Set binfred.ke@gmail.com as verified expert
UPDATE public.profiles
SET is_verified_expert = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'binfred.ke@gmail.com');
