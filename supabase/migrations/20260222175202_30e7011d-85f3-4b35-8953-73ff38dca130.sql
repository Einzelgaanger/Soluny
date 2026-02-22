
-- Trigger to sync vote counts on answers table
CREATE OR REPLACE FUNCTION public.sync_answer_votes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  up_count INT;
  down_count INT;
BEGIN
  -- Determine which answer_id to update
  IF TG_OP = 'DELETE' THEN
    SELECT COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0),
           COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0)
    INTO up_count, down_count
    FROM public.votes WHERE answer_id = OLD.answer_id;

    UPDATE public.answers
    SET upvotes = up_count, downvotes = down_count, net_score = up_count - down_count
    WHERE id = OLD.answer_id;
  ELSE
    SELECT COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0),
           COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0)
    INTO up_count, down_count
    FROM public.votes WHERE answer_id = NEW.answer_id;

    UPDATE public.answers
    SET upvotes = up_count, downvotes = down_count, net_score = up_count - down_count
    WHERE id = NEW.answer_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE TRIGGER on_vote_change
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.sync_answer_votes();

-- Trigger to sync answer_count on questions table
CREATE OR REPLACE FUNCTION public.sync_question_answer_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.questions SET answer_count = (SELECT COUNT(*) FROM public.answers WHERE question_id = OLD.question_id) WHERE id = OLD.question_id;
  ELSE
    UPDATE public.questions SET answer_count = (SELECT COUNT(*) FROM public.answers WHERE question_id = NEW.question_id) WHERE id = NEW.question_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE TRIGGER on_answer_change
AFTER INSERT OR DELETE ON public.answers
FOR EACH ROW EXECUTE FUNCTION public.sync_question_answer_count();

-- Increment view_count function for questions
CREATE OR REPLACE FUNCTION public.increment_view_count(question_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.questions SET view_count = view_count + 1 WHERE id = question_id;
END;
$function$;
