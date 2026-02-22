import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, X, Hash } from "lucide-react";

const categories = [
  "Technology", "Health", "Education", "Economics", "Law", "Engineering",
  "Agriculture", "Politics", "Environment", "Business", "Science", "Sports",
  "Culture", "Finance", "Security", "Transport", "Energy", "Media",
  "Philosophy", "Psychology", "Sociology", "History", "Mathematics",
  "Arts", "Music", "Food", "Real Estate", "Crypto", "AI", "Climate",
];

const NewQuestion = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<string>("problem");
  const [tags, setTags] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [votingWindow, setVotingWindow] = useState("3");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (title.length < 10) { toast.error("Title must be at least 10 characters"); return; }
    if (body.length < 50) { toast.error("Body must be at least 50 characters"); return; }
    if (tags.length === 0) { toast.error("Select at least one category"); return; }

    setLoading(true);
    const votingDays = parseInt(votingWindow);
    const closesAt = new Date();
    closesAt.setDate(closesAt.getDate() + votingDays);

    // Combine categories + hashtags into category_tags
    const allTags = [...tags, ...hashtags.map(h => `#${h}`)];

    const { error } = await supabase.from("questions").insert({
      author_id: user.id,
      title,
      body,
      type: type as any,
      category_tags: allTags,
      voting_closes_at: closesAt.toISOString(),
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Question posted!");
      navigate("/dashboard/questions");
    }
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addHashtag = () => {
    const cleaned = hashtagInput.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
    if (cleaned && !hashtags.includes(cleaned) && hashtags.length < 10) {
      setHashtags([...hashtags, cleaned]);
    }
    setHashtagInput("");
  };

  const removeHashtag = (h: string) => {
    setHashtags(hashtags.filter((t) => t !== h));
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Post a Question</h1>
          <p className="text-sm text-muted-foreground">Submit a real challenge for the community to solve</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-5">
          <div className="space-y-2">
            <Label>Title (10–150 chars)</Label>
            <Input
              placeholder="e.g. How can Nairobi reduce matatu accidents by 30%?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              className="bg-background/50 border-border/60"
            />
            <span className="text-xs text-muted-foreground">{title.length}/150</span>
          </div>

          <div className="space-y-2">
            <Label>Body (50–5,000 chars)</Label>
            <Textarea
              placeholder="Describe the problem in detail..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={5000}
              rows={8}
              className="bg-background/50 border-border/60"
            />
            <span className="text-xs text-muted-foreground">{body.length}/5,000</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-background/50 border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="problem">Problem</SelectItem>
                  <SelectItem value="debate">Debate</SelectItem>
                  <SelectItem value="opinion_poll">Opinion Poll</SelectItem>
                  <SelectItem value="knowledge_qa">Knowledge Q&A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Voting Window</Label>
              <Select value={votingWindow} onValueChange={setVotingWindow}>
                <SelectTrigger className="bg-background/50 border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">24 Hours</SelectItem>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category tags - unlimited */}
          <div className="space-y-2">
            <Label>Categories ({tags.length} selected)</Label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleTag(c)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                    tags.includes(c)
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-muted/30 text-muted-foreground border-border/40 hover:border-border"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Custom hashtags */}
          <div className="space-y-2">
            <Label>Hashtags (up to 10)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHashtag(); } }}
                  placeholder="Type a hashtag and press Enter"
                  className="pl-8 bg-background/50 border-border/60"
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addHashtag} className="shrink-0">Add</Button>
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((h) => (
                  <span key={h} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-info/10 text-info border border-info/20">
                    #{h}
                    <button type="button" onClick={() => removeHashtag(h)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Post Question (Costs 5 CP)
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default NewQuestion;
