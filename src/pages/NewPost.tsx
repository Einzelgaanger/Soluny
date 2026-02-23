import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Image, X } from "lucide-react";
import { toast } from "sonner";

const POST_TYPES = [
  { value: "article", label: "Article" },
  { value: "discussion", label: "Discussion" },
  { value: "image_post", label: "Photo Post" },
  { value: "video", label: "Video" },
  { value: "research_paper", label: "Research Paper" },
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

  const handleSubmit = async () => {
    if (!user) return;
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!body.trim() && type !== "image_post") { toast.error("Content is required"); return; }

    setSubmitting(true);

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

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your post a compelling title..."
              className="bg-secondary/30 border-border/40 rounded-xl"
              maxLength={200}
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              {type === "research_paper" ? "Abstract / Paper Content" : "Content"}
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={type === "research_paper" ? "Paste or write your research paper..." : "Write your post content..."}
              className="bg-secondary/30 border-border/40 rounded-xl min-h-[200px] resize-y"
            />
          </div>

          {/* Cover Image */}
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

          {/* Tags */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Tags (comma-separated)</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. mathematics, physics, research"
              className="bg-secondary/30 border-border/40 rounded-xl"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
            className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-5"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Publish Post
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewPost;
