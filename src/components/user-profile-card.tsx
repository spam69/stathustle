
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Mail, Link as LinkIcon, MapPin, Briefcase, BarChartBig, Edit3, Users, Award } from "lucide-react";
import type { User, Identity } from "@/types";
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';

interface UserProfileCardProps {
  profileUser: User | Identity;
}

export default function UserProfileCard({ profileUser }: UserProfileCardProps) {
  const { user: currentUser } = useAuth();
  
  const isIdentityProfile = 'isIdentity' in profileUser && profileUser.isIdentity;
  
  let isCurrentUserProfile = false;
  if (currentUser) {
    if (isIdentityProfile) {
      // For an identity profile, "current user's profile" means the current user is the owner
      isCurrentUserProfile = currentUser.id === (profileUser as Identity).owner.id;
    } else {
      // For a user profile, it's a direct ID match
      isCurrentUserProfile = currentUser.id === profileUser.id;
    }
  }


  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const displayName = isIdentityProfile ? (profileUser as Identity).displayName || profileUser.username : profileUser.username;

  return (
    <Card className="mb-6 shadow-xl">
      <CardHeader className="relative p-0 h-48 md:h-64">
        {profileUser.bannerImageUrl ? (
          <Image
            src={profileUser.bannerImageUrl}
            alt={`${displayName}'s banner`}
            layout="fill"
            objectFit="cover"
            className="rounded-t-lg"
            data-ai-hint="banner landscape"
          />
        ) : (
          <div className="h-full w-full bg-muted rounded-t-lg" data-ai-hint="abstract pattern"></div>
        )}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background rounded-full shadow-lg">
            <AvatarImage src={profileUser.profilePictureUrl} alt={displayName} data-ai-hint="person portrait"/>
            <AvatarFallback className="text-3xl md:text-4xl">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
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
        
        {isCurrentUserProfile && (
          <div className="mt-4">
            <Button asChild>
              <Link href="/settings"> {/* For users, links to general settings */}
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
              </Link>
            </Button>
            {isIdentityProfile && ( /* Additional button for Identity owners */
                 <Button asChild variant="outline" className="ml-2">
                    <Link href={`/settings/identity/${profileUser.id}/team`}>
                        <Users className="mr-2 h-4 w-4" /> Manage Team (Identity)
                    </Link>
                 </Button>
            )}
          </div>
        )}
        {!isCurrentUserProfile && (
            <div className="mt-4 space-x-2">
                <Button>Follow {isIdentityProfile ? 'Identity' : 'User'}</Button>
                <Button variant="outline">Message</Button>
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
  );
}
