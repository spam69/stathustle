"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Mail, Link as LinkIcon, MapPin, Briefcase, BarChartBig, Edit3, Users, Award, Edit2, ImageIcon, UserPlus, UserMinus, Loader2 } from "lucide-react";
import type { User, Identity } from "@/types";
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import ImageUploadModal from './image-upload-modal'; // Import the modal
import { useToast } from '@/hooks/use-toast';
import FollowersFollowingModal from './followers-following-modal';
import { useMessagingContext } from '@/contexts/MessagingContext';

interface UserProfileCardProps {
  profileUser: User | Identity;
  setProfileUser: (user: User | Identity) => void;
}

export default function UserProfileCard({ profileUser, setProfileUser }: UserProfileCardProps) {
  const { user: currentUser, updateUserSettings } = useAuth();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [editingImageType, setEditingImageType] = useState<'profile' | 'banner' | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const { toast } = useToast();
  const { conversations, startConversation, setCurrentConversation } = useMessagingContext();
  
  const isIdentityProfile = 'isIdentity' in profileUser && profileUser.isIdentity;
  
  let isCurrentUserProfile = false;
  if (currentUser) {
    if (isIdentityProfile) {
      isCurrentUserProfile = currentUser.id === (profileUser as Identity).owner.id;
    } else {
      isCurrentUserProfile = currentUser.id === profileUser.id;
    }
  }

  // Add this check for acting as identity
  const isActingAsIdentity = currentUser?.isIdentity && currentUser.id === profileUser.id;

  // Check if current user is following this profile
  useEffect(() => {
    if (currentUser && profileUser) {
      const isFollowingProfile = profileUser.followers?.includes(currentUser.id);
      setIsFollowing(!!isFollowingProfile);
    }
  }, [currentUser, profileUser]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const displayName = isIdentityProfile ? (profileUser as Identity).displayName || profileUser.username : profileUser.username;

  const openImageUploadModal = (type: 'profile' | 'banner') => {
    setEditingImageType(type);
    setIsImageModalOpen(true);
  };

  const handleImageUploaded = async (newImageUrl: string, imageType: 'profile' | 'banner') => {
    if (!currentUser) return;

    const settingsToUpdate: Partial<Pick<User, 'profilePictureUrl' | 'bannerImageUrl'>> = {};
    if (imageType === 'profile') {
      settingsToUpdate.profilePictureUrl = newImageUrl;
    } else {
      settingsToUpdate.bannerImageUrl = newImageUrl;
    }

    const updatedUser = await updateUserSettings(settingsToUpdate);
    if (updatedUser) {
      // Update parent state
      setProfileUser(prev => ({ ...prev, ...settingsToUpdate }));
      toast({ title: `${imageType === 'profile' ? 'Profile picture' : 'Banner image'} updated successfully!` });
    }
    // Error toast is handled by updateUserSettings in AuthContext
    setEditingImageType(null);
  };

  const handleFollowAction = async (action: 'follow' | 'unfollow') => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to follow users and identities.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerId: currentUser.id,
          followerModel: currentUser.isIdentity ? 'Identity' : 'User',
          followingId: profileUser.id,
          followingModel: isIdentityProfile ? 'Identity' : 'User',
          action
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform follow action');
      }

      // Update parent state
      setProfileUser(prev => ({
        ...prev,
        followers: action === 'follow' 
          ? [...(prev.followers || []), currentUser.id]
          : (prev.followers || []).filter(id => id !== currentUser.id)
      }));
      setIsFollowing(action === 'follow');
      toast({
        title: action === 'follow' ? "Following" : "Unfollowed",
        description: `You are now ${action === 'follow' ? 'following' : 'not following'} ${profileUser.username}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform follow action. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageClick = () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send messages.",
        variant: "destructive"
      });
      return;
    }

    const existingConversation = conversations.find(c => c.participants.includes(profileUser.id));

    if (existingConversation) {
      setCurrentConversation(existingConversation);
    } else {
      startConversation(profileUser.id);
    }
  };

  return (
    <>
      <Card className="mb-6 shadow-xl">
        <CardHeader className="relative p-0 h-48 md:h-64"> {/* Group class removed from here */}
          <div className="relative w-full h-full group"> {/* New group for banner image + button */}
            {profileUser.bannerImageUrl ? (
              <Image
                src={profileUser.bannerImageUrl}
                alt={`${displayName}'s banner`}
                layout="fill"
                objectFit="cover"
                className="rounded-t-lg"
                data-ai-hint="banner landscape"
                key={profileUser.bannerImageUrl} // Key to force re-render on change
              />
            ) : (
              <div className="h-full w-full bg-muted rounded-t-lg flex items-center justify-center text-muted-foreground/30" data-ai-hint="abstract pattern">
                  <ImageIcon className="h-24 w-24" />
              </div>
            )}
            {isCurrentUserProfile && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                onClick={() => openImageUploadModal('banner')}
                aria-label="Edit banner image"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="relative group"> {/* This group is for the avatar and its button */}
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background rounded-full shadow-lg">
                <AvatarImage src={profileUser.profilePictureUrl} alt={displayName} data-ai-hint="person portrait" key={profileUser.profilePictureUrl}/>
                <AvatarFallback className="text-3xl md:text-4xl">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              {isCurrentUserProfile && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-0 right-0 h-7 w-7 md:h-8 md:w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md p-1"
                  onClick={() => openImageUploadModal('profile')}
                  aria-label="Edit profile picture"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-16 md:pt-20 text-center">
          <div className="flex flex-col items-center justify-center">
              <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary">{displayName}</h1>
              <p className="text-sm text-muted-foreground mt-1">@{profileUser.username}</p>
              {isIdentityProfile && (
                  <Badge variant="secondary" className="mt-2">
                      <Award className="mr-1.5 h-3.5 w-3.5" /> Identity
                  </Badge>
              )}
          </div>
          
          {/* Add follower/following counts */}
          <div className="flex justify-center gap-4 mt-3 text-sm text-muted-foreground">
            <button
              onClick={() => setIsFollowersModalOpen(true)}
              className="hover:text-primary transition-colors"
            >
              <span className="font-semibold text-foreground">{profileUser.followers?.length || 0}</span> followers
            </button>
            <button
              onClick={() => setIsFollowingModalOpen(true)}
              className="hover:text-primary transition-colors"
            >
              <span className="font-semibold text-foreground">{profileUser.following?.length || 0}</span> following
            </button>
          </div>
          
          {profileUser.bio && (
            <p className="mt-3 text-sm max-w-md mx-auto">{profileUser.bio}</p>
          )}

          {isIdentityProfile && (profileUser as Identity).owner && (
              <p className="text-xs text-muted-foreground mt-2">
                  Owned by: {' '}
                  <Link href={`/profile/${(profileUser as Identity).owner.username}`} className="hover:underline text-primary">
                  @{(profileUser as Identity).owner.username}
                  </Link>
              </p>
          )}


          <div className="mt-4 flex justify-center flex-wrap gap-2">
            {profileUser.socialLinks?.map(link => (
              <Button key={link.platform} variant="outline" size="sm" asChild>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="h-3 w-3 mr-1.5" /> {link.platform}
                </a>
              </Button>
            ))}
          </div>
          
          {isCurrentUserProfile && !isIdentityProfile && ( // Show Edit Profile button only for user's own non-identity profile
            <div className="mt-4">
              <Button asChild>
                <Link href="/settings">
                  <Edit3 className="mr-2 h-4 w-4" /> Edit Profile (Bio, Interests)
                </Link>
              </Button>
            </div>
          )}
          {isCurrentUserProfile && isIdentityProfile && ( /* For Identity owners */
               <div className="mt-4 space-x-2">
                  <Button asChild>
                    <Link href="/settings"> {/* TODO: This should likely go to a dedicated identity edit page */}
                        <Edit3 className="mr-2 h-4 w-4" /> Edit Identity (Bio, Links)
                    </Link>
                  </Button>
                   <Button asChild variant="outline">
                      <Link href={`/settings/identity/${profileUser.id}/team`}>
                          <Users className="mr-2 h-4 w-4" /> Manage Team
                      </Link>
                   </Button>
               </div>
          )}
          {/* BUTTON LOGIC: Show Manage Team Members if acting as identity, else show Follow/Unfollow */}
          {isActingAsIdentity ? (
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href={`/settings/identity/${profileUser.id}/team`}>
                  <Users className="mr-2 h-4 w-4" /> Manage Team Members
                </Link>
              </Button>
            </div>
          ) : !isCurrentUserProfile && (
            <div className="mt-4 space-x-2">
              <Button 
                onClick={() => handleFollowAction(isFollowing ? 'unfollow' : 'follow')}
                disabled={isLoading}
                variant={isFollowing ? "outline" : "default"}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isFollowing ? (
                  <UserMinus className="mr-2 h-4 w-4" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                {isFollowing ? 'Unfollow' : 'Follow'} {isIdentityProfile ? 'Identity' : 'User'}
              </Button>
              <Button variant="outline" onClick={handleMessageClick}>Message</Button>
            </div>
          )}

          {!isIdentityProfile && (profileUser as User).sportInterests && (profileUser as User).sportInterests!.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-headline">Sport Interests</h3>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {(profileUser as User).sportInterests!.map(interest => (
                  <span key={interest.sport} className="px-3 py-1 text-xs bg-accent/20 text-accent-foreground rounded-full">
                    {interest.sport} ({interest.level.split(' ')[0]})
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isImageModalOpen && editingImageType && (
        <ImageUploadModal
          isOpen={isImageModalOpen}
          onClose={() => {
            setIsImageModalOpen(false);
            setEditingImageType(null);
          }}
          onImageUploaded={handleImageUploaded}
          imageType={editingImageType}
          currentImageUrl={editingImageType === 'profile' ? profileUser.profilePictureUrl : profileUser.bannerImageUrl}
          profileUsername={profileUser.username}
        />
      )}
      <FollowersFollowingModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        profileUser={profileUser}
        setProfileUser={setProfileUser}
        type="followers"
      />
      <FollowersFollowingModal
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
        profileUser={profileUser}
        setProfileUser={setProfileUser}
        type="following"
      />
    </>
  );
}

