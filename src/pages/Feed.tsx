import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Heart, MessageSquare, Eye, Plus, TrendingUp, Clock, Users,
  BookOpen, Video, Image, FileText, HelpCircle, Flame, BadgeCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ChatAvatar from "@/components/chat/ChatAvatar";
import { getRankConfig } from "@/lib/ranks";

const CONTENT_TYPE_ICONS: Record<string, any> = {
  article: BookOpen,
  video: Video,
  image_post: Image,
  research_paper: FileText,
  discussion: MessageSquare,
  question: HelpCircle,
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  article: "Article",
  video: "Video",
  image_post: "Photo",
  research_paper: "Research",
  discussion: "Discussion",
  question: "Question",
};

interface FeedItem {
  id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;
  author_id: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  cover_image_url?: string | null;
  tags?: string[] | null;
  profiles?: any;
  // Question-specific
  is_question: boolean;
  prize_pool_kes?: number;
  status?: string;
  voting_closes_at?: string;
  answer_count?: number;
}

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("trending");
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

  const loadFeed = async (sort: string) => {
    setLoading(true);

    // Fetch posts
    let postQuery = supabase
      .from("posts")
      .select("*")
      .eq("is_published", true)
      .order(sort === "trending" ? "like_count" : "created_at", { ascending: false })
      .limit(50);

    // Fetch questions
    let questionQuery = supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (sort === "following" && user) {
      const { data: followIds } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const ids = followIds?.map((f: any) => f.following_id) || [];
      if (ids.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      postQuery = postQuery.in("author_id", ids);
      questionQuery = questionQuery.in("author_id", ids);
    }

    const [postsRes, questionsRes] = await Promise.all([postQuery, questionQuery]);

    const posts = (postsRes.data || []).map((p: any) => ({
      ...p,
      is_question: false,
      comment_count: p.comment_count || 0,
    }));

    const questions = (questionsRes.data || []).map((q: any) => ({
      id: q.id,
      title: q.title,
      body: q.body,
      type: "question",
      created_at: q.created_at,
      author_id: q.author_id,
      like_count: 0,
      comment_count: q.answer_count || 0,
      view_count: q.view_count || 0,
      tags: q.category_tags,
      is_question: true,
      prize_pool_kes: q.prize_pool_kes,
      status: q.status,
      voting_closes_at: q.voting_closes_at,
      answer_count: q.answer_count,
    }));

    const all = [...posts, ...questions];

    // Sort
    if (sort === "trending") {
      all.sort((a, b) => (b.like_count + b.view_count) - (a.like_count + a.view_count));
    } else {
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Fetch profiles for all unique authors
    const authorIds = [...new Set(all.map((i) => i.author_id))];
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, rank, is_verified_expert")
        .in("user_id", authorIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      all.forEach((item) => {
        item.profiles = profileMap.get(item.author_id) || null;
      });
    }

    setItems(all);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setLikedPostIds(new Set((data || []).map((l: any) => l.post_id)));
      });
  }, [user]);

  useEffect(() => {
    loadFeed(tab);
  }, [tab, user]);

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const liked = likedPostIds.has(postId);
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      setLikedPostIds((prev) => { const n = new Set(prev); n.delete(postId); return n; });
      setItems((prev) => prev.map((p) => p.id === postId ? { ...p, like_count: Math.max(0, p.like_count - 1) } : p));
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
      setLikedPostIds((prev) => new Set(prev).add(postId));
      setItems((prev) => prev.map((p) => p.id === postId ? { ...p, like_count: p.like_count + 1 } : p));
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className={`${isMobile ? "text-lg" : "text-xl"} font-bold tracking-tight`}>Feed</h1>
          <Link to="/dashboard/feed/new">
            <Button size="sm" className="bg-primary text-primary-foreground rounded-xl font-bold gap-1.5">
              <Plus className="h-4 w-4" /> Post
            </Button>
          </Link>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="w-full bg-secondary/40 rounded-xl h-9">
            <TabsTrigger value="trending" className="flex-1 rounded-lg text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-7">
              <TrendingUp className="h-3.5 w-3.5 mr-1" /> Trending
            </TabsTrigger>
            <TabsTrigger value="latest" className="flex-1 rounded-lg text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-7">
              <Clock className="h-3.5 w-3.5 mr-1" /> Latest
            </TabsTrigger>
            {user && (
              <TabsTrigger value="following" className="flex-1 rounded-lg text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-7">
                <Users className="h-3.5 w-3.5 mr-1" /> Following
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const profile = item.profiles;
              const rank = profile ? getRankConfig(profile.rank || "newcomer") : null;
              const TypeIcon = CONTENT_TYPE_ICONS[item.type] || BookOpen;
              const liked = likedPostIds.has(item.id);
              const detailUrl = item.is_question
                ? `/dashboard/questions/${item.id}`
                : `/dashboard/feed/${item.id}`;

              return (
                <div key={item.id} className="glass-card rounded-2xl p-4 sm:p-5 hover:border-primary/20 transition-all">
                  {/* Author row */}
                  <div className="flex items-center gap-3 mb-3">
                    <Link to={`/dashboard/user/${item.author_id}`}>
                      <ChatAvatar url={profile?.avatar_url} name={profile?.display_name} size="sm" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/dashboard/user/${item.author_id}`} className="text-sm font-semibold truncate hover:text-primary transition-colors">
                          {profile?.display_name || "Anonymous"}
                        </Link>
                        {rank && <img src={rank.image} alt="" className="h-4 w-4 rounded object-cover" />}
                        {profile?.is_verified_expert && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                        <span className="text-[10px] text-muted-foreground">@{profile?.username || "user"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <TypeIcon className="h-3 w-3" />
                        <span>{CONTENT_TYPE_LABELS[item.type]}</span>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                        {item.is_question && item.status && (
                          <>
                            <span>·</span>
                            <span className={item.status === "open" ? "text-green-500 font-bold" : "text-muted-foreground"}>
                              {item.status === "open" ? "● Live" : item.status}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <Link to={detailUrl} className="block group">
                    <h2 className="text-base sm:text-lg font-bold mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </h2>
                    {item.body && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                        {item.body.replace(/<[^>]*>/g, '').substring(0, 300)}
                      </p>
                    )}
                    {!item.is_question && item.cover_image_url && (
                      <div className="rounded-xl overflow-hidden mb-3 max-h-64">
                        <img src={item.cover_image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </Link>

                  {/* Question prize */}
                  {item.is_question && Number(item.prize_pool_kes) > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-primary font-bold mb-3">
                      <Flame className="h-3.5 w-3.5" /> KES {Number(item.prize_pool_kes).toLocaleString()} prize pool
                    </div>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {item.tags.slice(0, 5).map((tag: string) => (
                        <span key={tag} className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t border-border/20">
                    {!item.is_question && (
                      <button
                        onClick={() => toggleLike(item.id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? "text-destructive font-bold" : "text-muted-foreground hover:text-destructive"}`}
                      >
                        <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                        {item.like_count > 0 && item.like_count}
                      </button>
                    )}
                    <Link to={detailUrl} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <MessageSquare className="h-4 w-4" />
                      {item.is_question ? (item.answer_count || 0) : (item.comment_count > 0 && item.comment_count)}
                      {item.is_question && <span className="ml-0.5">answers</span>}
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {item.view_count}
                    </div>
                    {item.is_question && item.voting_closes_at && new Date(item.voting_closes_at) > new Date() && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(item.voting_closes_at))} left
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Feed;
