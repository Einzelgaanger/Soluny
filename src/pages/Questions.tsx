import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Clock, MessageSquareText, Eye, Loader2, Flame, ChevronUp, Filter } from "lucide-react";
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

const typeLabels: Record<string, { label: string; color: string }> = {
  problem: { label: "Problem", color: "bg-info/10 text-info" },
  debate: { label: "Debate", color: "bg-warning/10 text-warning" },
  opinion_poll: { label: "Poll", color: "bg-primary/10 text-primary" },
  sponsored_challenge: { label: "Challenge", color: "bg-success/10 text-success" },
  knowledge_qa: { label: "Q&A", color: "bg-muted text-muted-foreground" },
};

const statusColors: Record<string, string> = {
  open: "text-success",
  voting: "text-warning",
  closed: "text-muted-foreground",
};

const Questions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

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

  const filtered = questions.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || q.type === filterType;
    return matchesSearch && matchesType;
  });

  const isActive = (q: Question) => new Date(q.voting_closes_at) > new Date();

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header row - compact */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold tracking-tight">Questions</h1>
          <Link to="/dashboard/questions/new">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg h-8 text-xs px-3">
              <Plus className="h-3.5 w-3.5 mr-1" /> Post
            </Button>
          </Link>
        </div>

        {/* Search + filter bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-secondary/50 border-border/40 rounded-lg"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-8 px-2 text-xs rounded-lg bg-secondary/50 border border-border/40 text-foreground"
          >
            <option value="all">All Types</option>
            <option value="problem">Problem</option>
            <option value="debate">Debate</option>
            <option value="opinion_poll">Poll</option>
            <option value="knowledge_qa">Q&A</option>
          </select>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <MessageSquareText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No questions found
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((q) => {
              const type = typeLabels[q.type] || typeLabels.knowledge_qa;
              const active = isActive(q);
              return (
                <Link key={q.id} to={`/dashboard/questions/${q.id}`} className="block">
                  <div className="py-3 px-1 hover:bg-muted/5 transition-colors group">
                    {/* Top row: type badge + status + time */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${type.color}`}>
                        {type.label}
                      </span>
                      <span className={`text-[10px] font-semibold ${statusColors[q.status] || ""}`}>
                        {q.status === "open" && active ? "● Live" : q.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-1">
                      {q.title}
                    </h3>

                    {/* Preview body */}
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{q.body}</p>

                    {/* Bottom stats row */}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquareText className="h-3 w-3" /> {q.answer_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {q.view_count}
                      </span>
                      {active && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(q.voting_closes_at))} left
                        </span>
                      )}
                      {Number(q.prize_pool_kes) > 0 && (
                        <span className="flex items-center gap-1 text-primary font-bold ml-auto">
                          <Flame className="h-3 w-3" /> KES {Number(q.prize_pool_kes).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {q.category_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {q.category_tags.map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-secondary/50 text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Questions;
