import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Clock, ThumbsUp, ThumbsDown, Loader2, Award, Flame, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

const QuestionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const [qRes, aRes] = await Promise.all([
        supabase.from("questions").select("*").eq("id", id).single(),
        supabase.from("answers").select("*").eq("question_id", id).order("net_score", { ascending: false }),
      ]);
      setQuestion(qRes.data as QuestionData | null);
      setAnswers((aRes.data as AnswerData[]) || []);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const submitAnswer = async () => {
    if (!user || !id) return;
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
      toast.error(error.message);
    } else {
      toast.success("Answer submitted!");
      setNewAnswer("");
      const { data } = await supabase.from("answers").select("*").eq("question_id", id).order("net_score", { ascending: false });
      setAnswers((data as AnswerData[]) || []);
    }
  };

  const handleVote = async (answerId: string, value: 1 | -1) => {
    if (!user) return;
    const { error } = await supabase.from("votes").upsert(
      { voter_id: user.id, answer_id: answerId, value },
      { onConflict: "voter_id,answer_id" }
    );
    if (error) toast.error(error.message);
    else toast.success(value === 1 ? "Upvoted!" : "Downvoted!");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!question) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-muted-foreground">Question not found</div>
      </DashboardLayout>
    );
  }

  const isOpen = new Date(question.voting_closes_at) > new Date();

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6 animate-fade-in">
        {/* Question */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold ${
              isOpen ? "bg-success/15 text-success border border-success/30" : "bg-muted text-muted-foreground border border-border/40"
            }`}>
              <Clock className="h-3 w-3" />
              {isOpen
                ? `Voting closes ${formatDistanceToNow(new Date(question.voting_closes_at), { addSuffix: true })}`
                : "Voting closed"}
            </span>
            {Number(question.prize_pool_kes) > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 font-semibold">
                <Flame className="h-3 w-3" /> KES {Number(question.prize_pool_kes).toLocaleString()} pool
              </span>
            )}
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">{question.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{question.body}</p>
          {question.category_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {question.category_tags.map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-muted/50 text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Answers */}
        <div>
          <h2 className="text-base sm:text-lg font-bold mb-4">{answers.length} Answers</h2>
          {answers.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
              No answers yet. Be the first to solve this!
            </div>
          ) : (
            <div className="space-y-3">
              {answers.map((a, i) => (
                <div key={a.id} className={`glass-card rounded-2xl p-4 sm:p-5 space-y-3 ${
                  i === 0 && a.net_score > 0 ? "border-primary/30 glow-gold" : ""
                }`}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {i < 3 && a.net_score > 0 && (
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-muted text-muted-foreground border border-border/40"
                      }`}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </span>
                    {Number(a.earnings_awarded_kes) > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20 ml-auto">
                        +KES {Number(a.earnings_awarded_kes).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{a.body}</p>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => handleVote(a.id, 1)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-success transition-colors px-2.5 py-1.5 rounded-lg hover:bg-success/10"
                    >
                      <ThumbsUp className="h-4 w-4" /> {a.upvotes}
                    </button>
                    <button
                      onClick={() => handleVote(a.id, -1)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2.5 py-1.5 rounded-lg hover:bg-destructive/10"
                    >
                      <ThumbsDown className="h-4 w-4" /> {a.downvotes}
                    </button>
                    <span className="text-xs font-mono font-bold text-primary ml-auto">
                      {a.net_score > 0 ? "+" : ""}{a.net_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit answer */}
        {isOpen && (
          <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold">Your Answer</h3>
            <Textarea
              placeholder="Write a thoughtful solution (min 100 characters)..."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={6}
              className="bg-background/50 border-border/60 rounded-xl"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{newAnswer.length}/5,000</span>
              <Button
                onClick={submitAnswer}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Submit Answer
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuestionDetail;
