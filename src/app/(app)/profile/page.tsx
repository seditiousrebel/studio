import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { placeholderUserProfile, placeholderPoliticians, placeholderParties } from '@/lib/placeholder-data';
import type { UserProfile } from '@/lib/types';
import { User, Users, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const user: UserProfile = placeholderUserProfile; // In a real app, fetch this

  const followedPoliticians = placeholderPoliticians.filter(p => user.followedPoliticians?.includes(p.id));
  const followedParties = placeholderParties.filter(p => user.followedParties?.includes(p.id));
  // Similar filtering for bills and promises can be added

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.avatarUrl && (
             <div className="relative w-20 h-20 rounded-full overflow-hidden">
                <Image 
                    src={user.avatarUrl} 
                    alt={user.name} 
                    layout="fill" 
                    objectFit="cover"
                    data-ai-hint={user.dataAiHint || "avatar image"}
                />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
            <Button variant="destructive" size="sm">
                <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Followed Politicians</CardTitle>
        </CardHeader>
        <CardContent>
          {followedPoliticians.length > 0 ? (
            <ul className="space-y-2">
              {followedPoliticians.map(p => (
                <li key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <Link href={`/politicians/${p.id}`} className="flex items-center gap-2 group">
                    <User className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    <span className="group-hover:text-primary">{p.name}</span>
                  </Link>
                  <Button variant="outline" size="sm">Unfollow</Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">You are not following any politicians yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Followed Parties</CardTitle>
        </CardHeader>
        <CardContent>
          {followedParties.length > 0 ? (
            <ul className="space-y-2">
              {followedParties.map(p => (
                <li key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <Link href={`/parties/${p.id}`} className="flex items-center gap-2 group">
                     <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    <span className="group-hover:text-primary">{p.name}</span>
                  </Link>
                   <Button variant="outline" size="sm">Unfollow</Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">You are not following any parties yet.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Placeholder for Personalized Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (Personalized Feed)</CardTitle>
          <CardDescription>Updates from entities you follow.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Personalized feed content will appear here.</p>
           <Link href="/" passHref>
              <Button variant="link" className="text-primary p-0">View Full Feed</Button>
           </Link>
        </CardContent>
      </Card>
    </div>
  );
}
