// src/app/page.tsx
import { Container } from '@/components/shared/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Users, Landmark as PartyIcon, FileText as BillIconLucide, CheckSquare as PromiseIconLucide, Edit3, Info, Newspaper, HandCoins, Github, HeartHandshake, Handshake, Search, MountainIcon, Sparkles } from 'lucide-react';
import { APP_NAME, FEATURED_LIMITS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { LatestNewsSection } from '@/components/home/latest-news-section';
import { FeaturedContentClient } from '@/components/home/featured-content-client';
import type { Politician, Party, UserPromise, Bill } from '@/types';
import { ClientOnly } from '@/components/shared/client-only';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { fetchEntityData } from '@/lib/data-fetcher'; 
import { ROUTES } from '@/lib/routes';


export default async function HomePage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  let featuredPoliticians: Politician[] = [];
  let politiciansError: any = null;
  try {
    const { data, error } = await fetchEntityData(supabase, 'politician', {
      filters: { isFeatured: true },
      limit: FEATURED_LIMITS.politicians,
      includeRelations: true
    });
    featuredPoliticians = (data as Politician[] | null) || [];
    politiciansError = error;
    if (politiciansError) console.error("Failed to fetch featured politicians for homepage:", politiciansError.message);
  } catch (e: any) {
    console.error("Error fetching featured politicians for homepage:", e.message);
    politiciansError = { message: e.message };
  }

  let featuredParties: Party[] = [];
  let partiesError: any = null;
  try {
    const { data, error } = await fetchEntityData(supabase, 'party', {
        filters: { isFeatured: true },
        limit: FEATURED_LIMITS.parties,
        includeRelations: true
    });
    featuredParties = (data as Party[] | null) || [];
    partiesError = error;
    if (partiesError) console.error("Failed to fetch featured parties for homepage:", partiesError.message);
  } catch (e: any) {
    console.error("Error fetching featured parties for homepage:", e.message);
    partiesError = { message: e.message };
  }
  
  let featuredPromises: UserPromise[] = [];
  let promisesError: any = null;
  try {
    const { data, error } = await fetchEntityData(supabase, 'promise', {
        filters: { isFeatured: true },
        limit: FEATURED_LIMITS.promises,
        includeRelations: true
    });
    featuredPromises = (data as UserPromise[] | null) || [];
    promisesError = error;
     if (promisesError) console.error("Failed to fetch featured promises for homepage:", promisesError.message);
  } catch (e: any) {
    console.error("Error fetching featured promises for homepage:", e.message);
    promisesError = { message: e.message };
  }

  let featuredBills: Bill[] = [];
  let billsError: any = null;
  try {
    const { data, error } = await fetchEntityData(supabase, 'bill', {
        filters: { isFeatured: true },
        limit: FEATURED_LIMITS.bills,
        includeRelations: true
    });
    featuredBills = (data as Bill[] | null) || [];
    billsError = error;
    if (billsError) console.error("Failed to fetch featured bills for homepage:", billsError.message);
  } catch (e: any) {
    console.error("Error fetching featured bills for homepage:", e.message);
    billsError = { message: e.message };
  }

  const cardHoverClasses = "transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02]";
  const anyFeaturedItems = featuredPoliticians.length > 0 || featuredParties.length > 0 || featuredPromises.length > 0 || featuredBills.length > 0;

  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-20 md:py-28 text-center bg-gradient-to-br from-primary/10 via-background to-secondary/5">
        <Container>
          <MountainIcon className="mx-auto h-16 w-16 text-primary mb-6" />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-foreground">
            Empowering Citizens, Ensuring Accountability in {APP_NAME}.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Your central platform to track politicians, parties, promises, and legislative bills for a more transparent democracy.
          </p>
          
          <div className="flex flex-col items-center gap-4 mb-10">
            {/* First row of buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center w-full">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transform hover:scale-105 transition-transform duration-300 w-full sm:w-auto">
                <Link href={ROUTES.POLITICIANS.LIST} prefetch={true}><Users className="mr-2 h-5 w-5" /> Explore Politicians</Link>
              </Button>
              <Button asChild size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg transform hover:scale-105 transition-transform duration-300 w-full sm:w-auto">
                <Link href={ROUTES.PARTIES.LIST} prefetch={true}><PartyIcon className="mr-2 h-5 w-5" /> Discover Parties</Link>
              </Button>
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transform hover:scale-105 transition-transform duration-300 w-full sm:w-auto">
                <Link href={ROUTES.PROMISES.LIST} prefetch={true}><PromiseIconLucide className="mr-2 h-5 w-5" /> Track Promises</Link>
              </Button>
            </div>
            {/* Second row of buttons */}
            <div className="w-full flex justify-center">
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center w-full">
                <Button asChild size="lg" variant="outline" className="shadow-lg transform hover:scale-105 transition-transform duration-300 w-full sm:w-auto border-primary text-primary hover:bg-primary/10 hover:text-primary">
                  <Link href={ROUTES.BILLS.LIST} prefetch={true}><BillIconLucide className="mr-2 h-5 w-5" /> View Bills</Link>
                </Button>
                <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white shadow-lg transform hover:scale-105 transition-transform duration-300 w-full sm:w-auto">
                  <Link href={ROUTES.CONTACT} prefetch={true}><HandCoins className="mr-2 h-5 w-5" /> Donate</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="shadow-lg transform hover:scale-105 transition-transform duration-300 w-full sm:w-auto border-accent text-accent hover:bg-accent/10 hover:text-accent">
                    <Link href={ROUTES.NEWS.LIST} prefetch={true}><Newspaper className="mr-2 h-5 w-5" /> Latest News</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <LatestNewsSection />
      
      <ClientOnly>
        {featuredPoliticians.length > 0 && (
          <FeaturedContentClient
            politicians={featuredPoliticians}
            sectionTitle="Featured Politicians"
            viewAllLink={ROUTES.POLITICIANS.LIST}
            iconName="politician"
            showPoliticians
          />
        )}
        {featuredParties.length > 0 && (
          <FeaturedContentClient
            parties={featuredParties}
            sectionTitle="Featured Parties"
            viewAllLink={ROUTES.PARTIES.LIST}
            iconName="party"
            showParties
          />
        )}
        {featuredPromises.length > 0 && (
          <FeaturedContentClient
            promises={featuredPromises}
            sectionTitle="Featured Promises"
            viewAllLink={ROUTES.PROMISES.LIST}
            iconName="promise"
            showPromises
          />
        )}
        {featuredBills.length > 0 && (
          <FeaturedContentClient
            bills={featuredBills}
            sectionTitle="Featured Bills"
            viewAllLink={ROUTES.BILLS.LIST}
            iconName="bill"
            showBills
          />
        )}
      </ClientOnly>
      
      {!anyFeaturedItems && (politiciansError || partiesError || promisesError || billsError) && (
         <section className="py-12 md:py-16">
          <Container className="text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-destructive">Error loading featured content.</h3>
            <p className="text-muted-foreground mt-2">
              There was an issue fetching featured items. Please try again later.
            </p>
          </Container>
        </section>
      )}

      {!anyFeaturedItems && !(politiciansError || partiesError || promisesError || billsError) && (
        <section className="py-12 md:py-16">
          <Container className="text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground">No items are currently featured.</h3>
            <p className="text-muted-foreground mt-2">
              Explore all content or check back later! Admins can feature items from their dashboard.
            </p>
          </Container>
        </section>
      )}

      <section className="py-12 md:py-16 bg-muted/30">
        <Container>
          <Card className={cn("shadow-xl p-6 md:p-10 text-center", cardHoverClasses)}>
            <CardHeader>
                <HeartHandshake className="mx-auto h-12 w-12 text-accent mb-4" />
                <CardTitle className="text-3xl font-bold mb-4 text-foreground">A Platform by the People, for the People</CardTitle>
                <CardDescription className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {APP_NAME} is a community-driven platform. We believe that transparency starts with accessible information and collective effort.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-8 text-left mt-8">
                    <div className="flex items-start space-x-4">
                        <Edit3 className="h-8 w-8 text-accent shrink-0 mt-1" />
                        <div>
                        <h4 className="font-semibold text-lg text-foreground">Suggest Edits & Updates</h4>
                        <p className="text-muted-foreground text-sm">Find outdated or incorrect information? Logged-in users can suggest changes to keep our data accurate and current.</p>
                        </div>
                    </div>
                     <div className="flex items-start space-x-4">
                        <Info className="h-8 w-8 text-accent shrink-0 mt-1" />
                        <div>
                        <h4 className="font-semibold text-lg text-foreground">Stay Informed</h4>
                        <p className="text-muted-foreground text-sm">Browse profiles, track promises, and understand legislative bills. Knowledge is power.</p>
                        </div>
                    </div>
                     <div className="flex items-start space-x-4">
                        <Handshake className="h-8 w-8 text-accent shrink-0 mt-1" /> 
                        <div>
                        <h4 className="font-semibold text-lg text-foreground">Open Source</h4>
                        <p className="text-muted-foreground text-sm">{APP_NAME} is proudly open source! Contributions from developers and data enthusiasts are welcome to enhance its features and data accuracy.</p>
                        </div>
                    </div>
                 </div>
                 <div className="mt-8 flex justify-center">
                    <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transform hover:scale-105 transition-transform duration-300">
                        <Link href={ROUTES.ABOUT} prefetch={true}>Learn More About Us</Link>
                    </Button>
                </div>
            </CardContent>
          </Card>
        </Container>
      </section>
      
      <section className="py-16 md:py-24 bg-primary/10">
        <Container className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Support Transparency in {APP_NAME}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Your contribution helps keep this platform running and promotes accountability.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
             <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white shadow-lg transform hover:scale-105 transition-transform duration-300">
              <Link href={ROUTES.CONTACT} prefetch={true}>
                <HandCoins className="mr-2 h-5 w-5" /> Donate
              </Link>
            </Button>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Curious about our mission and team? <Link href={ROUTES.ABOUT} prefetch={true} className="text-primary hover:underline font-medium">Learn more About Us</Link>.
          </p>
        </Container>
      </section>
    </div>
  );
}
