import { useState } from "react";
import { Link } from "react-router-dom";
import { useCommunities, useCreateCommunity, useJoinCommunity, useLeaveCommunity } from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthProvider";
import { CommunityCard } from "@/components/community/CommunityCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Hash, X } from "lucide-react";
import { toast } from "sonner";

const Community = () => {
  const { user } = useAuth();
  const { data: communities, isLoading, error } = useCommunities();
  const createCommunityMutation = useCreateCommunity();
  const joinCommunityMutation = useJoinCommunity();
  const leaveCommunityMutation = useLeaveCommunity();

  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDescription, setNewCommunityDescription] = useState("");
  const [newCommunityCategory, setNewCommunityCategory] = useState("");

  const filteredCommunities = communities?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCommunity = async () => {
    if (!newCommunityName.trim()) {
      toast.error("Community name is required");
      return;
    }

    try {
      await createCommunityMutation.mutateAsync({
        name: newCommunityName,
        description: newCommunityDescription,
        category: newCommunityCategory,
        creator_id: user?.uid || "",
      });
      setCreateDialogOpen(false);
      setNewCommunityName("");
      setNewCommunityDescription("");
      setNewCommunityCategory("");
      toast.success("Community created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create community");
    }
  };

  const handleJoin = async (communityId: string) => {
    if (!user?.uid) {
      toast.error("Please sign in to join communities");
      return;
    }

    try {
      await joinCommunityMutation.mutateAsync({
        communityId,
        userId: user.uid,
      });
      toast.success("Joined community!");
    } catch (error: any) {
      toast.error(error.message || "Failed to join community");
    }
  };

  const handleLeave = async (communityId: string) => {
    if (!user?.uid) return;

    try {
      await leaveCommunityMutation.mutateAsync({
        communityId,
        userId: user.uid,
      });
      toast.success("Left community");
    } catch (error: any) {
      toast.error(error.message || "Failed to leave community");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Error loading communities: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Communities</h1>
          {user && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Community
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle>Create a Community</DialogTitle>
                  <DialogDescription>
                    Create a new community to connect with others who share your interests.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Community Name</Label>
                    <Input
                      id="name"
                      value={newCommunityName}
                      onChange={(e) => setNewCommunityName(e.target.value)}
                      placeholder="Enter community name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={newCommunityCategory}
                      onChange={(e) => setNewCommunityCategory(e.target.value)}
                      placeholder="e.g., Technology, Arts, Sports"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newCommunityDescription}
                      onChange={(e) => setNewCommunityDescription(e.target.value)}
                      placeholder="Describe your community"
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button onClick={handleCreateCommunity} className="w-full bg-blue-600">
                    Create Community
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Communities Grid */}
        {filteredCommunities && filteredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                onJoin={() => handleJoin(community.id)}
                onLeave={() => handleLeave(community.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Hash className="mx-auto h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No communities found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery ? "Try a different search term" : "Be the first to create a community!"}
            </p>
            {user && !searchQuery && (
              <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600">
                Create Community
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
