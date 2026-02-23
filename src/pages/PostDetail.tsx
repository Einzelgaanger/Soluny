import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, ArrowLeft, Heart, Eye, MessageSquare, Send, BookOpen, Video,
  Image, FileText, Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ChatAvatar from "@/components/chat/ChatAvatar";
import { getRankConfig } from "@/lib/ranks";
import { toast } from "sonner";

const POST_TYPE_LABELS: Record<string, string> = {
  article: "Article",
  video: "Video",
  image_post: "Photo",
  research_paper: "Research Paper",
  discussion: "Discussion",
};

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [postRes, commentsRes] = await Promise.all([
        supabase.from("posts").select("*").eq("id", id).single(),
        supabase.from("post_comments").select("*").eq("post_id", id).order("created_at", { ascending: true }),
      ]);

      if (postRes.data) {
        setPost(postRes.data);
        setLikeCount(postRes.data.like_count);

        // Fetch author
        const { data: prof } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_url, rank, follower_count")
          .eq("user_id", postRes.data.author_id)
          .single();
        setAuthor(prof);

        // Increment view
        await supabase.rpc("increment_post_views", { p_post_id: id });
      }

      // Fetch comment authors
      const rawComments = commentsRes.data || [];
      if (rawComments.length > 0) {
        const authorIds = [...new Set(rawComments.map((c: any) => c.author_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_url, rank")
          .in("user_id", authorIds);
        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        setComments(rawComments.map((c: any) => ({ ...c, profile: profileMap.get(c.author_id) })));
      }

      // Check if user liked
      if (user) {
        const { data: likeData } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        setLiked(!!likeData);
      }

      setLoading(false);
    };
    load();
  }, [id, user]);

  const toggleLike = async () => {
    if (!user || !id) return;
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", user.id);
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("post_likes").insert({ post_id: id, user_id: user.id });
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  const submitComment = async () => {
    if (!user || !id || !commentBody.trim()) return;
    setSubmittingComment(true);
    const { data, error } = await supabase.from("post_comments").insert({
      post_id: id,
      author_id: user.id,
      body: commentBody.trim(),
    }).select().single();

    if (error) {
      toast.error("Failed to post comment");
    } else {
      const { data: prof } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, rank")
        .eq("user_id", user.id)
        .single();
      setComments((prev) => [...prev, { ...data, profile: prof }]);
      setCommentBody("");
      toast.success("Comment posted!");
    }
    setSubmittingComment(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  if (!post) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-muted-foreground">Post not found</div>
      </DashboardLayout>
    );
  }

  const rank = author ? getRankConfig(author.rank || "newcomer") : null;

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-3xl mx-auto">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Post */}
        <div className="glass-card rounded-2xl p-5 sm:p-8 mb-4">
          {/* Type badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
              {POST_TYPE_LABELS[post.type] || post.type}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black mb-4 leading-tight">{post.title}</h1>

          {/* Author */}
          {author && (
            <Link to={`/dashboard/user/${author.user_id}`} className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
              <ChatAvatar url={author.avatar_url} name={author.display_name} size="md" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold">{author.display_name || "Anonymous"}</span>
                  {rank && <img src={rank.image} alt="" className="h-4 w-4 rounded object-cover" />}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  @{author.username || "user"} · {author.follower_count} followers
                </div>
              </div>
            </Link>
          )}

          {/* Cover */}
          {post.cover_image_url && (
            <div className="rounded-xl overflow-hidden mb-6">
              <img src={post.cover_image_url} alt="" className="w-full max-h-96 object-cover" />
            </div>
          )}

          {/* Body */}
          <div className="prose prose-sm dark:prose-invert max-w-none mb-6 whitespace-pre-wrap text-foreground leading-relaxed">
            {post.body}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {post.tags.map((tag: string) => (
                <span key={tag} className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 pt-4 border-t border-border/20">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-2 text-sm transition-colors ${liked ? "text-destructive font-bold" : "text-muted-foreground hover:text-destructive"}`}
            >
              <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
              {likeCount}
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-5 w-5" /> {comments.length}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-5 w-5" /> {post.view_count}
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold mb-4">Comments ({comments.length})</h3>

          {/* Comment input */}
          {user && (
            <div className="flex gap-2 mb-4">
              <Textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Share your thoughts..."
                className="bg-secondary/30 border-border/40 rounded-xl min-h-[60px] resize-none text-sm"
              />
              <Button
                onClick={submitComment}
                disabled={submittingComment || !commentBody.trim()}
                size="sm"
                className="bg-primary text-primary-foreground rounded-xl shrink-0 self-end"
              >
                {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {comments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => {
                const cRank = c.profile ? getRankConfig(c.profile.rank || "newcomer") : null;
                return (
                  <div key={c.id} className="flex gap-3 p-3 rounded-xl bg-secondary/10">
                    <ChatAvatar url={c.profile?.avatar_url} name={c.profile?.display_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Link to={`/dashboard/user/${c.author_id}`} className="text-xs font-bold hover:text-primary transition-colors">
                          {c.profile?.display_name || "Anonymous"}
                        </Link>
                        {cRank && <img src={cRank.image} alt="" className="h-3.5 w-3.5 rounded object-cover" />}
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{c.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PostDetail;
