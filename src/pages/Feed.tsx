import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2, Heart, MessageSquare, Eye, PenLine, Image, Video, FileText,
  BookOpen, Plus, Filter, TrendingUp, Clock, Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ChatAvatar from "@/components/chat/ChatAvatar";
import { getRankConfig } from "@/lib/ranks";

const POST_TYPE_ICONS: Record<string, any> = {
  article: BookOpen,
  video: Video,
  image_post: Image,
  research_paper: FileText,
  discussion: MessageSquare,
};

const POST_TYPE_LABELS: Record<string, string> = {
  article: "Article",
  video: "Video",
  image_post: "Photo",
  research_paper: "Research",
  discussion: "Discussion",
};

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("trending");
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

  const loadPosts = async (sort: string) => {
    setLoading(true);
    let query = supabase
      .from("posts")
      .select("*, profiles!posts_author_id_fkey(display_name, username, avatar_url, rank)")
      .eq("is_published", true);

    if (sort === "trending") {
      query = query.order("like_count", { ascending: false }).limit(50);
    } else if (sort === "latest") {
      query = query.order("created_at", { ascending: false }).limit(50);
    } else if (sort === "following" && user) {
      const { data: followIds } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const ids = followIds?.map((f: any) => f.following_id) || [];
      if (ids.length > 0) {
        query = query.in("author_id", ids).order("created_at", { ascending: false }).limit(50);
      } else {
        setPosts([]);
        setLoading(false);
        return;
      }
    }

    const { data, error } = await query;
    
    if (error) {
      // If the join fails (no FK), load without profiles
      const { data: plainPosts } = await supabase
        .from("posts")
        .select("*")
        .eq("is_published", true)
        .order(sort === "trending" ? "like_count" : "created_at", { ascending: false })
        .limit(50);
      
      if (plainPosts) {
        // Fetch profiles separately
        const authorIds = [...new Set(plainPosts.map((p: any) => p.author_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_url, rank")
          .in("user_id", authorIds);
        
        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        setPosts(plainPosts.map((p: any) => ({ ...p, profiles: profileMap.get(p.author_id) || null })));
      }
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  // Load user's liked posts
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
    loadPosts(tab);
  }, [tab, user]);

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const liked = likedPostIds.has(postId);
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      setLikedPostIds((prev) => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, like_count: Math.max(0, p.like_count - 1) } : p));
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
      setLikedPostIds((prev) => new Set(prev).add(postId));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, like_count: p.like_count + 1 } : p));
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className={`${isMobile ? "text-lg" : "text-xl"} font-bold tracking-tight`}>Feed</h1>
          <Link to="/dashboard/feed/new">
            <Button size="sm" className="bg-primary text-primary-foreground rounded-xl font-bold gap-1.5">
              <Plus className="h-4 w-4" /> Post
            </Button>
          </Link>
        </div>

        {/* Tabs */}
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

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const profile = post.profiles;
              const rank = profile ? getRankConfig(profile.rank || "newcomer") : null;
              const TypeIcon = POST_TYPE_ICONS[post.type] || BookOpen;
              const liked = likedPostIds.has(post.id);

              return (
                <div key={post.id} className="glass-card rounded-2xl p-4 sm:p-5 hover:border-primary/20 transition-all">
                  {/* Author row */}
                  <div className="flex items-center gap-3 mb-3">
                    <Link to={`/dashboard/user/${post.author_id}`}>
                      <ChatAvatar url={profile?.avatar_url} name={profile?.display_name} size="sm" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/dashboard/user/${post.author_id}`} className="text-sm font-semibold truncate hover:text-primary transition-colors">
                          {profile?.display_name || "Anonymous"}
                        </Link>
                        {rank && <img src={rank.image} alt="" className="h-4 w-4 rounded object-cover" />}
                        <span className="text-[10px] text-muted-foreground">@{profile?.username || "user"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <TypeIcon className="h-3 w-3" />
                        <span>{POST_TYPE_LABELS[post.type]}</span>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <Link to={`/dashboard/feed/${post.id}`} className="block group">
                    <h2 className="text-base sm:text-lg font-bold mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    {post.body && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                        {post.body.replace(/<[^>]*>/g, '').substring(0, 300)}
                      </p>
                    )}
                    {post.cover_image_url && (
                      <div className="rounded-xl overflow-hidden mb-3 max-h-64">
                        <img src={post.cover_image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </Link>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.tags.slice(0, 5).map((tag: string) => (
                        <span key={tag} className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t border-border/20">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? "text-destructive font-bold" : "text-muted-foreground hover:text-destructive"}`}
                    >
                      <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                      {post.like_count > 0 && post.like_count}
                    </button>
                    <Link to={`/dashboard/feed/${post.id}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <MessageSquare className="h-4 w-4" />
                      {post.comment_count > 0 && post.comment_count}
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {post.view_count}
                    </div>
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
