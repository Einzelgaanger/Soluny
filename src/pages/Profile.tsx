import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { User, Loader2, Camera } from "lucide-react";
import { getRankConfig, getRankProgress, getSubTier } from "@/lib/ranks";

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
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const rank = getRankConfig(profile?.rank || "newcomer");
  const cp = profile?.cp_balance || 0;
  const cpProgress = getRankProgress(profile?.rank || "newcomer", cp);
  const sub = getSubTier(profile?.subscription_plan || "free");

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
        <h1 className="text-lg font-bold tracking-tight">Profile</h1>

        {/* Avatar & rank */}
        <div className="glass-card rounded-xl p-4 flex items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-xl bg-secondary border border-border/40 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 h-5 w-5 rounded bg-primary text-primary-foreground flex items-center justify-center">
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold">{displayName || "Anonymous"}</div>
            <div className="text-[10px] text-muted-foreground">{user?.email}</div>
            <div className="flex items-center gap-2 mt-1">
              <img src={rank.image} alt={rank.label} className="h-5 w-5 rounded object-cover" />
              <span className={`text-[10px] font-bold ${rank.color}`}>{rank.animal} {rank.label}</span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-secondary text-muted-foreground">{sub.icon} {sub.name}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-card rounded-xl p-2.5 text-center">
            <div className="text-sm font-bold font-mono">{cp}</div>
            <div className="text-[9px] text-muted-foreground">CP</div>
          </div>
          <div className="glass-card rounded-xl p-2.5 text-center">
            <div className="text-sm font-bold font-mono">KES {Number(profile?.total_earnings_kes || 0).toLocaleString()}</div>
            <div className="text-[9px] text-muted-foreground">Earned</div>
          </div>
          <div className="glass-card rounded-xl p-2.5 text-center">
            <div className="text-sm font-bold font-mono">KES {Number(profile?.available_balance_kes || 0).toLocaleString()}</div>
            <div className="text-[9px] text-muted-foreground">Balance</div>
          </div>
        </div>

        {/* XP bar */}
        <div className="glass-card rounded-xl p-3">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className={`font-bold ${rank.color}`}>{rank.label}</span>
            <span className="text-muted-foreground">{rank.nextRank}</span>
          </div>
          <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700" style={{ width: `${cpProgress}%` }} />
          </div>
        </div>

        {/* Edit form */}
        <div className="glass-card rounded-xl p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider">Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-8 text-xs bg-secondary/30 border-border/40 rounded-lg" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider">Phone (M-Pesa)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="254..." className="h-8 text-xs bg-secondary/30 border-border/40 rounded-lg" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider">Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="text-xs bg-secondary/30 border-border/40 rounded-lg resize-none" placeholder="Tell us about yourself..." />
          </div>
          <Button onClick={handleSave} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg h-8 text-xs" disabled={saving}>
            {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
