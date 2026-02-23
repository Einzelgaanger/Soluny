import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquareText, Trophy, Coins, ArrowLeft, Send, User, UserPlus, UserCheck, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRankConfig } from "@/lib/ranks";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [profRes, qRes, aRes, postsRes, badgesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("questions").select("id, title, created_at, answer_count, status").eq("author_id", userId).order("created_at", { ascending: false }).limit(10),
        supabase.from("answers").select("id, body, net_score, upvotes, created_at, question_id, earnings_awarded_kes").eq("author_id", userId).order("created_at", { ascending: false }).limit(10),
        supabase.from("posts").select("id, title, type, like_count, comment_count, view_count, created_at").eq("author_id", userId).eq("is_published", true).order("created_at", { ascending: false }).limit(10),
        supabase.from("user_badges").select("*, badges(*)").eq("user_id", userId).order("earned_at", { ascending: false }),
      ]);
      setProfile(profRes.data);
      setQuestions(qRes.data || []);
      setAnswers(aRes.data || []);
      setPosts(postsRes.data || []);
      setBadges(badgesRes.data || []);
      if (profRes.data) {
        setFollowerCount(profRes.data.follower_count || 0);
        setFollowingCount(profRes.data.following_count || 0);
      }

      // Check if following
      if (user && userId !== user.id) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", userId)
          .maybeSingle();
        setIsFollowing(!!followData);
      }

      setLoading(false);
    };
    load();
  }, [userId, user]);

  const toggleFollow = async () => {
    if (!user || !userId) return;
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
      setIsFollowing(false);
      setFollowerCount((c) => Math.max(0, c - 1));
      toast.success("Unfollowed");
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: userId });
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
      toast.success("Following!");
    }
  };

  if (loading) {
    return <DashboardLayout><div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></DashboardLayout>;
  }

  if (!profile) {
    return <DashboardLayout><div className="text-center py-16 text-muted-foreground">User not found</div></DashboardLayout>;
  }

  const rank = getRankConfig(profile.rank || "newcomer");
  const isOwnProfile = user?.id === userId;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4 lg:space-y-6 animate-fade-in">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-xs lg:text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3 lg:h-4 lg:w-4" /> Back
        </button>

        {/* Profile header */}
        <div className="glass-card rounded-xl lg:rounded-2xl p-4 lg:p-6">
          <div className={`${isMobile ? "flex items-center gap-4 mb-3" : "flex items-center gap-6"}`}>
            <div className={`${isMobile ? "h-14 w-14" : "h-20 w-20"} rounded-2xl bg-secondary border-2 border-border/40 overflow-hidden shrink-0`}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className={`${isMobile ? "h-6 w-6" : "h-8 w-8"} text-muted-foreground`} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`${isMobile ? "text-base" : "text-xl"} font-bold`}>{profile.display_name || "Anonymous"}</h1>
              {profile.username && <p className="text-xs lg:text-sm text-muted-foreground">@{profile.username}</p>}
              <div className="flex items-center gap-2 mt-1">
                <img src={rank.image} alt={rank.label} className="h-5 w-5 lg:h-6 lg:w-6 rounded object-cover" />
                <span className={`text-xs lg:text-sm font-bold ${rank.color}`}>{rank.label}</span>
                <span className="text-xs font-mono text-muted-foreground">{profile.cp_balance} CP</span>
              </div>
              {/* Follower stats */}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span><strong className="text-foreground">{followerCount}</strong> followers</span>
                <span><strong className="text-foreground">{followingCount}</strong> following</span>
              </div>
              {profile.bio && <p className="text-xs lg:text-sm text-muted-foreground mt-2 line-clamp-2">{profile.bio}</p>}
            </div>
          </div>

          {/* Action buttons */}
          {!isOwnProfile && user && (
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                onClick={toggleFollow}
                className={`font-semibold rounded-lg h-8 text-xs gap-1.5 ${isFollowing ? "border-primary/30" : "bg-primary text-primary-foreground"}`}
              >
                {isFollowing ? <><UserCheck className="h-3.5 w-3.5" /> Following</> : <><UserPlus className="h-3.5 w-3.5" /> Follow</>}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/dashboard/community/${userId}`)}
                className="font-semibold rounded-lg h-8 text-xs gap-1.5 border-border/40"
              >
                <Send className="h-3.5 w-3.5" /> Message
              </Button>
            </div>
          )}
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div>
            <h2 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" /> Badges
            </h2>
            <div className="flex flex-wrap gap-2">
              {badges.map((ub: any) => (
                <div key={ub.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <Award className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-bold text-primary">{ub.badges?.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 lg:gap-3">
          <div className="glass-card rounded-xl p-3 text-center">
            <MessageSquareText className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm font-bold font-mono">{questions.length}</div>
            <div className="text-[9px] text-muted-foreground">Questions</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <Trophy className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm font-bold font-mono">{answers.length}</div>
            <div className="text-[9px] text-muted-foreground">Answers</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <MessageSquareText className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm font-bold font-mono">{posts.length}</div>
            <div className="text-[9px] text-muted-foreground">Posts</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <Coins className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-sm font-bold font-mono text-[11px]">KES {Number(profile.total_earnings_kes || 0).toLocaleString()}</div>
            <div className="text-[9px] text-muted-foreground">Earned</div>
          </div>
        </div>

        {/* Posts */}
        {posts.length > 0 && (
          <div>
            <h2 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Recent Posts</h2>
            <div className="divide-y divide-border/20">
              {posts.map((p: any) => (
                <Link key={p.id} to={`/dashboard/feed/${p.id}`} className="block py-2 lg:py-3 hover:bg-muted/5 rounded-lg px-2 transition-colors">
                  <h3 className="text-sm font-medium hover:text-primary transition-colors line-clamp-1">{p.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span>❤ {p.like_count}</span>
                    <span>💬 {p.comment_count}</span>
                    <span>👁 {p.view_count}</span>
                    <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Questions */}
        <div>
          <h2 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Recent Questions</h2>
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No questions yet</p>
          ) : (
            <div className="divide-y divide-border/20">
              {questions.map((q) => (
                <Link key={q.id} to={`/dashboard/questions/${q.id}`} className="block py-2 lg:py-3 hover:bg-muted/5 rounded-lg px-2 transition-colors">
                  <h3 className="text-sm lg:text-base font-medium hover:text-primary transition-colors line-clamp-1">{q.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[10px] lg:text-xs text-muted-foreground">
                    <span>{q.answer_count} answers</span>
                    <span>{formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Answers */}
        <div>
          <h2 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Recent Answers</h2>
          {answers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No answers yet</p>
          ) : (
            <div className="divide-y divide-border/20">
              {answers.map((a) => (
                <Link key={a.id} to={`/dashboard/questions/${a.question_id}`} className="block py-2 lg:py-3 hover:bg-muted/5 rounded-lg px-2 transition-colors">
                  <p className="text-sm line-clamp-2">{a.body}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] lg:text-xs text-muted-foreground">
                    <span>▲ {a.upvotes}</span>
                    <span>Score: {a.net_score}</span>
                    {Number(a.earnings_awarded_kes) > 0 && <span className="text-primary font-bold">+KES {Number(a.earnings_awarded_kes).toLocaleString()}</span>}
                    <span>{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserProfile;
