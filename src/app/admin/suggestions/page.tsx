
"use client";

import { useState, useEffect, useMemo } from 'react'; 
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/app-providers';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { EditSuggestion, Politician, Party, UserPromise, Bill, EntityType, CriminalRecordEntry as CriminalRecordType, AssetDeclarationEntry as AssetDeclarationType, PoliticalCareerEntry as PoliticalCareerType, SocialMediaLink, AssetDeclarationSource, CriminalRecordSource } from '@/types';
import { ShieldAlert, CheckCircle, XCircle, Edit3, User, Calendar, ListChecks, FileText as BillIconLucide, Landmark, Eye, Edit2Icon, Loader2 } from 'lucide-react'; 
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog"; 
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AdminLayout } from '@/components/layout/admin-layout'; // Import AdminLayout

export default function AdminSuggestionsPage() {
  const { supabase } = useAuth(); // isAdmin and isAuthenticated checks handled by AdminLayout
  const router = useRouter();
  const { toast } = useToast();

  const [suggestions, setSuggestions] = useState<EditSuggestion[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedSuggestionForView, setSelectedSuggestionForView] = useState<EditSuggestion | null>(null);
  const [originalItemData, setOriginalItemData] = useState<any>(null);
  const [isLoadingOriginalItem, setIsLoadingOriginalItem] = useState(false);

  const fetchSuggestions = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch('/api/suggestions');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch suggestions, server returned non-JSON error." }));
        throw new Error(String(errorData.message || `Failed to fetch suggestions: ${response.statusText}`));
      }
      const allSuggestions: EditSuggestion[] = await response.json();
      setSuggestions(allSuggestions.filter(s => s.status === 'pending'));
    } catch (error: any) {
      toast({ title: "Error Fetching Suggestions", description: String(error.message), variant: "destructive" });
      setSuggestions([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    // Auth checks are handled by AdminLayout, so we can directly fetch data
    fetchSuggestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    const fetchOriginalItem = async () => {
      if (selectedSuggestionForView && !selectedSuggestionForView.is_new_item_suggestion && selectedSuggestionForView.entity_id) {
        setIsLoadingOriginalItem(true);
        setOriginalItemData(null); 
        let itemData = null;
        try {
          let apiUrl = '';
          switch (selectedSuggestionForView.entity_type) {
            case 'politician': apiUrl = `/api/politicians/${selectedSuggestionForView.entity_id}`; break;
            case 'party': apiUrl = `/api/parties/${selectedSuggestionForView.entity_id}`; break;
            case 'promise': apiUrl = `/api/promises/${selectedSuggestionForView.entity_id}`; break;
            case 'bill': apiUrl = `/api/bills/${selectedSuggestionForView.entity_id}`; break;
            default:
              console.warn("Unknown entity type for fetching original data:", selectedSuggestionForView.entity_type);
          }
          if (apiUrl) {
            const response = await fetch(apiUrl);
            if (response.ok) {
              itemData = await response.json();
            } else if (response.status !== 404) { 
              const errorData = await response.json().catch(() => ({}));
              toast({ title: "Error Fetching Original Item", description: String(errorData.error || `Failed to fetch original ${selectedSuggestionForView.entity_type}. Status: ${response.status}`), variant: "destructive" });
            }
          }
        } catch (err: any) {
          toast({ title: "Error Fetching Original Item", description: String(err.message || "An unexpected error occurred."), variant: "destructive" });
        }
        setOriginalItemData(itemData);
        setIsLoadingOriginalItem(false);
      } else {
        setOriginalItemData(null);
        setIsLoadingOriginalItem(false);
      }
    };
    fetchOriginalItem();
  }, [selectedSuggestionForView, toast]);


  const handleProcessSuggestion = async (suggestionId: string, action: 'approve' | 'deny') => {
    try {
      const response = await fetch('/api/suggestions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ suggestionId, action }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to process suggestion. Server returned: ${response.statusText}` }));
        throw new Error(String(errorData.error || errorData.message || `Failed to process suggestion: ${response.statusText}`));
      }
      const responseData = await response.json();
      toast({
        title: `Suggestion ${action === 'approve' ? (responseData.partialSuccess ? 'Partially Approved' : 'Approved') : 'Denied'}`,
        description: String(responseData.error || responseData.message || `The suggestion (ID: ${suggestionId.substring(0,6)}...) has been processed.`),
        variant: responseData.partialSuccess ? 'default' : (action === 'approve' ? 'default' : 'destructive')
      });
      fetchSuggestions(); 
    } catch (error: any) {
      toast({
        title: "Error Processing Suggestion",
        description: String(error.message || `Could not process suggestion (ID: ${suggestionId.substring(0,6)}...).`),
        variant: "destructive",
      });
    }
  };

  const getEntityTypeIcon = (type: EditSuggestion['entity_type']) => {
    switch(type) {
      case 'politician': return <User className="h-4 w-4 mr-2 text-primary" />;
      case 'party': return <Landmark className="h-4 w-4 mr-2 text-primary" />;
      case 'promise': return <ListChecks className="h-4 w-4 mr-2 text-primary" />;
      case 'bill': return <BillIconLucide className="h-4 w-4 mr-2 text-primary" />;
      default: return <Edit3 className="h-4 w-4 mr-2 text-muted-foreground" />;
    }
  };

  const renderSuggestedData = (suggestedData: EditSuggestion['suggestedData'], originalData: any | null, entityType: EntityType) => {
    if (!suggestedData || typeof suggestedData !== 'object' || Object.keys(suggestedData).length === 0) {
        return <p className="text-sm text-muted-foreground italic">No specific data changes were suggested for this item.</p>;
    }

    return Object.entries(suggestedData).map(([key, value]) => {
      if ((entityType === 'promise' || entityType === 'bill') && 
          (key === 'id' || key === 'politicianName' || key === 'partyName' || 
           key === 'politicianImageUrl' || key === 'partyLogoUrl' || 
           key === 'sponsorPoliticianName' || key === 'sponsorPartyName' || key === 'sponsorPoliticianPartyLogoUrl' || key === 'sponsorPartyLogoUrl' || key === 'sponsorPoliticianPartyId' )) return null;
      if (key === 'rating' || key === 'age' || key === 'numberOfMembers' || 
          key === 'promiseFulfillmentRate' || key === 'highestConvictedSeverity' ||
          key === 'created_at' || key === 'updated_at' || key === 'timestamp' ||
          (entityType === 'politician' && (key === 'partyLogoUrl' || key === 'partyName' || key === 'promises' || key === 'directlySponsoredBills' || key === 'partySponsoredBills' )) ||
          (entityType === 'party' && (key === 'chairpersonName' || key === 'chairpersonImageUrl' || key === 'memberPoliticians' || key === 'platformPromises' || key === 'memberPromises' || key === 'billsSponsoredByParty' || key === 'billsSponsoredByMembers'))
      ) return null; 

      let displayValue: React.ReactNode = String(value);
      const originalValue = originalData ? originalData[key as keyof typeof originalData] : undefined;
      let changeIndicator: React.ReactNode = null;
      let valueClassName = "pl-2 text-muted-foreground whitespace-pre-wrap break-words";
      let originalValueDisplay: React.ReactNode = null;

      const valStr = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
      const origValStr = typeof originalValue === 'object' && originalValue !== null ? JSON.stringify(originalValue) : String(originalValue ?? '');
      
      const isEmptySuggestion = value === null || value === undefined || valStr === '""' || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && value !== null && Object.keys(value).length === 0 && !(value instanceof Date));
      const wasOriginallyEmpty = originalData && (originalValue === null || originalValue === undefined || origValStr === '""' || (Array.isArray(originalValue) && originalValue.length === 0) || (typeof originalValue === 'object' && originalValue !== null && Object.keys(originalValue).length === 0 && !(originalValue instanceof Date)));


      if (originalData && key in originalData) { 
        if (valStr !== origValStr) {
          if (isEmptySuggestion && !wasOriginallyEmpty) {
             changeIndicator = <Badge variant="outline" className="ml-2 bg-red-100 text-red-700 border-red-300 dark:bg-red-700/30 dark:text-red-300 text-xs">Removed</Badge>;
             valueClassName = cn(valueClassName, "bg-red-50 dark:bg-red-900/20 p-1 rounded-sm");
             originalValueDisplay = <span className="line-through text-red-500/70 mr-1">{String(originalValue)}</span>;
             displayValue = <span className="text-muted-foreground italic">Emptied / Not provided</span>;
          } else { 
            changeIndicator = <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-700/30 dark:text-yellow-400 text-xs">Updated</Badge>;
            valueClassName = cn(valueClassName, "bg-yellow-50 dark:bg-yellow-900/20 p-1 rounded-sm");
             if (typeof value !== 'object' && typeof originalValue !== 'object' && String(originalValue).length < 100 && String(value).length < 100 ) { 
              originalValueDisplay = <span className="line-through text-red-500/70 mr-1">{String(originalValue)}</span>;
              displayValue = <span className="text-green-600 font-medium">{String(value)}</span>;
            } else if (Array.isArray(value) || typeof value === 'object') {
               originalValueDisplay = <span className="text-xs text-red-500/70">(Original content different)</span>;
            }
          }
        }
      } else if (!isEmptySuggestion) { 
        changeIndicator = <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-300 dark:bg-green-700/30 dark:text-green-300 text-xs">New</Badge>;
        valueClassName = cn(valueClassName, "bg-green-50 dark:bg-green-900/20 p-1 rounded-sm");
      } else { 
        return null; 
      }

      if (isEmptySuggestion && !(changeIndicator && String(changeIndicator).includes("Removed")) ) { 
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
          if ((key === 'politicalCareer' || key === 'assetDeclarations' || key === 'criminalRecordEntries' || key === 'contactSocialEntries') && entityType === 'politician') {
            displayValue = (
                <ul className="list-disc pl-5 space-y-2 text-xs">
                {(value as any[]).map((entry: any, i: number) => (
                    <li key={entry.id || i} className="border-b pb-1 mb-1">
                    {Object.entries(entry).map(([k, v]) => {
                        if (k === 'id' || k === 'created_at' || k === 'updated_at') return null;
                        if (k === 'sourceUrls' && Array.isArray(v)) {
                        return <div key={k}><strong className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</strong> {(v as any[]).map(su => su.value || su.url || String(su)).join(', ')}</div>;
                        }
                        return <div key={k}><strong className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</strong> {String(v)}</div>;
                    })}
                    </li>
                ))}
                {value.length === 0 && <li className="italic">List is empty.</li>}
                </ul>
            );
          } else if ((key === 'sourceUrls' && (entityType === 'promise' || entityType === 'bill' )) && Array.isArray(value)) { 
           displayValue = value.map((item: any) => typeof item === 'string' ? item : (item.name || item.value || String(item))).join(', ');
          } else {
            displayValue = value.length > 0 ? <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">{JSON.stringify(value, null, 2)}</pre> : <span className="text-muted-foreground italic">Empty list</span>;
          }
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
         if (key === 'contact' && entityType === 'politician' && typeof value === 'object' && value !== null) {
            const contactData = value as Politician['contact']; 
            displayValue = (
                <ul className="list-disc pl-5 text-xs">
                    {contactData?.email && <li>Email: {contactData.email}</li>}
                    {contactData?.phone && <li>Phone: {contactData.phone}</li>}
                    {contactData?.social && Array.isArray(contactData.social) && contactData.social.length > 0 && (
                        <li>Social: {contactData.social.map((s: SocialMediaLink) => `${s.platform}: ${s.url}`).join('; ')}</li>
                    )}
                     {(!contactData?.email && !contactData?.phone && (!contactData?.social || contactData.social.length === 0)) && <li className="italic">No contact details.</li>}
                </ul>
            );
        } else {
          displayValue = Object.keys(value).length > 0 ? <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">{JSON.stringify(value, null, 2)}</pre> : <span className="text-muted-foreground italic">Empty object</span>;
        }
      } else if (typeof value === 'boolean') {
        displayValue = value ? 'Yes' : 'No';
      } else if (value instanceof Date || ((key.toLowerCase().includes('date') || key.toLowerCase().includes('timestamp')) && typeof value === 'string' && !isNaN(Date.parse(value))) ) {
        try {
          displayValue = format(new Date(value as string), 'PPP p');
        } catch (e) { /* keep original string if formatting fails */ }
      }


      return (
        <div key={key} className="mb-2 text-sm">
          <div className="flex items-center">
            <strong className="font-medium capitalize text-foreground">{key.replace(/([A-Z])/g, ' $1').replace(/Id$/, " ID")}: </strong> 
            {changeIndicator}
          </div>
          <div className={valueClassName}>
            {originalValueDisplay && <>{originalValueDisplay} {originalValueDisplay && typeof value !== 'object' && typeof originalValue !== 'object' ? <span className="mx-1">➔</span> : null}</>}
            {displayValue}
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  const getEditSuggestionPath = (suggestion: EditSuggestion) => {
    switch(suggestion.entity_type) {
      case 'politician': return `/admin/suggestions/${suggestion.id}/edit`;
      case 'party': return `/admin/suggestions/${suggestion.id}/edit-party`;
      case 'promise': return `/admin/suggestions/${suggestion.id}/edit-promise`;
      case 'bill': return `/admin/suggestions/${suggestion.id}/edit-bill`;
      default: 
        console.warn(`No edit path defined for entity type: ${suggestion.entity_type}`);
        return '#'; 
    }
  };

  if (isLoadingData) {
     return ( 
      <AdminLayout pageTitle="Review Edit Suggestions" pageDescription="Loading pending suggestions...">
        <Container className="py-8 md:py-12"><PageHeader title="Review Edit Suggestions" description="Loading pending suggestions..." /> <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Container>
      </AdminLayout>
     );
  }

  return (
    <AdminLayout
        pageTitle="Review Edit Suggestions"
        pageDescription="Approve or deny content suggestions submitted by users. You can also edit suggestions before approving."
    >
        <Container className="py-8 md:py-12">
        <PageHeader title="Review Edit Suggestions" description="Approve or deny content suggestions submitted by users. You can also edit suggestions before approving." />
        {suggestions.length > 0 ? (
            <Card>
            <CardContent className="p-0">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Type</TableHead><TableHead>Item / Proposed Title</TableHead><TableHead>User</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {suggestions.map((suggestion) => (
                    <TableRow key={suggestion.id}>
                        <TableCell className="capitalize flex items-center">{getEntityTypeIcon(suggestion.entity_type)}{suggestion.entity_type}</TableCell>
                        <TableCell>
                        {suggestion.is_new_item_suggestion ? (<Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-700/30 dark:text-blue-300">New Item</Badge>) : (<span className="text-xs text-muted-foreground" title={suggestion.entity_id || undefined}>ID: {suggestion.entity_id?.substring(0, 8)}...</span>)}
                        <p className="text-sm text-foreground line-clamp-1 font-medium" title={(suggestion.suggested_data as any)?.title || (suggestion.suggested_data as any)?.name || "N/A"}>
                            { (suggestion.suggested_data && typeof suggestion.suggested_data === 'object' && ((suggestion.suggested_data as any).title || (suggestion.suggested_data as any).name)) 
                            ? ((suggestion.suggested_data as any).title || (suggestion.suggested_data as any).name) 
                            : "N/A" }
                        </p>
                        </TableCell>
                        <TableCell>{suggestion.user_name || suggestion.user_id}</TableCell>
                        <TableCell>{suggestion.timestamp ? format(new Date(suggestion.timestamp), 'PPP p') : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedSuggestionForView(suggestion)}><Eye className="mr-1 h-4 w-4" /> View</Button>
                            <Button asChild variant="outline" size="sm">
                                <Link href={getEditSuggestionPath(suggestion)}><Edit2Icon className="mr-1 h-4 w-4" /> Edit</Link>
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-700 text-white shadow-md" size="sm" onClick={() => handleProcessSuggestion(suggestion.id, 'approve')}><CheckCircle className="mr-1 h-4 w-4" /> Approve</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleProcessSuggestion(suggestion.id, 'deny')}><XCircle className="mr-1 h-4 w-4" /> Deny</Button>
                        </div>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        ) : (
            <Card><CardHeader><CardTitle>No Pending Suggestions</CardTitle><CardDescription>There are no edit suggestions awaiting review at this time.</CardDescription></CardHeader></Card>
        )}

        {selectedSuggestionForView && (
            <AlertDialog open={!!selectedSuggestionForView} onOpenChange={(isOpen) => { if (!isOpen) setSelectedSuggestionForView(null); }}>
            <AlertDialogContent className="sm:max-w-lg md:max-w-2xl max-h-[80vh]">
                <AlertDialogHeader>
                <AlertDialogTitle>Suggestion Details</AlertDialogTitle>
                <AlertDialogDescription>
                    Review the details of this suggestion. Submitted by: {selectedSuggestionForView.user_name || selectedSuggestionForView.user_id} on {selectedSuggestionForView.timestamp ? format(new Date(selectedSuggestionForView.timestamp), 'PPP p') : 'N/A'}.
                    <br/>Type: <span className="font-medium capitalize">{selectedSuggestionForView.entity_type}</span>
                    {selectedSuggestionForView.is_new_item_suggestion ? <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-700/30 dark:text-blue-300">New Item Suggestion</Badge> : <span className="ml-2 text-xs">(Editing existing item ID: {selectedSuggestionForView.entity_id?.substring(0,8)}...)</span> }
                </AlertDialogDescription>
                </AlertDialogHeader>
                <ScrollArea className="max-h-[50vh] p-1 pr-3 my-4 border rounded-md">
                    {isLoadingOriginalItem ? (
                        <div className="flex justify-center items-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="ml-2">Loading original data...</span></div>
                    ) : (
                        <div className="space-y-3 py-2 px-1">
                            {renderSuggestedData(selectedSuggestionForView.suggested_data, originalItemData, selectedSuggestionForView.entity_type)}
                        </div>
                    )}
                </ScrollArea>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 shadow-md">Close</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
        )}
        <div className="mt-8 p-4 border border-blue-500/50 bg-blue-500/10 rounded-lg text-blue-700 dark:text-blue-300">
            <h3 className="font-semibold">Data Source Note:</h3>
            <p className="text-sm">
            Suggestions are fetched from and processed via the Supabase database. Approving a suggestion will attempt to update the relevant database table.
            </p>
        </div>
        </Container>
    </AdminLayout>
  );
}
    
