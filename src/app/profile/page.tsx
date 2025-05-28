// src/app/profile/page.tsx
"use client";

import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Settings, Edit3, LogOut, ShieldAlert, Eye, ListChecks, FileText as BillIconLucide, Landmark, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/layout/app-providers';
import { useRouter, usePathname } from 'next/navigation';
import { ADMIN_EMAIL, APP_NAME } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import type { EditSuggestion, Politician } from '@/types'; // Added Politician for contact type
import { formatDate } from '@/lib/utils'; // Import formatDate
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog"; 
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from '@/lib/routes'; // Import ROUTES


const getMockUser = (email: string | null, fullName?: string | null) => {
  const initials = (fullName || email || "DU")[0].toUpperCase();
  return {
    name: fullName || (email === ADMIN_EMAIL ? 'Admin User' : (email ? `User (${email.split('@')[0]})` : 'Demo User')),
    email: email || 'user@example.com',
    avatarUrl: `https://placehold.co/100x100.png`, // Updated placeholder
    dataAiHintAvatar: email === ADMIN_EMAIL ? 'admin avatar' : 'user avatar',
    avatarFallbackText: initials,
  };
};


export default function ProfilePage() {
  const { user, supabase, isAuthenticated, isAdmin, userEmail, logout, isLoadingAuth, userVotes } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState(getMockUser(null, null));
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [mySuggestions, setMySuggestions] = useState<EditSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedUserSuggestion, setSelectedUserSuggestion] = useState<EditSuggestion | null>(null);

  useEffect(() => {
    if (isLoadingAuth) {
      return; 
    }

    if (!isAuthenticated) {
      router.replace(`${ROUTES.LOGIN}?redirectTo=${pathname}`);
    } else if (user) {
      const fullNameFromMeta = user.user_metadata?.full_name || userEmail?.split('@')[0] || 'User';
      const userData = getMockUser(userEmail, fullNameFromMeta);
      setCurrentUser(userData);
      setNameInput(userData.name);
      setEmailInput(userData.email || "");
      
      if (!isAdmin && user.id) {
        const fetchMySuggestions = async () => {
          setIsLoadingSuggestions(true);
          const { data, error } = await supabase
            .from('suggestions')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false });

          if (error) {
            console.error("Error fetching user suggestions:", error);
            toast({ title: "Error", description: "Could not load your suggestions.", variant: "destructive" });
            setMySuggestions([]);
          } else {
            setMySuggestions(data as EditSuggestion[] || []);
          }
          setIsLoadingSuggestions(false);
        };
        fetchMySuggestions();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, userEmail, router, isAdmin, isLoadingAuth, pathname, supabase, toast]);


  const handleSave = () => {
    if (userEmail === ADMIN_EMAIL && emailInput !== ADMIN_EMAIL) {
      toast({ title: "Error", description: "Admin email cannot be changed.", variant: "destructive" });
      setEmailInput(ADMIN_EMAIL);
      return;
    }
    setCurrentUser(prev => ({ ...prev, name: nameInput, email: emailInput }));
    setIsEditing(false);
    toast({ title: "Profile Updated", description: "Profile changes are client-side display only for now." });
  };

  const handleLogout = async () => {
    await logout();
  };

  const getSuggestionStatusBadgeClass = (status: EditSuggestion['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300 border-green-300 dark:border-green-600';
      case 'denied': return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300 border-red-300 dark:border-red-600';
      case 'pending':
      default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600';
    }
  };

  const getEntityTypeIcon = (type: EditSuggestion['entityType']) => {
    switch(type) {
      case 'politician': return <User className="h-4 w-4 mr-2 text-primary" />;
      case 'party': return <Landmark className="h-4 w-4 mr-2 text-primary" />;
      case 'promise': return <ListChecks className="h-4 w-4 mr-2 text-primary" />;
      case 'bill': return <BillIconLucide className="h-4 w-4 mr-2 text-primary" />;
      default: return <Edit3 className="h-4 w-4 mr-2 text-muted-foreground" />;
    }
  };

  const renderUserSuggestedData = (data: EditSuggestion['suggestedData']) => {
     if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return <p className="text-sm text-muted-foreground italic">No specific data changes were suggested for this item.</p>;
    }
    
    return Object.entries(data).map(([key, value]) => {
      let displayValue: React.ReactNode = String(value);
      if (value === null || value === undefined) {
        displayValue = <span className="text-muted-foreground italic">Not provided</span>;
      } else if (key === 'tags' && typeof value === 'string') {
        const tagsArray = value.split(',').map(t => t.trim()).filter(Boolean);
        displayValue = tagsArray.length > 0 
          ? tagsArray.map((tag, i) => <Badge key={i} variant="outline" className="mr-1 mb-1 text-xs">{tag}</Badge>)
          : <span className="text-muted-foreground italic">No tags</span>;
      } else if (key === 'tags' && Array.isArray(value)) { 
        displayValue = value.length > 0
          ? value.map((t: any, i) => <Badge key={i} variant="outline" className="mr-1 mb-1 text-xs">{typeof t === 'object' && t.name ? t.name : String(t)}</Badge>)
          : <span className="text-muted-foreground italic">No tags</span>;
      } else if (Array.isArray(value)) {
         if (key === 'criminalRecordEntries' && Array.isArray(value)) {
          displayValue = (
            <ul className="list-disc pl-5 space-y-2">
              {(value as EditSuggestion['suggestedData']['criminalRecordEntries'])?.map((entry: any, i: number) => (
                <li key={i} className="text-xs border-b pb-1 mb-1">
                  Severity: {entry.severity}, Status: {entry.status}, Type: {entry.offenseType}<br/>
                  Desc: {entry.description}<br/>
                  Sources: {Array.isArray(entry.sourceUrls) ? (entry.sourceUrls as any[]).map(su => su.value || su).join(', ') : 'N/A'}
                </li>
              ))}
            </ul>
          );
        } else {
          displayValue = value.join(', ');
        }
      } else if (typeof value === 'object' && value !== null) {
         if (key === 'contact' && typeof value === 'object' && value !== null) {
            const contactData = value as Politician['contact'];
            displayValue = (
                <ul className="list-disc pl-5 text-xs">
                    {contactData?.email && <li>Email: {contactData.email}</li>}
                    {contactData?.phone && <li>Phone: {contactData.phone}</li>}
                    {contactData?.social && Array.isArray(contactData.social) && contactData.social.length > 0 && (
                        <li>Social: {contactData.social.map((s: any) => `${s.platform}: ${s.url}`).join('; ')}</li>
                    )}
                     {(!contactData?.email && !contactData?.phone && (!contactData?.social || contactData.social.length === 0)) && <li className="italic">No contact details provided in suggestion.</li>}
                </ul>
            );
        } else {
          displayValue = <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>;
        }
      } else if (typeof value === 'boolean') {
        displayValue = value ? 'Yes' : 'No';
      }

      return (
        <div key={key} className="mb-2 text-sm">
          <strong className="font-medium capitalize text-foreground">{key.replace(/([A-Z])/g, ' $1')}: </strong>
          <div className="pl-2 text-muted-foreground whitespace-pre-wrap break-words">{displayValue}</div>
        </div>
      );
    });
  };

  if (isLoadingAuth || (!isAuthenticated && !isLoadingAuth)) { 
    return (
      <Container className="py-8 md:py-12">
        <PageHeader title="My Profile" description="Loading profile information..." />
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
                <Card><CardHeader className="items-center text-center"><Avatar className="w-24 h-24 mb-4 border-2 border-primary"><Skeleton className="h-full w-full rounded-full" /></Avatar><Skeleton className="h-6 w-3/4 mx-auto mb-1"/><Skeleton className="h-4 w-1/2 mx-auto"/></CardHeader><CardContent><Skeleton className="h-8 w-full mt-4"/><Skeleton className="h-8 w-full mt-2"/></CardContent></Card>
            </div>
            <div className="md:col-span-2"><Card><CardHeader><Skeleton className="h-8 w-1/3"/></CardHeader><CardContent><Skeleton className="h-20 w-full"/></CardContent></Card></div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title={isAdmin ? "Admin Profile" : "My Profile"} description="Manage your account details and view your activity." />

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="items-center text-center">
              <Avatar className="w-24 h-24 mb-4 border-2 border-primary shadow-md">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint={currentUser.dataAiHintAvatar}/>
                <AvatarFallback>{currentUser.avatarFallbackText}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{currentUser.name}</CardTitle>
              <CardDescription>{currentUser.email}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              {user?.created_at && <p>Joined: {formatDate(user.created_at)}</p>}
              <Button variant="outline" size="sm" className="mt-4 w-full transform transition-transform duration-200 hover:scale-[1.03]" onClick={() => setIsEditing(!isEditing)}>
                  <Edit3 className="mr-2 h-4 w-4" /> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </Button>
              <Button variant="destructive" size="sm" className="mt-2 w-full transform transition-transform duration-200 hover:scale-[1.03]" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </CardContent>
          </Card>
          {!isAdmin && (
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle className="text-lg">Activity Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                <p className="flex justify-between">Suggestions Made: <span className="font-semibold">{mySuggestions.length}</span></p>
                <p className="flex justify-between">Votes Casted: <span className="font-semibold">{Object.keys(userVotes).length}</span></p>
                </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2">
          {isEditing ? (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Edit Profile Information</CardTitle>
                <CardDescription>Update your name. Email cannot be changed here. Profile changes are currently local.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="bg-background"/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={emailInput} className="bg-background" disabled />
                   <p className="text-xs text-muted-foreground">Email address cannot be changed. Profile name changes are for display only in this demo.</p>
                </div>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white shadow-md transform transition-transform duration-200 hover:scale-[1.03]">Save Changes</Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className={cn("grid w-full mb-6", isAdmin ? "grid-cols-1" : "grid-cols-2")}>
                <TabsTrigger value="overview">{isAdmin ? "Admin Overview" : "Activity Overview"}</TabsTrigger>
                {!isAdmin && <TabsTrigger value="my-suggestions">My Suggestions ({mySuggestions.length})</TabsTrigger>}
              </TabsList>
              <TabsContent value="overview">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>{isAdmin ? "Administrator Access" : "Activity Overview"}</CardTitle>
                    <CardDescription>{isAdmin ? "You have full administrative privileges." : "Summary of your contributions and interactions."}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isAdmin ? (
                        <p className="text-muted-foreground">Use the Admin Dashboard link in the navigation to manage site content.</p>
                    ) : (
                        <>
                        <p className="text-muted-foreground">Your suggestions and votes help keep {APP_NAME} accurate and informative. Thank you for your participation!</p>
                        </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              {!isAdmin && (
                <TabsContent value="my-suggestions">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle>My Edit Suggestions</CardTitle>
                      <CardDescription>Track the status of suggestions you've submitted.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingSuggestions ? (
                         <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                      ) : mySuggestions.length > 0 ? (
                        <div className="space-y-4">
                          {mySuggestions.map(suggestion => (
                            <Card key={suggestion.id} className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center mb-1">
                                    {getEntityTypeIcon(suggestion.entityType)}
                                    <span className="font-semibold capitalize text-foreground">
                                      {suggestion.entityType} Suggestion: {suggestion.isNewItemSuggestion ? "New Item" : `Edit for ${(suggestion.suggested_data as any)?.name || (suggestion.suggested_data as any)?.title || suggestion.entityId?.substring(0,6)+"..." }`}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">Submitted: {formatDate(suggestion.timestamp, 'N/A')}</p>
                                </div>
                                <Badge variant="outline" className={cn("text-xs", getSuggestionStatusBadgeClass(suggestion.status))}>{suggestion.status}</Badge>
                              </div>
                              <Button variant="outline" size="sm" className="mt-3 w-full sm:w-auto transform transition-transform duration-200 hover:scale-[1.03]" onClick={() => setSelectedUserSuggestion(suggestion)}>
                                <Eye className="mr-1 h-4 w-4"/> View Details
                              </Button>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">You haven't submitted any suggestions yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </div>

      {selectedUserSuggestion && (
        <AlertDialog open={!!selectedUserSuggestion} onOpenChange={(isOpen) => { if (!isOpen) setSelectedUserSuggestion(null); }}>
          <AlertDialogContent className="sm:max-w-lg md:max-w-2xl max-h-[80vh]">
            <AlertDialogHeader>
              <AlertDialogTitle>My Suggestion Details</AlertDialogTitle>
              <AlertDialogDescription>
                Details of your suggestion submitted on {formatDate(selectedUserSuggestion.timestamp, 'N/A')}.
                Status: <Badge variant="outline" className={cn("ml-1 text-xs", getSuggestionStatusBadgeClass(selectedUserSuggestion.status))}>{selectedUserSuggestion.status}</Badge>
                <br/>
                Type: <span className="font-medium capitalize">{selectedUserSuggestion.entityType}</span>
                {selectedUserSuggestion.isNewItemSuggestion ?
                  <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-700/30 dark:text-blue-300">New Item Suggestion</Badge> :
                  <span className="ml-2 text-xs">(Editing existing item ID: {selectedUserSuggestion.entityId?.substring(0,8)}...)</span>
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <ScrollArea className="max-h-[50vh] p-1 pr-3 my-4 border rounded-md">
                <div className="space-y-3 py-2 px-1">
                 {renderUserSuggestedData(selectedUserSuggestion.suggested_data)}
                </div>
            </ScrollArea>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 shadow-md transform transition-transform duration-200 hover:scale-[1.03]">Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Container>
  );
}
