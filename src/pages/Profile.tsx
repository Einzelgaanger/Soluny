import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { User, Award, Loader2 } from "lucide-react";

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

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 text-center">
            <Award className="h-5 w-5 mx-auto text-primary mb-1" />
            <div className="text-lg font-bold font-mono">{profile?.cp_balance || 0}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">CP Balance</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <User className="h-5 w-5 mx-auto text-primary mb-1" />
            <div className="text-lg font-bold capitalize">{profile?.rank || "newcomer"}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rank</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-lg font-bold font-mono">KES {Number(profile?.total_earnings_kes || 0).toFixed(0)}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Total Earned</div>
          </div>
        </div>

        {/* Edit form */}
        <div className="glass-card rounded-xl p-6 space-y-5">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-background/50 border-border/60" />
          </div>
          <div className="space-y-2">
            <Label>Phone (M-Pesa)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="254..." className="bg-background/50 border-border/60" />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="bg-background/50 border-border/60" placeholder="Tell the community about yourself..." />
          </div>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
