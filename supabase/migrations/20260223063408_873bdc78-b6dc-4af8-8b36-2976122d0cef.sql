
-- ══════════════════════════════════════════════════
-- POSTS / CONTENT SYSTEM
-- ══════════════════════════════════════════════════

-- Post type enum
CREATE TYPE public.post_type AS ENUM ('article', 'video', 'image_post', 'research_paper', 'discussion');

-- Posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  type public.post_type NOT NULL DEFAULT 'article',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  media_urls TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authors can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- Index for feed queries
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_type ON public.posts(type);

-- ══════════════════════════════════════════════════
-- POST LIKES
-- ══════════════════════════════════════════════════

CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════
-- POST COMMENTS
-- ══════════════════════════════════════════════════

CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  body TEXT NOT NULL,
  parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own comments" ON public.post_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own comments" ON public.post_comments FOR DELETE USING (auth.uid() = author_id);

CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id, created_at);

-- ══════════════════════════════════════════════════
-- FOLLOWS
-- ══════════════════════════════════════════════════

CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- Add follower/following counts to profiles
ALTER TABLE public.profiles
  ADD COLUMN follower_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN following_count INTEGER NOT NULL DEFAULT 0;

-- ══════════════════════════════════════════════════
-- BADGES
-- ══════════════════════════════════════════════════

CREATE TYPE public.badge_category AS ENUM ('followers', 'content', 'earnings', 'streak', 'special');

CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'award',
  category public.badge_category NOT NULL,
  threshold INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'primary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges are viewable by everyone" ON public.badges FOR SELECT USING (true);

-- User badges (earned)
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System can award badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed default badges
INSERT INTO public.badges (name, description, icon, category, threshold, color) VALUES
  -- Follower badges
  ('Rising Star', 'Gained 100 followers', 'star', 'followers', 100, 'primary'),
  ('Popular', 'Gained 1,000 followers', 'trending-up', 'followers', 1000, 'info'),
  ('Influencer', 'Gained 10,000 followers', 'crown', 'followers', 10000, 'warning'),
  ('Celebrity', 'Gained 100,000 followers', 'sparkles', 'followers', 100000, 'destructive'),
  -- Content badges
  ('First Post', 'Published your first post', 'pen-line', 'content', 1, 'success'),
  ('Prolific Writer', 'Published 10 posts', 'book-open', 'content', 10, 'info'),
  ('Content Machine', 'Published 50 posts', 'zap', 'content', 50, 'primary'),
  ('Thought Leader', 'Published 100 posts', 'brain', 'content', 100, 'warning'),
  -- Earnings badges
  ('First Earnings', 'Earned your first KES 100', 'coins', 'earnings', 100, 'success'),
  ('Earning Pro', 'Earned KES 10,000 total', 'wallet', 'earnings', 10000, 'info'),
  ('High Earner', 'Earned KES 100,000 total', 'trophy', 'earnings', 100000, 'primary'),
  ('Top Earner', 'Earned KES 1,000,000 total', 'gem', 'earnings', 1000000, 'warning'),
  -- Streak badges
  ('Week Warrior', '7-day login streak', 'flame', 'streak', 7, 'success'),
  ('Month Master', '30-day login streak', 'flame', 'streak', 30, 'info'),
  ('Century Club', '100-day login streak', 'flame', 'streak', 100, 'primary');

-- ══════════════════════════════════════════════════
-- CONTENT EARNINGS (view-based)
-- ══════════════════════════════════════════════════

CREATE TABLE public.content_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  views_counted INTEGER NOT NULL DEFAULT 0,
  amount_kes NUMERIC NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authors can view own content earnings" ON public.content_earnings FOR SELECT USING (auth.uid() = author_id);

-- ══════════════════════════════════════════════════
-- TRIGGERS: Auto-update counts
-- ══════════════════════════════════════════════════

-- Follow count trigger
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET follower_count = follower_count + 1 WHERE user_id = NEW.following_id;
    UPDATE public.profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET follower_count = GREATEST(0, follower_count - 1) WHERE user_id = OLD.following_id;
    UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE user_id = OLD.follower_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_follow_change
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- Post like count trigger
CREATE OR REPLACE FUNCTION public.update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_post_like_change
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.update_post_like_count();

-- Post comment count trigger
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_post_comment_change
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_post_comment_count();

-- Post view increment function
CREATE OR REPLACE FUNCTION public.increment_post_views(p_post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.posts SET view_count = view_count + 1 WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable realtime for posts and follows
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;

-- Storage bucket for post media
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('post-media', 'post-media', true, 52428800)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view post media" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "Authenticated users can upload post media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own post media" ON storage.objects FOR UPDATE USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own post media" ON storage.objects FOR DELETE USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
