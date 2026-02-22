import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Clock, ThumbsUp, ThumbsDown, Loader2, Flame, Send, ArrowLeft, AlertCircle, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getRankConfig } from "@/lib/ranks";

interface QuestionData {
  id: string;
  title: string;
  body: string;
  type: string;
  category_tags: string[];
  status: string;
  voting_closes_at: string;
  answer_count: number;
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
  rank: string;
  avatar_url: string | null;
}

const QuestionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [profiles, setProfiles] = useState<Record<string, AuthorProfile>>({});
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [newAnswer, setNewAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
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
          .select("user_id, display_name, rank, avatar_url")
          .in("user_id", authorIds);
        if (profs) {
          const map: Record<string, AuthorProfile> = {};
          profs.forEach((p: any) => (map[p.user_id] = p));
          setProfiles(map);
        }
      }

      // Fetch user's existing votes
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
    if (hasAnswered) {
      toast.error("You can only submit one answer per question");
      return;
    }
    if (newAnswer.length < 100) {
      toast.error("Answer must be at least 100 characters");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("answers").insert({
      question_id: id,
      author_id: user.id,
      body: newAnswer,
    });
    setSubmitting(false);
    if (error) {
      if (error.message.includes("answers_question_author_unique")) {
        toast.error("You've already answered this question");
        setHasAnswered(true);
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Answer submitted!");
      setNewAnswer("");
      setHasAnswered(true);
      try {
        await supabase.functions.invoke("send-notification", {
          body: { type: "new_answer", question_id: id, user_id: user.id },
        });
      } catch (e) {
        console.error("Notification failed:", e);
      }
      const { data } = await supabase.from("answers").select("*").eq("question_id", id).order("net_score", { ascending: false });
      setAnswers((data as AnswerData[]) || []);
    }
  };

  const handleVote = async (answerId: string, value: 1 | -1) => {
    if (!user) {
      toast.error("Sign in to vote");
      return;
    }
    const currentVote = userVotes[answerId] || 0;

    try {
      if (currentVote === value) {
        // Toggle off — delete vote
        await supabase
          .from("votes")
          .delete()
          .eq("voter_id", user.id)
          .eq("answer_id", answerId);

        setUserVotes((prev) => {
          const next = { ...prev };
          delete next[answerId];
          return next;
        });
        setAnswers((prev) =>
          prev.map((a) =>
            a.id === answerId
              ? {
                  ...a,
                  net_score: a.net_score - value,
                  upvotes: value === 1 ? a.upvotes - 1 : a.upvotes,
                  downvotes: value === -1 ? a.downvotes - 1 : a.downvotes,
                }
              : a
          )
        );
      } else {
        // Check if existing vote exists
        if (currentVote !== 0) {
          // Update existing vote
          await supabase
            .from("votes")
            .update({ value, updated_at: new Date().toISOString() })
            .eq("voter_id", user.id)
            .eq("answer_id", answerId);
        } else {
          // Insert new vote
          await supabase
            .from("votes")
            .insert({ voter_id: user.id, answer_id: answerId, value });
        }

        const oldValue = currentVote;
        setUserVotes((prev) => ({ ...prev, [answerId]: value }));
        setAnswers((prev) =>
          prev.map((a) => {
            if (a.id !== answerId) return a;
            let newUp = a.upvotes;
            let newDown = a.downvotes;
            if (oldValue === 1) newUp--;
            if (oldValue === -1) newDown--;
            if (value === 1) newUp++;
            if (value === -1) newDown++;
            return { ...a, upvotes: newUp, downvotes: newDown, net_score: newUp - newDown };
          })
        );
      }
    } catch (err) {
      console.error("Vote error:", err);
      toast.error("Failed to vote");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  if (!question) {
    return (
      <DashboardLayout>
        <div className="text-center py-16 text-muted-foreground text-sm">Question not found</div>
      </DashboardLayout>
    );
  }

  const isOpen = new Date(question.voting_closes_at) > new Date();
  const questionAuthor = profiles[question.author_id];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <Link to="/dashboard/questions" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to questions
        </Link>

        {/* Question card */}
        <div className="space-y-3 pb-4 border-b border-border/30">
          <div className="flex items-center gap-2 text-[10px]">
            {questionAuthor && (
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-full bg-secondary overflow-hidden">
                  {questionAuthor.avatar_url ? (
                    <img src={questionAuthor.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                      {(questionAuthor.display_name || "?")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="font-medium text-foreground">{questionAuthor.display_name || "Anonymous"}</span>
                <span className={`${getRankConfig(questionAuthor.rank).color} font-semibold`}>
                  {getRankConfig(questionAuthor.rank).animal}
                </span>
              </div>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}</span>
          </div>

          <h1 className="text-base sm:text-lg font-bold tracking-tight leading-snug">{question.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{question.body}</p>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
              isOpen ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
            }`}>
              <Clock className="h-3 w-3" />
              {isOpen ? `${formatDistanceToNow(new Date(question.voting_closes_at))} left` : "Closed"}
            </span>
            {Number(question.prize_pool_kes) > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-bold">
                <Flame className="h-3 w-3" /> KES {Number(question.prize_pool_kes).toLocaleString()}
              </span>
            )}
            {question.category_tags.map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-secondary/50 text-muted-foreground">
                {tag}
              </span>
            ))}
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
                const author = profiles[a.author_id];
                const rank = author ? getRankConfig(author.rank) : getRankConfig("newcomer");
                const myVote = userVotes[a.id] || 0;
                const isTop = i === 0 && a.net_score > 0 && answers.length > 1;

                return (
                  <div key={a.id} className={`py-3 ${isTop ? "bg-primary/[0.03] -mx-1 px-1 rounded-lg" : ""}`}>
                    {/* Author info */}
                    <div className="flex items-center gap-1.5 text-[10px] mb-1.5">
                      {isTop && <Trophy className="h-3 w-3 text-primary" />}
                      <div className="h-4 w-4 rounded-full bg-secondary overflow-hidden shrink-0">
                        {author?.avatar_url ? (
                          <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-muted-foreground">
                            {(author?.display_name || "?")[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="font-medium">{author?.display_name || "Anonymous"}</span>
                      <span className={rank.color}>{rank.animal}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                      {Number(a.earnings_awarded_kes) > 0 && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                          +KES {Number(a.earnings_awarded_kes).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Answer body */}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">{a.body}</p>

                    {/* Like / Unlike buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleVote(a.id, 1)}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all ${
                          myVote === 1
                            ? "bg-success/15 text-success font-semibold"
                            : "text-muted-foreground hover:bg-success/10 hover:text-success"
                        }`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>{a.upvotes}</span>
                      </button>
                      <button
                        onClick={() => handleVote(a.id, -1)}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all ${
                          myVote === -1
                            ? "bg-destructive/15 text-destructive font-semibold"
                            : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        }`}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        <span>{a.downvotes}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit answer */}
        {isOpen && !hasAnswered && (
          <div className="border-t border-border/30 pt-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Answer</h3>
            <Textarea
              placeholder="Write a thoughtful solution (min 100 characters). You can only submit once!"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={4}
              className="text-sm bg-secondary/30 border-border/40 rounded-lg resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{newAnswer.length}/5,000</span>
              <Button
                onClick={submitAnswer}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg h-8 text-xs"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                Submit
              </Button>
            </div>
          </div>
        )}

        {isOpen && hasAnswered && (
          <div className="border-t border-border/30 pt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            You've already submitted your answer to this question.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuestionDetail;
