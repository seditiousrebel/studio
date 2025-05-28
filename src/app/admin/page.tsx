
"use client";

import { AdminLayout } from '@/components/layout/admin-layout';
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ADMIN_DASHBOARD_LINKS } from '@/lib/constants';
import { ArrowRight, LayoutDashboard, Edit3 } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <AdminLayout
        pageTitle="Admin Dashboard"
        pageDescription="Welcome, Admin! Manage application data, review suggestions, and access settings from here."
    >
      <Container className="py-8 md:py-12">
         <PageHeader
            title="Admin Dashboard"
            description={`Welcome, Admin! Manage application data, review suggestions, and access settings from here.`}
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ADMIN_DASHBOARD_LINKS.map((item) => (
            <Link href={item.href} key={item.href} className="group block">
              <Card className="h-full hover:shadow-xl transition-shadow duration-300 hover:border-primary/80 flex flex-col">
                <CardHeader className="flex-grow">
                  <div className="flex items-center justify-between">
                       <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {item.label}
                       </CardTitle>
                       {item.label === 'Review Suggestions' ? <Edit3 className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" /> : <LayoutDashboard className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
                 <CardContent className="pt-2">
                   <div className="text-primary group-hover:underline flex items-center text-sm">
                      Go to {item.label} <ArrowRight className="ml-1 h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                   </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-12 p-4 border border-destructive/50 bg-destructive/10 rounded-lg text-destructive">
          <h3 className="font-semibold">Developer Note:</h3>
          <p className="text-sm">
            Currently, all "Create", "Edit", "Feature", and "Suggestion Processing" operations in the admin section modify data only in your browser's memory.
            Changes will be lost if you refresh the page or close the browser. Persistent storage (e.g., a database) will be added in a future update.
          </p>
        </div>
      </Container>
    </AdminLayout>
  );
}
