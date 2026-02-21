
-- Drop all restrictive policies and recreate as permissive

-- profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- questions
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can create questions" ON public.questions;
DROP POLICY IF EXISTS "Authors can update their own questions" ON public.questions;

CREATE POLICY "Questions are viewable by everyone" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create questions" ON public.questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their own questions" ON public.questions FOR UPDATE USING (auth.uid() = author_id);

-- answers
DROP POLICY IF EXISTS "Answers are viewable by everyone" ON public.answers;
DROP POLICY IF EXISTS "Authenticated users can create answers" ON public.answers;
DROP POLICY IF EXISTS "Authors can update their own answers" ON public.answers;

CREATE POLICY "Answers are viewable by everyone" ON public.answers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create answers" ON public.answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their own answers" ON public.answers FOR UPDATE USING (auth.uid() = author_id);

-- votes
DROP POLICY IF EXISTS "Users can view all votes" ON public.votes;
DROP POLICY IF EXISTS "Users can create votes" ON public.votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.votes;

CREATE POLICY "Users can view all votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes" ON public.votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = voter_id);
CREATE POLICY "Users can update their own votes" ON public.votes FOR UPDATE USING (auth.uid() = voter_id);
CREATE POLICY "Users can delete their own votes" ON public.votes FOR DELETE USING (auth.uid() = voter_id);

-- payments
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON public.payments;

CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- earnings
DROP POLICY IF EXISTS "Users can view their own earnings" ON public.earnings;
CREATE POLICY "Users can view their own earnings" ON public.earnings FOR SELECT USING (auth.uid() = user_id);

-- flags
DROP POLICY IF EXISTS "Users can view their own flags" ON public.flags;
DROP POLICY IF EXISTS "Users can create flags" ON public.flags;

CREATE POLICY "Users can view their own flags" ON public.flags FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users can create flags" ON public.flags FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- Also recreate triggers that are missing
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER update_questions_updated_at 
  BEFORE UPDATE ON public.questions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER update_answers_updated_at 
  BEFORE UPDATE ON public.answers 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
