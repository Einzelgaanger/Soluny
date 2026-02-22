import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Clock, MessageSquareText, Eye, Loader2, Flame, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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
  const [filterTag, setFilterTag] = useState<string>("all");

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

  const allTags = [...new Set(questions.flatMap((q) => q.category_tags))].sort();

  const filtered = questions.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.body.toLowerCase().includes(search.toLowerCase()) ||
      q.category_tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType === "all" || q.type === filterType;
    const matchesTag = filterTag === "all" || q.category_tags.includes(filterTag);
    return matchesSearch && matchesType && matchesTag;
  });

  const isActive = (q: Question) => new Date(q.voting_closes_at) > new Date();

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header row with filters inline on desktop */}
        <div className="flex flex-col gap-3">
          {/* Title + Post button */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg lg:text-2xl font-bold tracking-tight">Questions</h1>
            <Link to="/dashboard/questions/new">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg h-8 lg:h-10 text-xs lg:text-sm px-3 lg:px-4">
                <Plus className="h-3.5 w-3.5 lg:h-4 lg:w-4 mr-1" /> Post
              </Button>
            </Link>
          </div>

          {/* Filters row - between header and content */}
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px] lg:w-[140px] h-8 lg:h-9 text-xs lg:text-sm bg-secondary/50 border-border/40 rounded-lg">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border shadow-lg z-50">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="problem">Problem</SelectItem>
                <SelectItem value="debate">Debate</SelectItem>
                <SelectItem value="opinion_poll">Poll</SelectItem>
                <SelectItem value="knowledge_qa">Q&A</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-[120px] lg:w-[140px] h-8 lg:h-9 text-xs lg:text-sm bg-secondary/50 border-border/40 rounded-lg">
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border shadow-lg z-50 max-h-60">
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search bar - separate */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions, tags, #hashtags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 lg:h-10 text-xs lg:text-sm bg-secondary/50 border-border/40 rounded-lg"
            />
          </div>
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
          /* Mobile: compact list, Desktop: card grid */
          <div className="space-y-0 lg:space-y-0">
            {/* Mobile feed */}
            <div className="lg:hidden divide-y divide-border/30">
              {filtered.map((q) => {
                const type = typeLabels[q.type] || typeLabels.knowledge_qa;
                const active = isActive(q);
                return (
                  <Link key={q.id} to={`/dashboard/questions/${q.id}`} className="block">
                    <div className="py-3 px-1 hover:bg-muted/5 transition-colors group">
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
                      <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-1">
                        {q.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{q.body}</p>
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
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop feed - wider cards with more info */}
            <div className="hidden lg:block divide-y divide-border/20">
              {filtered.map((q) => {
                const type = typeLabels[q.type] || typeLabels.knowledge_qa;
                const active = isActive(q);
                const cats = q.category_tags.filter((t) => !t.startsWith("#"));
                const hashes = q.category_tags.filter((t) => t.startsWith("#"));
                return (
                  <Link key={q.id} to={`/dashboard/questions/${q.id}`} className="block">
                    <div className="py-4 px-3 hover:bg-muted/5 transition-colors group rounded-lg">
                      <div className="flex items-start gap-4">
                        {/* Stats sidebar */}
                        <div className="flex flex-col items-center gap-1 pt-1 min-w-[60px] text-center">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquareText className="h-3.5 w-3.5" />
                            <span className="font-mono font-bold">{q.answer_count}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3.5 w-3.5" />
                            <span className="font-mono">{q.view_count}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${type.color}`}>
                              {type.label}
                            </span>
                            <span className={`text-[11px] font-semibold ${statusColors[q.status] || ""}`}>
                              {q.status === "open" && active ? "● Live" : q.status}
                            </span>
                            {active && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(q.voting_closes_at))} left
                              </span>
                            )}
                            <span className="text-[11px] text-muted-foreground ml-auto">
                              {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                            </span>
                          </div>

                          <h3 className="text-base font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {q.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{q.body}</p>

                          <div className="flex items-center gap-2 mt-2">
                            {Number(q.prize_pool_kes) > 0 && (
                              <span className="flex items-center gap-1 text-xs text-primary font-bold">
                                <Flame className="h-3.5 w-3.5" /> KES {Number(q.prize_pool_kes).toLocaleString()}
                              </span>
                            )}
                            {(cats.length > 0 || hashes.length > 0) && (
                              <div className="flex flex-wrap gap-1 ml-auto">
                                {cats.slice(0, 3).map((tag) => (
                                  <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary/50 text-muted-foreground">
                                    {tag}
                                  </span>
                                ))}
                                {hashes.slice(0, 2).map((tag) => (
                                  <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-info/10 text-info">
                                    {tag}
                                  </span>
                                ))}
                                {cats.length + hashes.length > 5 && (
                                  <span className="text-[10px] text-muted-foreground">+{cats.length + hashes.length - 5}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Questions;
