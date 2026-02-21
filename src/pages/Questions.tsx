import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Clock, MessageSquareText, ThumbsUp, Loader2, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type QuestionType = "problem" | "debate" | "opinion_poll" | "sponsored_challenge" | "knowledge_qa";

interface Question {
  id: string;
  title: string;
  body: string;
  type: QuestionType;
  category_tags: string[];
  status: string;
  voting_closes_at: string;
  answer_count: number;
  view_count: number;
  created_at: string;
  author_id: string;
  prize_pool_kes: number;
}

const typeColors: Record<string, string> = {
  problem: "bg-info/15 text-info border-info/30",
  debate: "bg-warning/15 text-warning border-warning/30",
  opinion_poll: "bg-primary/15 text-primary border-primary/30",
  sponsored_challenge: "bg-success/15 text-success border-success/30",
  knowledge_qa: "bg-muted text-muted-foreground border-border",
};

const Questions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setQuestions((data as Question[]) || []);
      setLoading(false);
    };
    fetchQuestions();
  }, []);

  const filtered = questions.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Questions</h1>
            <p className="text-sm text-muted-foreground">Browse challenges and submit your solutions</p>
          </div>
          <Link to="/dashboard/questions/new">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl">
              <Plus className="h-4 w-4 mr-2" /> Post Question
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-background/50 border-border/60 rounded-xl"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <MessageSquareText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No questions yet. Be the first to post one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((q) => (
              <Link key={q.id} to={`/dashboard/questions/${q.id}`}>
                <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <h3 className="text-sm sm:text-base font-semibold leading-snug flex-1">{q.title}</h3>
                    <span className={`shrink-0 inline-flex items-center px-2 sm:px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide border ${typeColors[q.type] || typeColors.knowledge_qa}`}>
                      {q.type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{q.body}</p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquareText className="h-3 w-3" /> {q.answer_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" /> {q.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                    </span>
                    {Number(q.prize_pool_kes) > 0 && (
                      <span className="flex items-center gap-1 text-primary font-semibold">
                        <Flame className="h-3 w-3" /> KES {Number(q.prize_pool_kes).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {q.category_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {q.category_tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-muted/50 text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Questions;
