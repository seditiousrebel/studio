'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BaseEntity } from '@/lib/types';
import { ArrowRight, User, Users, FileText, ClipboardCheck, Heart } from 'lucide-react'; // Added Heart for follow
import { useState, useEffect } from 'react'; // For follow state

interface EntityCardProps {
  entity: BaseEntity & { entityType?: string, imageUrl?: string, dataAiHint?: string }; // entityType is for icon, imageUrl for image
  linkPrefix: string;
}

const EntityIcon = ({ type }: { type?: string }) => {
  if (type === 'Politician') return <User className="mr-2 h-4 w-4 text-muted-foreground" />;
  if (type === 'Party') return <Users className="mr-2 h-4 w-4 text-muted-foreground" />;
  if (type === 'Bill') return <FileText className="mr-2 h-4 w-4 text-muted-foreground" />;
  if (type === 'Promise') return <ClipboardCheck className="mr-2 h-4 w-4 text-muted-foreground" />;
  return null;
};

export default function EntityCard({ entity, linkPrefix }: EntityCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(entity.followersCount || 0);

  // Avoid hydration mismatch for Math.random based initial state if used for isFollowing
  useEffect(() => {
    // In a real app, fetch follow status
    setIsFollowing(Math.random() > 0.7); // Random initial follow state for demo
  }, []);


  const handleFollowToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation when clicking follow button
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? prev -1 : prev + 1);
    // Add API call to update follow status here
  };


  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      {entity.imageUrl && (
         <div className="relative w-full h-40 rounded-t-lg overflow-hidden">
            <Image 
                src={entity.imageUrl} 
                alt={entity.name} 
                layout="fill" 
                objectFit="cover"
                data-ai-hint={entity.dataAiHint || 'entity image'}
            />
        </div>
      )}
      <CardHeader className="flex-grow">
        <div className="flex items-center justify-between mb-1">
            <CardTitle className="text-lg md:text-xl flex items-center">
                <EntityIcon type={entity.entityType} />
                {entity.name}
            </CardTitle>
            <Button variant={isFollowing ? "secondary" : "outline"} size="sm" onClick={handleFollowToggle} className="shrink-0">
                <Heart className={`mr-1.5 h-4 w-4 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`} />
                {isFollowing ? 'Following' : 'Follow'} 
            </Button>
        </div>
        {entity.entityType && <CardDescription className="text-xs">{entity.entityType}</CardDescription>}
        {followersCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{followersCount.toLocaleString()} followers</p>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80 line-clamp-3 mb-4">{entity.description}</p>
        <Link href={`${linkPrefix}/${entity.id}`} passHref>
          <Button variant="outline" size="sm" className="w-full group">
            View Details <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
