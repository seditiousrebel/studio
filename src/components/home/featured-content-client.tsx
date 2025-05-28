// src/components/home/featured-content-client.tsx
'use client';

import { useRouter } from 'next/navigation';
import { PoliticianCard } from '@/components/politicians/politician-card';
import { PartyCard } from '@/components/parties/party-card';
import { PromiseCard } from '@/components/promises/promise-card';
import { BillCard } from '@/components/bills/bill-card';
import type { Politician, Party, UserPromise, Bill } from '@/types';
import { Container } from '@/components/shared/container';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, UserCircle, Landmark as PartyIconLucide, FileText as BillIconLucide, CheckSquare as PromiseIconLucide, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconName = 'politician' | 'party' | 'promise' | 'bill'; // Explicit type alias

interface FeaturedContentClientProps {
  politicians?: Politician[];
  parties?: Party[];
  promises?: UserPromise[];
  bills?: Bill[];
  sectionTitle: string;
  viewAllLink: string;
  iconName: IconName; // Use the explicit type alias
  showPoliticians?: boolean;
  showParties?: boolean;
  showPromises?: boolean;
  showBills?: boolean;
}

const iconMap: Record<IconName, LucideIcon> = {
  politician: UserCircle,
  party: PartyIconLucide,
  promise: PromiseIconLucide,
  bill: BillIconLucide,
};

export function FeaturedContentClient({
  politicians = [], 
  parties = [],     
  promises = [],    
  bills = [],       
  sectionTitle,
  viewAllLink,
  iconName,
  showPoliticians = false,
  showParties = false,
  showPromises = false,
  showBills = false,
}: FeaturedContentClientProps) {
  const router = useRouter();
  const SectionIcon = iconMap[iconName];

  const handlePoliticianTagClick = (tag: string) => { router.push(`/politicians?tag=${encodeURIComponent(tag)}`); };
  const handlePoliticianPartyClick = (partyId: string) => { router.push(`/politicians?party=${encodeURIComponent(partyId)}`); };
  const handlePoliticianProvinceClick = (province: string) => { router.push(`/politicians?province=${encodeURIComponent(province)}`); };

  const handlePartyTagClick = (tag: string) => { router.push(`/parties?tag=${encodeURIComponent(tag)}`); };
  const handlePartyIdeologyClick = (ideology: string) => { router.push(`/parties?ideology=${encodeURIComponent(ideology)}`); };
  const handlePartyHeadquartersClick = (hq: string) => { router.push(`/parties?search=${encodeURIComponent(hq)}`); };

  const handlePromiseTagClick = (tag: string) => { router.push(`/promises?tag=${encodeURIComponent(tag)}`); };
  const handlePromiseCategoryClick = (category: string) => { router.push(`/promises?category=${encodeURIComponent(category)}`); };
  const handlePromisePoliticianClick = (politicianId: string) => { router.push(`/politicians/${politicianId}`); };
  const handlePromisePartyClick = (partyId: string) => { router.push(`/parties/${partyId}`); };
  
  const handleBillTagClick = (tag: string) => { router.push(`/bills?tag=${encodeURIComponent(tag)}`); };

  const shouldShowPoliticians = showPoliticians && politicians.length > 0;
  const shouldShowParties = showParties && parties.length > 0;
  const shouldShowPromises = showPromises && promises.length > 0;
  const shouldShowBills = showBills && bills.length > 0;

  if (!shouldShowPoliticians && !shouldShowParties && !shouldShowPromises && !shouldShowBills) {
    return null; 
  }

  return (
    <>
      {/* Featured Politicians */}
      {shouldShowPoliticians && (
        <section className="py-12 md:py-16 bg-secondary/5">
          <Container>
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-bold text-foreground flex items-center">
                <SectionIcon className="h-8 w-8 mr-3 text-primary" /> {sectionTitle}
              </h2>
              <Button asChild variant="link" className="text-primary hover:text-primary/80">
                <Link href={viewAllLink} prefetch={true}>View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
              {politicians.map((politician) => (
                <PoliticianCard 
                  key={politician.id} 
                  politician={politician} 
                  onTagClick={handlePoliticianTagClick}
                  onPartyClick={handlePoliticianPartyClick}
                  onProvinceClick={handlePoliticianProvinceClick}
                />
              ))}
            </div>
          </Container>
        </section>
      )}
      
      {/* Featured Parties */}
      {shouldShowParties && (
        <section className="py-12 md:py-16">
          <Container>
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-bold text-foreground flex items-center">
                <SectionIcon className="h-8 w-8 mr-3 text-primary" /> {sectionTitle}
              </h2>
              <Button asChild variant="link" className="text-primary hover:text-primary/80">
                <Link href={viewAllLink} prefetch={true}>View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
              {parties.map((party) => (
                <PartyCard 
                  key={party.id} 
                  party={party} 
                  onTagClick={handlePartyTagClick}
                  onIdeologyClick={handlePartyIdeologyClick}
                  onHeadquartersClick={handlePartyHeadquartersClick}
                />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Featured Promises */}
      {shouldShowPromises && (
        <section className="py-12 md:py-16 bg-muted/30">
          <Container>
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-bold text-foreground flex items-center">
                <SectionIcon className="h-8 w-8 mr-3 text-primary" /> {sectionTitle}
              </h2>
              <Button asChild variant="link" className="text-primary hover:text-primary/80">
                <Link href={viewAllLink} prefetch={true}>View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
              {promises.map((promise) => (
                <PromiseCard 
                  key={promise.id} 
                  promise={promise} 
                  onTagClick={handlePromiseTagClick}
                  onCategoryClick={handlePromiseCategoryClick}
                  onPoliticianClick={handlePromisePoliticianClick}
                  onPartyClick={handlePromisePartyClick}
                />
              ))}
            </div>
          </Container>
        </section>
      )}
      
      {/* Featured Bills */}
      {shouldShowBills && (
        <section className="py-12 md:py-16 bg-primary/5">
          <Container>
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-bold text-foreground flex items-center">
                <SectionIcon className="h-8 w-8 mr-3 text-primary" /> {sectionTitle}
              </h2>
              <Button asChild variant="link" className="text-primary hover:text-primary/80">
                <Link href={viewAllLink} prefetch={true}>View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
              {bills.map((bill) => (
                <BillCard 
                  key={bill.id} 
                  bill={bill} 
                  onTagClick={handleBillTagClick}
                />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
