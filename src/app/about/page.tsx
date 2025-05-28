
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import { Users, Target, Eye, Handshake, Landmark, CheckSquare, FileText as BillIconLucide, Github, Zap, Database, BarChart2, DatabaseZap, FileEdit, ListChecks, Info, Lightbulb, Scale, UserCheck, ShieldCheck, AlertTriangle, Users2, ListOrdered, GitCommit } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { StatCard } from '@/components/shared/stat-card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { PlatformStatistic } from '@/types'; 

const mockPlatformStats: PlatformStatistic[] = [
  { id: 'politicians', label: 'Politicians Tracked', value: '150+', icon: Users2, trend: 'up' },
  { id: 'parties', label: 'Parties Listed', value: '25+', icon: Landmark, trend: 'up' },
  { id: 'promises', label: 'Promises Monitored', value: '500+', icon: ListOrdered, trend: 'up' },
  { id: 'bills', label: 'Bills Documented', value: '300+', icon: BillIconLucide, trend: 'up' },
];

export default function AboutPage() {
  const cardHoverClasses = "transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02]";
  const sectionSpacing = "py-12 md:py-16";
  const iconClass = "mx-auto h-10 w-10 md:h-12 md:w-12 text-accent mb-4";

  return (
    <Container className="py-8 md:py-12">
      <PageHeader
        title={`About ${APP_NAME}`}
        description={`Empowering citizens with transparent information for a stronger Nepali democracy.`}
      />

      <section className={cn(sectionSpacing, "bg-muted/30 rounded-lg")}>
        <Container>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl font-bold mb-4 text-primary flex items-center">
                <Target className="mr-3 h-8 w-8 text-primary shrink-0" /> Our Mission
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {APP_NAME} is a civic-tech platform dedicated to helping Nepali citizens access, understand, and track information about their political landscape. We aim to foster transparency, accountability, and informed civic participation.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe an informed citizenry is the cornerstone of a vibrant democracy. By providing a neutral, data-driven platform, we empower citizens to engage more effectively with governance.
              </p>
            </div>
            <div className={cn("relative h-80 w-full rounded-lg overflow-hidden shadow-xl order-1 md:order-2", cardHoverClasses)}>
              <Image
                src="https://placehold.co/600x400.png"
                alt="Illustrative image representing civic engagement or Nepal's landscape"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                data-ai-hint="nepal democracy people"
              />
            </div>
          </div>
          <Separator className="my-12" />
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-primary flex items-center justify-center">
              <ShieldCheck className="mr-3 h-8 w-8 text-primary shrink-0" /> We Are Independent
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {APP_NAME} is an independent, non-partisan initiative. We have no affiliation with any political party, organization, or special interest group. Our commitment is to the citizens of Nepal and the democratic values that underpin our nation.
            </p>
          </div>
        </Container>
      </section>

      <section className={cn(sectionSpacing)}>
        <Container>
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">How {APP_NAME} Works</h2>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: DatabaseZap, step: 1, title: 'Data Aggregation & Profiling', text: 'Publicly available data and community contributions are used to create and maintain comprehensive profiles for politicians, parties, promises, and bills.' },
              { icon: ListChecks, step: 2, title: 'Track & Monitor', text: 'Follow the status of campaign promises and the progress of legislative bills, alongside politician and party activities.' },
              { icon: UserCheck, step: 3, title: 'Suggest & Verify', text: 'Users can suggest edits and new information, helping to keep the platform accurate. Suggestions are reviewed by our admin team.' },
              { icon: Info, step: 4, title: 'Engage & Inform', text: `Use ${APP_NAME} to stay informed, understand political activities, vote on entities, and participate in fostering accountability.` },
            ].map(item => (
              <Card key={item.step} className={cn("text-center shadow-lg h-full flex flex-col", cardHoverClasses)}>
                <CardHeader className="flex-grow">
                  <div className="relative">
                    <item.icon className={iconClass} />
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md">{item.step}</div>
                  </div>
                  <CardTitle className="text-xl mt-2">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>
      
      <section className={cn(sectionSpacing, "bg-muted/30 rounded-lg")}>
        <Container>
          <Card className={cn("shadow-xl text-center border", cardHoverClasses)}>
            <CardHeader>
              <Github className="mx-auto h-12 w-12 md:h-16 md:w-16 text-primary mb-4" />
              <CardTitle className="text-3xl font-bold text-foreground">Open Source & Community Driven</CardTitle>
            </CardHeader>
            <CardContent className="max-w-3xl mx-auto">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {APP_NAME} is a proudly open-source project. We believe that collaboration and transparency are essential for creating tools that serve the public good. Our code is publicly available, and we welcome contributions from everyone – developers, designers, researchers, data enthusiasts, and engaged citizens.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Whether you want to help write code, improve our data, suggest new features, or spread the word, your involvement is crucial to our success.
              </p>
              <Button asChild size="lg" className={cn("bg-accent hover:bg-accent/90 text-accent-foreground", cardHoverClasses)}>
                <Link href="#github-placeholder" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-5 w-5" /> View on GitHub (Placeholder)
                </Link>
              </Button>
            </CardContent>
          </Card>
        </Container>
      </section>

      <section className={cn(sectionSpacing)}>
        <Container>
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">{APP_NAME} at a Glance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockPlatformStats.map((stat) => (
              <StatCard
                key={stat.id}
                title={stat.label}
                value={stat.value}
                icon={stat.icon || Users} 
                description={stat.trend ? `vs last month` : undefined}
                trend={stat.trend}
                className={cardHoverClasses}
              />
            ))}
          </div>
        </Container>
      </section>

       <section className={cn(sectionSpacing, "bg-muted/30 rounded-lg")}>
        <Container className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-2 border-primary/50">
            <CardHeader className="text-center flex flex-row items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-primary mr-3" />
              <CardTitle className="text-3xl font-bold text-foreground">Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground text-sm leading-relaxed">
                <p>
                All content on {APP_NAME} is sourced from publicly available information and contributions from our users. It is intended for civic awareness, educational, and informational purposes only.
                </p>
                <p>
                {APP_NAME} does not endorse or promote any specific political party, politician, or viewpoint. Our goal is to present information as objectively as possible to empower citizens.
                </p>
                <p>
                Images used on this platform are primarily for illustration and identification purposes and do not imply endorsement or ownership by {APP_NAME} unless explicitly stated. We strive to respect all copyright and intellectual property rights.
                </p>
                <p>
                {APP_NAME} operates with full respect for the laws of Nepal and the rights guaranteed by the Constitution of Nepal, including those pertaining to freedom of expression and access to information. While we strive for accuracy, we cannot guarantee the absolute correctness of all data at all times and encourage users to cross-verify information.
                </p>
            </CardContent>
          </Card>
        </Container>
      </section>
    </Container>
  );
}
    
