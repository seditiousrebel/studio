
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { Container } from '@/components/shared/container';
import { Facebook, Twitter, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <Container className="py-8 text-sm text-muted-foreground">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
            <p>Promoting transparency in Nepali governance.</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <nav className="flex space-x-4">
              <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            </nav>
            <div className="flex space-x-3 mt-4 md:mt-0">
              <Link href="#" aria-label="Facebook" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" aria-label="Twitter" className="hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" aria-label="YouTube" className="hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
