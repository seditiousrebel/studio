
"use client";

import { useState } from 'react';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_NAME } from '@/lib/constants';
import { Send, HandCoins, ShieldCheck, Lightbulb, Users, CreditCard, Repeat, Mail, Database, Server, Presentation, Wrench, Share2, Heart, Twitter, Facebook, QrCode } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    toast({ title: "Message Sent!", description: "Thank you for contacting us. We'll get back to you soon." });
    setName(''); setEmail(''); setSubject(''); setMessage('');
  };

  const cardHoverClasses = "transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02]";
  const sectionSpacing = "py-12 md:py-16";

  return (
    <Container className="py-8 md:py-12 space-y-12">
      <PageHeader
        title={`Support & Contact ${APP_NAME}`}
        description={`Your questions, feedback, and support help us foster transparency in Nepal.`}
      />

      <section className="grid md:grid-cols-2 gap-10 items-start">
        <Card className="shadow-xl flex flex-col h-full">
          <CardHeader className="text-center">
            <Mail className="mx-auto h-10 w-10 text-primary mb-3" />
            <CardTitle className="text-2xl">Send us a Message</CardTitle>
            <CardDescription>Have questions, suggestions, or want to get involved? Reach out!</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col h-full">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} required className="bg-background"/>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="bg-background"/>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Regarding..." value={subject} onChange={e => setSubject(e.target.value)} required className="bg-background"/>
              </div>
              <div className="space-y-1.5 flex-grow flex flex-col">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Your message here..." value={message} onChange={e => setMessage(e.target.value)} required rows={5} className="bg-background flex-grow"/>
              </div>
              <Button type="submit" className="w-full mt-auto bg-green-600 hover:bg-green-700 text-white shadow-md" disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" /> {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className={cn("shadow-xl flex flex-col h-full bg-gradient-to-br from-primary/5 via-transparent to-secondary/5", cardHoverClasses)}>
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-2">
                    <Heart className="h-10 w-10 text-primary mb-2" />
                    <HandCoins className="h-10 w-10 text-primary mb-2" />
                </div>
                <CardTitle className="text-2xl">Support {APP_NAME}</CardTitle>
                <CardDescription>Your contribution fuels transparency and accountability in Nepal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-grow">
                <p className="text-sm text-muted-foreground text-center">
                {APP_NAME} is a community-driven, non-profit initiative. Your support is vital for our operations, including research, data maintenance, and platform development.
                </p>
                
                <div className="space-y-3">
                    <h4 className="font-semibold text-md flex items-center"><QrCode className="mr-2 h-5 w-5 text-green-600"/>Donate within Nepal (via QR)</h4>
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md">
                         Show QR Code
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Donate via QR (Nepal)</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please scan the QR code below using your mobile banking or digital wallet app to make a donation. Thank you for your support!
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex justify-center my-4">
                        <Image src="https://placehold.co/250x250.png" alt="Donation QR Code Placeholder" width={250} height={250} data-ai-hint="qr code placeholder"/>
                        </div>
                        <AlertDialogFooter>
                        <AlertDialogCancel className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 shadow-md">Close</AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                </div>

                <Separator />

                <div className="space-y-3">
                    <h4 className="font-semibold text-md flex items-center"><CreditCard className="mr-2 h-5 w-5 text-blue-600"/>International Donations</h4>
                     <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-md">
                         Donate with Card (Coming Soon)
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>International Donations</AlertDialogTitle>
                        <AlertDialogDescription>
                            We are working on setting up secure international donations. This feature will be available soon.
                            <br /><br />
                            For immediate international contributions, please contact us at <strong className="text-primary">donate@{APP_NAME.toLowerCase().replace(/\s+/g, '')}.np</strong> (placeholder).
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 shadow-md">Close</AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
            <CardFooter className="mt-auto flex-col items-center text-center">
                <p className="text-xs text-muted-foreground mb-1">Transparent financial reporting will be shared yearly (Placeholder).</p>
                <p className="text-xs text-muted-foreground">{APP_NAME} is a non-profit effort run by volunteers.</p>
            </CardFooter>
        </Card>
      </section>
      
      <section className={cn(sectionSpacing, "bg-muted/30 rounded-lg py-10")}>
        <Container>
            <h2 className="text-3xl font-bold text-center text-foreground mb-10">What Your Contribution Achieves</h2>
            <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-8">
            {[
                { icon: ShieldCheck, title: 'Protect Data Integrity', text: 'Ensuring information is accurate, unbiased, and secure from undue influence.' },
                { icon: Lightbulb, title: 'Enhance Platform Features', text: 'Continuously improving NetaTrack with new tools and data for deeper insights.' },
                { icon: Users, title: 'Expand Civic Engagement', text: 'Reaching more citizens and fostering a nationwide culture of accountability.' },
            ].map(value => (
                <Card key={value.title} className={cn("text-center shadow-lg h-full", cardHoverClasses)}>
                <CardHeader>
                    <value.icon className="mx-auto h-12 w-12 text-accent mb-3" />
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">{value.text}</p>
                </CardContent>
                </Card>
            ))}
            </div>
        </Container>
      </section>
      
       <section className={cn(sectionSpacing, "py-10")}>
        <Container>
            <h2 className="text-3xl font-bold text-center text-foreground mb-10">How Your Support is Utilized</h2>
            <div className="grid md:grid-cols-3 gap-8">
            <Card className={cn("p-6 rounded-lg shadow-lg border h-full", cardHoverClasses)}>
                <Database className="h-10 w-10 text-primary mb-3" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Research & Data</h3>
                <p className="text-sm text-muted-foreground">Thorough research, information verification, and database maintenance.</p>
            </Card>
            <Card className={cn("p-6 rounded-lg shadow-lg border h-full", cardHoverClasses)}>
                <Server className="h-10 w-10 text-primary mb-3" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Technology & Platform</h3>
                <p className="text-sm text-muted-foreground">Maintaining and improving our platform for reliable and secure access.</p>
            </Card>
            <Card className={cn("p-6 rounded-lg shadow-lg border h-full", cardHoverClasses)}>
                <Presentation className="h-10 w-10 text-primary mb-3" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Community & Outreach</h3>
                <p className="text-sm text-muted-foreground">Educating citizens and empowering effective use of {APP_NAME}.</p>
            </Card>
            </div>
        </Container>
      </section>

      <section className={cn(sectionSpacing, "bg-muted/30 rounded-lg py-10")}>
        <Container>
            <h2 className="text-3xl font-bold text-center text-foreground mb-10">Other Ways to Get Involved</h2>
            <div className="grid md:grid-cols-2 gap-8">
            <Card className={cn("shadow-lg h-full", cardHoverClasses)}>
                <CardHeader>
                <Wrench className="h-10 w-10 text-accent mb-2" />
                <CardTitle>Volunteer Your Skills</CardTitle>
                <CardDescription>Lend your expertise in data, design, translation, or outreach.</CardDescription>
                </CardHeader>
                <CardContent>
                <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                    onClick={() => {
                    const subjectField = document.getElementById('subject') as HTMLInputElement;
                    if (subjectField) {
                        subjectField.value = "Volunteering Inquiry";
                        subjectField.focus();
                    }
                    const messageField = document.getElementById('message') as HTMLTextAreaElement;
                        if (messageField) {
                        messageField.focus();
                        }
                    }}
                >
                    I'm Interested in Volunteering
                </Button>
                </CardContent>
            </Card>
            <Card className={cn("shadow-lg h-full", cardHoverClasses)}>
                <CardHeader>
                <Share2 className="h-10 w-10 text-accent mb-2" />
                <CardTitle>Share & Spread the Word</CardTitle>
                <CardDescription>Help us reach more citizens and amplify our impact.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                <div className="flex gap-2">
                    <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                    <Link href={`https://twitter.com/intent/tweet?text=Check%20out%20${APP_NAME}%20for%20transparent%20Nepali%20governance%20data!%20%23${APP_NAME.replace(/\s+/g, '')}%20%23NepalPolitics%20[YOUR_APP_URL_HERE]`} target="_blank" rel="noopener noreferrer">
                        <Twitter className="mr-2 h-4 w-4" /> Share on X
                    </Link>
                    </Button>
                    <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                    <Link href={`https://www.facebook.com/sharer/sharer.php?u=[YOUR_APP_URL_HERE]&quote=Check%20out%20${APP_NAME}%20for%20transparent%20Nepali%20governance%20data!`} target="_blank" rel="noopener noreferrer">
                        <Facebook className="mr-2 h-4 w-4" /> Share on Facebook
                    </Link>
                    </Button>
                </div>
                </CardContent>
            </Card>
            </div>
        </Container>
      </section>
    </Container>
  );
}
