import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ClipboardEdit, Award } from "lucide-react";

type AthleteProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  target_weight: number | null;
  goal_description: string | null;
  primary_goal?: string | null;
  fitness_score: number | null;
  recovery_score: number | null;
  consistency_score: number | null;
};

export function AthleteProfileCard({ profile }: { profile: AthleteProfile }) {
  const initials = (profile.full_name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start gap-5">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-semibold">{profile.full_name || "Unnamed athlete"}</h2>
          <div className="text-sm text-muted-foreground">{profile.email}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.age && <Badge variant="secondary">{profile.age} yrs</Badge>}
            {profile.gender && <Badge variant="secondary" className="capitalize">{profile.gender}</Badge>}
            {profile.height && <Badge variant="secondary">{profile.height} cm</Badge>}
            {(profile.primary_goal || profile.goal_description) && (
              <Badge className="bg-primary/15 text-primary" variant="secondary">
                {profile.primary_goal || profile.goal_description}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><MessageSquare className="mr-2 h-4 w-4" /> Message</Button>
          <Button variant="outline" size="sm"><ClipboardEdit className="mr-2 h-4 w-4" /> Adjust plan</Button>
          <Button size="sm"><Award className="mr-2 h-4 w-4" /> Recognize</Button>
        </div>
      </div>
    </div>
  );
}
