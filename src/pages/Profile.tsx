import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { User, Award, Loader2, Camera } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setDisplayName(data.display_name || "");
          setBio(data.bio || "");
          setPhone(data.phone_number || "");
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, bio, phone_number: phone })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated!");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const rank = profile?.rank || "newcomer";

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Profile</h1>

        {/* Avatar & rank header */}
        <div className="glass-card gradient-border rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-muted border-2 border-border/40 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="text-lg font-bold">{displayName || "Anonymous"}</div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-semibold text-primary capitalize">
              <Award className="h-3 w-3" /> {rank.replace("_", " ")}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-xl font-bold font-mono">{profile?.cp_balance || 0}</div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">CP Balance</div>
          </div>
          <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-xl font-bold font-mono">KES {Number(profile?.total_earnings_kes || 0).toLocaleString()}</div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Total Earned</div>
          </div>
          <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-xl font-bold font-mono capitalize">{profile?.subscription_plan || "free"}</div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Plan</div>
          </div>
        </div>

        {/* Edit form */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-11 bg-background/50 border-border/60 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Phone (M-Pesa)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="254..." className="h-11 bg-background/50 border-border/60 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider">Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="bg-background/50 border-border/60 rounded-xl" placeholder="Tell the community about yourself..." />
          </div>
          <Button onClick={handleSave} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl h-11" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
