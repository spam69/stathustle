import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { REACTION_DEFINITIONS, getReactionDefinition } from "@/lib/reactions";
import type { ReactionEntry, User, Identity } from "@/types";
import { useEffect, useState, useMemo } from "react";
import { Loader2, AlertTriangle } from "lucide-react";

interface ReactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reactions: ReactionEntry[];
}

function getInitials(name: string = "") {
  return name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U";
}

export default function ReactionsModal({ isOpen, onClose, reactions }: ReactionsModalProps) {
  const [usersMap, setUsersMap] = useState<Record<string, User | Identity>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unique userIds from reactions
  const userIds = useMemo(() => Array.from(new Set(reactions.map(r => r.userId))), [reactions]);

  useEffect(() => {
    if (!isOpen || userIds.length === 0) return;
    setIsLoading(true);
    setError(null);
    fetch("/api/users")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((allUsers: (User | Identity)[]) => {
        // Map by id for quick lookup
        const map: Record<string, User | Identity> = {};
        allUsers.forEach(u => { map[u.id] = u; });
        setUsersMap(map);
      })
      .catch(e => setError(e.message || "Unknown error"))
      .finally(() => setIsLoading(false));
  }, [isOpen, userIds.length]);

  // Group reactions by type for display (optional, for sorting)
  const reactionsWithUser = useMemo(() => {
    return reactions.map(r => ({
      ...r,
      user: usersMap[r.userId],
      reactionDef: getReactionDefinition(r.reactionType)
    }));
  }, [reactions, usersMap]);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>All Reactions</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mb-2 text-muted-foreground" />
              <span className="text-muted-foreground">Loading reactors...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
              <span className="text-destructive">{error}</span>
            </div>
          ) : reactionsWithUser.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No reactions yet.</div>
          ) : (
            <div className="space-y-3">
              {reactionsWithUser.map((r, i) => (
                <div key={r.userId + r.reactionType + r.createdAt + i} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={r.user?.profilePictureUrl} alt={r.user?.displayName || r.user?.username} />
                    <AvatarFallback>{getInitials(r.user?.displayName || r.user?.username)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{r.user?.displayName || r.user?.username || "Unknown"}</div>
                    {r.user?.isIdentity && <Badge variant="outline">Identity</Badge>}
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    {r.reactionDef && <r.reactionDef.Icon className={r.reactionDef.colorClass + " h-5 w-5"} />}
                    <span className="text-xs">{r.reactionDef?.label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="pt-4 border-t items-center">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 