import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Image, X, Hash } from "lucide-react";
import { toast } from "sonner";

const POST_TYPES = [
  { value: "article", label: "Article" },
  { value: "discussion", label: "Discussion" },
  { value: "image_post", label: "Photo Post" },
  { value: "video", label: "Video" },
  { value: "research_paper", label: "Research Paper" },
  { value: "question", label: "Question" },
];

const QUESTION_SUBTYPES = [
  { value: "problem", label: "Problem" },
  { value: "debate", label: "Debate" },
  { value: "opinion_poll", label: "Opinion Poll" },
  { value: "knowledge_qa", label: "Knowledge Q&A" },
];

const categories = [
  "Technology", "Health", "Education", "Economics", "Law", "Engineering",
  "Agriculture", "Politics", "Environment", "Business", "Science", "Sports",
  "Culture", "Finance", "Security", "Transport", "Energy", "Media",
  "Philosophy", "Psychology", "Sociology", "History", "Mathematics",
  "Arts", "Music", "Food", "Real Estate", "Crypto", "AI", "Climate",
];

const NewPost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("article");
  const [tags, setTags] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Question-specific state
  const [questionType, setQuestionType] = useState("problem");
  const [votingWindow, setVotingWindow] = useState("14");
  const [categoryTags, setCategoryTags] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");

  const isQuestion = type === "question";

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
  };

  const toggleCategory = (tag: string) => {
    setCategoryTags((prev) =>
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

  const handleSubmit = async () => {
    if (!user) return;
    if (!title.trim()) { toast.error("Title is required"); return; }

    if (isQuestion) {
      if (title.length < 10) { toast.error("Title must be at least 10 characters"); return; }
      if (body.length < 50) { toast.error("Body must be at least 50 characters"); return; }
      if (categoryTags.length === 0) { toast.error("Select at least one category"); return; }
    } else {
      if (!body.trim() && type !== "image_post") { toast.error("Content is required"); return; }
    }

    setSubmitting(true);

    if (isQuestion) {
      // Create a question
      const votingDays = parseInt(votingWindow);
      const closesAt = new Date();
      closesAt.setDate(closesAt.getDate() + votingDays);
      const allTags = [...categoryTags, ...hashtags.map(h => `#${h}`)];

      const { error } = await supabase.from("questions").insert({
        author_id: user.id,
        title: title.trim(),
        body: body.trim(),
        type: questionType as any,
        category_tags: allTags,
        voting_closes_at: closesAt.toISOString(),
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Question posted!");
        navigate("/dashboard/feed");
      }
    } else {
      // Create a post
      let coverUrl: string | null = null;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-cover.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("post-media")
          .upload(path, coverFile, { contentType: coverFile.type });
        if (uploadErr) {
          toast.error("Failed to upload image");
          setSubmitting(false);
          return;
        }
        const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(path);
        coverUrl = urlData.publicUrl;
      }

      const tagList = tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        title: title.trim(),
        body: body.trim(),
        type: type as any,
        tags: tagList,
        cover_image_url: coverUrl,
      });

      if (error) {
        toast.error("Failed to create post");
        console.error(error);
      } else {
        toast.success("Post published!");
        navigate("/dashboard/feed");
      }
    }
    setSubmitting(false);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-bold">Create Post</h1>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Post Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-secondary/30 border-border/40 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POST_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Question subtype + voting window */}
          {isQuestion && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Question Type</Label>
                <Select value={questionType} onValueChange={setQuestionType}>
                  <SelectTrigger className="bg-secondary/30 border-border/40 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_SUBTYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Voting Window</Label>
                <Select value={votingWindow} onValueChange={setVotingWindow}>
                  <SelectTrigger className="bg-secondary/30 border-border/40 rounded-xl">
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
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Title {isQuestion && <span className="normal-case font-normal">(10–150 chars)</span>}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isQuestion ? "e.g. How can Nairobi reduce matatu accidents by 30%?" : "Give your post a compelling title..."}
              className="bg-secondary/30 border-border/40 rounded-xl"
              maxLength={isQuestion ? 150 : 200}
            />
            {isQuestion && <span className="text-xs text-muted-foreground">{title.length}/150</span>}
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              {type === "research_paper" ? "Abstract / Paper Content" : isQuestion ? "Description (50+ chars)" : "Content"}
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={isQuestion ? "Describe the problem in detail..." : type === "research_paper" ? "Paste or write your research paper..." : "Write your post content..."}
              className="bg-secondary/30 border-border/40 rounded-xl min-h-[200px] resize-y"
              maxLength={isQuestion ? 5000 : undefined}
            />
            {isQuestion && <span className="text-xs text-muted-foreground">{body.length}/5,000</span>}
          </div>

          {/* Question-specific: Categories */}
          {isQuestion && (
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Categories ({categoryTags.length} selected)</Label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCategory(c)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      categoryTags.includes(c)
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-muted/30 text-muted-foreground border-border/40 hover:border-border"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question-specific: Hashtags */}
          {isQuestion && (
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Hashtags (up to 10)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHashtag(); } }}
                    placeholder="Type a hashtag and press Enter"
                    className="pl-8 bg-secondary/30 border-border/40 rounded-xl"
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addHashtag} className="shrink-0">Add</Button>
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {hashtags.map((h) => (
                    <span key={h} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                      #{h}
                      <button type="button" onClick={() => setHashtags(hashtags.filter(t => t !== h))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cover Image (non-question) */}
          {!isQuestion && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Cover Image</label>
              {coverPreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={coverPreview} alt="" className="w-full max-h-48 object-cover" />
                  <button onClick={removeCover} className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border/40 hover:border-primary/30 transition-colors cursor-pointer">
                  <Image className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload a cover image</span>
                  <input type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
                </label>
              )}
            </div>
          )}

          {/* Tags (non-question) */}
          {!isQuestion && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Tags (comma-separated)</label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. mathematics, physics, research"
                className="bg-secondary/30 border-border/40 rounded-xl"
              />
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
            className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-5"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isQuestion ? "Post Question (Costs 5 CP)" : "Publish Post"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewPost;
