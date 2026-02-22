import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Clock, ThumbsUp, ThumbsDown, Loader2, Flame, Send, ArrowLeft, AlertCircle, Trophy, Eye, MessageSquareText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getRankConfig } from "@/lib/ranks";
import { ReadMore } from "@/components/ui/read-more";

interface QuestionData {
  id: string;
  title: string;
  body: string;
  type: string;
  category_tags: string[];
  status: string;
  voting_closes_at: string;
  answer_count: number;
  view_count: number;
  prize_pool_kes: number;
  created_at: string;
  author_id: string;
}

interface AnswerData {
  id: string;
  body: string;
  net_score: number;
  upvotes: number;
  downvotes: number;
  author_id: string;
  created_at: string;
  rank_position: number | null;
  earnings_awarded_kes: number;
}

interface AuthorProfile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  rank: string;
  avatar_url: string | null;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  problem: { label: "Problem", color: "bg-info/10 text-info" },
  debate: { label: "Debate", color: "bg-warning/10 text-warning" },
  opinion_poll: { label: "Poll", color: "bg-primary/10 text-primary" },
  sponsored_challenge: { label: "Challenge", color: "bg-success/10 text-success" },
  knowledge_qa: { label: "Q&A", color: "bg-muted text-muted-foreground" },
};

const QuestionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [profiles, setProfiles] = useState<Record<string, AuthorProfile>>({});
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [newAnswer, setNewAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);

  const loadAnswers = async () => {
    if (!id) return;
    const { data } = await supabase.from("answers").select("*").eq("question_id", id).order("net_score", { ascending: false });
    const answerData = (data as AnswerData[]) || [];
    setAnswers(answerData);
    return answerData;
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try { await supabase.rpc("increment_view_count", { question_id: id }); } catch {}
      const [qRes, aRes] = await Promise.all([
        supabase.from("questions").select("*").eq("id", id).single(),
        supabase.from("answers").select("*").eq("question_id", id).order("net_score", { ascending: false }),
      ]);
      setQuestion(qRes.data as QuestionData | null);
      const answerData = (aRes.data as AnswerData[]) || [];
      setAnswers(answerData);

      if (user) {
        setHasAnswered(answerData.some((a) => a.author_id === user.id));
      }

      const authorIds = [...new Set(answerData.map((a) => a.author_id))];
      if (qRes.data) authorIds.push(qRes.data.author_id);
      if (authorIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, rank, avatar_url")
          .in("user_id", authorIds);
        if (profs) {
          const map: Record<string, AuthorProfile> = {};
          profs.forEach((p: any) => (map[p.user_id] = p));
          setProfiles(map);
        }
      }

      if (user && answerData.length > 0) {
        const { data: votes } = await supabase
          .from("votes")
          .select("answer_id, value")
          .eq("voter_id", user.id)
          .in("answer_id", answerData.map((a) => a.id));
        if (votes) {
          const vMap: Record<string, number> = {};
          votes.forEach((v: any) => (vMap[v.answer_id] = v.value));
          setUserVotes(vMap);
        }
      }

      setLoading(false);
    };
    load();
  }, [id, user]);

  const submitAnswer = async () => {
    if (!user || !id) return;
    if (hasAnswered) { toast.error("You can only submit one answer per question"); return; }
    if (newAnswer.length < 100) { toast.error("Answer must be at least 100 characters"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("answers").insert({
      question_id: id, author_id: user.id, body: newAnswer,
    });
    setSubmitting(false);
    if (error) {
      if (error.message.includes("answers_question_author_unique")) {
        toast.error("You've already answered this question");
        setHasAnswered(true);
      } else { toast.error(error.message); }
    } else {
      toast.success("Answer submitted!");
      setNewAnswer("");
      setHasAnswered(true);
      try {
        await supabase.functions.invoke("send-notification", {
          body: { type: "new_answer", question_id: id, user_id: user.id },
        });
      } catch (e) { console.error("Notification failed:", e); }
      await loadAnswers();
    }
  };

  const handleVote = async (answerId: string, value: 1 | -1) => {
    if (!user) { toast.error("Sign in to vote"); return; }
    if (voting) return;
    setVoting(answerId);
    const currentVote = userVotes[answerId] || 0;

    try {
      if (currentVote === value) {
        await supabase.from("votes").delete().eq("voter_id", user.id).eq("answer_id", answerId);
        setUserVotes((prev) => { const next = { ...prev }; delete next[answerId]; return next; });
      } else if (currentVote !== 0) {
        await supabase.from("votes").update({ value, updated_at: new Date().toISOString() }).eq("voter_id", user.id).eq("answer_id", answerId);
        setUserVotes((prev) => ({ ...prev, [answerId]: value }));
      } else {
        await supabase.from("votes").insert({ voter_id: user.id, answer_id: answerId, value });
        setUserVotes((prev) => ({ ...prev, [answerId]: value }));
      }
      const { data: updated } = await supabase.from("answers").select("id, upvotes, downvotes, net_score").eq("question_id", id!);
      if (updated) {
        setAnswers((prev) => prev.map((a) => {
          const fresh = updated.find((u: any) => u.id === a.id);
          return fresh ? { ...a, upvotes: fresh.upvotes, downvotes: fresh.downvotes, net_score: fresh.net_score } : a;
        }));
      }
    } catch (err) {
      console.error("Vote error:", err);
      toast.error("Failed to vote");
    } finally {
      setVoting(null);
    }
  };

  if (loading) {
    return <DashboardLayout><div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></DashboardLayout>;
  }

  if (!question) {
    return <DashboardLayout><div className="text-center py-16 text-muted-foreground text-sm">Question not found</div></DashboardLayout>;
  }

  const isOpen = new Date(question.voting_closes_at) > new Date();
  const questionAuthor = profiles[question.author_id];
  const type = typeLabels[question.type] || typeLabels.knowledge_qa;

  const AuthorBadge = ({ authorId, size = "sm" }: { authorId: string; size?: "sm" | "md" }) => {
    const author = profiles[authorId];
    if (!author) return null;
    const rank = getRankConfig(author.rank);
    const avatarSize = size === "sm" ? "h-5 w-5 lg:h-7 lg:w-7" : "h-8 w-8 lg:h-10 lg:w-10";
    const textSize = size === "sm" ? "text-[10px] lg:text-xs" : "text-xs lg:text-sm";
    return (
      <Link to={`/dashboard/user/${authorId}`} className="inline-flex items-center gap-1.5 lg:gap-2 hover:opacity-80 transition-opacity">
        <div className={`${avatarSize} rounded-full bg-secondary overflow-hidden shrink-0`}>
          {author.avatar_url ? (
            <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[8px] lg:text-xs font-bold text-muted-foreground">
              {(author.display_name || "?")[0].toUpperCase()}
            </div>
          )}
        </div>
        <span className={`${textSize} font-medium text-foreground`}>{author.display_name || "Anonymous"}</span>
        {author.username && <span className={`${textSize} text-muted-foreground`}>@{author.username}</span>}
        <img src={rank.image} alt="" className="h-4 w-4 lg:h-5 lg:w-5 rounded object-cover" />
        <span className={`${rank.color} font-semibold ${textSize}`}>{rank.label}</span>
      </Link>
    );
  };

  return (
    <DashboardLayout>
      <div className={`mx-auto space-y-4 lg:space-y-6 animate-fade-in ${isMobile ? "" : "max-w-4xl"}`}>
        <Link to="/dashboard/questions" className="inline-flex items-center gap-1 text-xs lg:text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3 lg:h-4 lg:w-4" /> Back to questions
        </Link>

        {isMobile ? (
          /* ======================== MOBILE ======================== */
          <>
            {/* Question */}
            <div className="space-y-2 pb-3 border-b border-border/30">
              <div className="flex items-center gap-2 text-[10px]">
                <span className={`font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${type.color}`}>{type.label}</span>
                <span className={`font-semibold ${isOpen ? "text-success" : "text-muted-foreground"}`}>
                  {isOpen ? "● Live" : "Closed"}
                </span>
              </div>
              <h1 className="text-base font-bold leading-snug">{question.title}</h1>
              <AuthorBadge authorId={question.author_id} />
              <ReadMore text={question.body} className="text-sm text-muted-foreground leading-relaxed" />
              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                {isOpen && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(question.voting_closes_at))} left
                  </span>
                )}
                {Number(question.prize_pool_kes) > 0 && (
                  <span className="inline-flex items-center gap-1 text-primary font-bold">
                    <Flame className="h-3 w-3" /> KES {Number(question.prize_pool_kes).toLocaleString()}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Eye className="h-3 w-3" /> {question.view_count}
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <MessageSquareText className="h-3 w-3" /> {answers.length}
                </span>
              </div>
            </div>

            {/* Answers */}
            <div className="space-y-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{answers.length} Answers</h2>
              {answers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No answers yet. Be the first!</p>
              ) : (
                <div className="divide-y divide-border/20">
                  {answers.map((a, i) => {
                    const myVote = userVotes[a.id] || 0;
                    const isTop = i === 0 && a.net_score > 0 && answers.length > 1;
                    return (
                      <div key={a.id} className={`py-3 ${isTop ? "bg-primary/[0.03] -mx-1 px-1 rounded-lg" : ""}`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {isTop && <Trophy className="h-3 w-3 text-primary" />}
                          <AuthorBadge authorId={a.author_id} />
                          <span className="text-[9px] text-muted-foreground ml-auto">
                            {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <ReadMore text={a.body} className="text-sm leading-relaxed mb-2" />
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleVote(a.id, 1)} disabled={voting === a.id}
                            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all ${myVote === 1 ? "bg-success/15 text-success font-semibold" : "text-muted-foreground hover:bg-success/10 hover:text-success"}`}>
                            <ThumbsUp className="h-3.5 w-3.5" /> <span>{a.upvotes}</span>
                          </button>
                          <button onClick={() => handleVote(a.id, -1)} disabled={voting === a.id}
                            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all ${myVote === -1 ? "bg-destructive/15 text-destructive font-semibold" : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"}`}>
                            <ThumbsDown className="h-3.5 w-3.5" /> <span>{a.downvotes}</span>
                          </button>
                          {Number(a.earnings_awarded_kes) > 0 && (
                            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                              +KES {Number(a.earnings_awarded_kes).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* ======================== DESKTOP ======================== */
          <div className="grid grid-cols-[1fr_280px] gap-6">
            <div className="space-y-6">
              {/* Question */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${type.color}`}>{type.label}</span>
                  <span className={`text-sm font-semibold ${isOpen ? "text-success" : "text-muted-foreground"}`}>
                    {isOpen ? "● Live" : "Closed"}
                  </span>
                  <span className="text-sm text-muted-foreground ml-auto">{formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight leading-snug">{question.title}</h1>
                <AuthorBadge authorId={question.author_id} size="md" />
                <ReadMore text={question.body} className="text-base text-muted-foreground leading-relaxed" />
                <div className="flex flex-wrap items-center gap-3">
                  {question.category_tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary/50 text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Answers */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{answers.length} Answers</h2>
                {answers.length === 0 ? (
                  <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">No answers yet. Be the first!</div>
                ) : (
                  <div className="space-y-3">
                    {answers.map((a, i) => {
                      const myVote = userVotes[a.id] || 0;
                      const isTop = i === 0 && a.net_score > 0 && answers.length > 1;
                      return (
                        <div key={a.id} className={`glass-card rounded-2xl p-5 ${isTop ? "ring-1 ring-primary/30 bg-primary/[0.02]" : ""}`}>
                          <div className="flex items-center gap-2 mb-3">
                            {isTop && <Trophy className="h-4 w-4 text-primary" />}
                            <AuthorBadge authorId={a.author_id} size="md" />
                            <span className="text-xs text-muted-foreground ml-auto">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                            {Number(a.earnings_awarded_kes) > 0 && (
                              <span className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary font-bold">
                                +KES {Number(a.earnings_awarded_kes).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <ReadMore text={a.body} className="text-base leading-relaxed mb-4" />
                          <div className="flex items-center gap-4">
                            <button onClick={() => handleVote(a.id, 1)} disabled={voting === a.id}
                              className={`inline-flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-full transition-all ${myVote === 1 ? "bg-success/15 text-success font-semibold" : "text-muted-foreground hover:bg-success/10 hover:text-success"}`}>
                              <ThumbsUp className="h-4 w-4" /> <span>{a.upvotes}</span>
                            </button>
                            <button onClick={() => handleVote(a.id, -1)} disabled={voting === a.id}
                              className={`inline-flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-full transition-all ${myVote === -1 ? "bg-destructive/15 text-destructive font-semibold" : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"}`}>
                              <ThumbsDown className="h-4 w-4" /> <span>{a.downvotes}</span>
                            </button>
                            <span className="text-sm font-mono text-muted-foreground ml-auto">Score: {a.net_score}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit answer */}
              {isOpen && !hasAnswered && (
                <div className="glass-card rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Your Answer</h3>
                  <Textarea
                    placeholder="Write a thoughtful solution (min 100 characters). You can only submit once!"
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    rows={5}
                    className="text-base bg-secondary/30 border-border/40 rounded-xl resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{newAnswer.length}/5,000</span>
                    <Button onClick={submitAnswer} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl h-10" disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Submit Answer
                    </Button>
                  </div>
                </div>
              )}

              {isOpen && hasAnswered && (
                <div className="glass-card rounded-2xl p-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" /> You've already submitted your answer to this question.
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Eye className="h-4 w-4" /> Views</span>
                    <span className="font-mono font-bold">{question.view_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><MessageSquareText className="h-4 w-4" /> Answers</span>
                    <span className="font-mono font-bold">{answers.length}</span>
                  </div>
                  {isOpen && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-4 w-4" /> Time Left</span>
                      <span className="font-mono font-bold text-xs">{formatDistanceToNow(new Date(question.voting_closes_at))}</span>
                    </div>
                  )}
                  {Number(question.prize_pool_kes) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-primary"><Flame className="h-4 w-4" /> Prize</span>
                      <span className="font-mono font-bold text-primary">KES {Number(question.prize_pool_kes).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {question.category_tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 rounded-lg text-[10px] font-medium bg-secondary/50 text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Prize breakdown */}
              {Number(question.prize_pool_kes) > 0 && (
                <div className="glass-card rounded-2xl p-4 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prize Split</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span>🥇 1st Place</span><span className="font-bold">50%</span></div>
                    <div className="flex justify-between"><span>🥈 2nd Place</span><span className="font-bold">30%</span></div>
                    <div className="flex justify-between"><span>🥉 3rd Place</span><span className="font-bold">20%</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuestionDetail;
