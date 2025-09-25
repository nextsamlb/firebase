

'use client';

import { MainSidebar } from '@/components/main-sidebar';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/user-nav';
import { useAuth } from '@/hooks/use-auth';
import { Home, Menu, Swords, BarChart3, Users, X, Rss, Trophy } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/context/language-provider';
import { getAppSettings, type NewsItem } from '@/lib/data';
import { Providers } from '@/context/providers';
import { Inter, Oswald, Orbitron } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-heading' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-accent' });

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { t, language } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const publicPaths = ['/rankings', '/matches', '/hall-of-fame', '/rules', '/media-hub'];
      const isPublic = publicPaths.some(path => pathname.startsWith(path));
      
      if (!isPublic && pathname !== '/login' && pathname !== '/signup') {
          router.push('/login');
      }
    }
  }, [isAuthenticated, loading, router, pathname]);

  useEffect(() => {
    async function fetchNews() {
        setNewsLoading(true);
        try {
            const settings = await getAppSettings();
            if (settings && settings.newsTicker) {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const recentNews = settings.newsTicker.filter(item => {
                    if(!item.timestamp) return true;
                    return new Date(item.timestamp) > sevenDaysAgo
                });
                setNews(recentNews);
            } else {
                 setNews([
                    { title: 'New Season Kicks Off!', excerpt: 'The PIFA 2025 season has officially started with thrilling opening matches.', timestamp: new Date().toISOString() },
                    { title: 'Player "Sam" Breaks Goal Record', excerpt: 'A stunning performance sees a new league record for most goals in a single match.', timestamp: new Date().toISOString() },
                ]);
            }
        } catch (e) {
            console.error("Failed to fetch news ticker data", e);
             setNews([
                { title: 'Welcome to PIFA League', excerpt: 'The ultimate fantasy football experience.', timestamp: new Date().toISOString() },
             ]);
        } finally {
            setNewsLoading(false);
        }
    }
    fetchNews();
  }, []);

  const topNavLinks = [
    { href: "/dashboard", icon: Home, label: t('home') },
    { href: "/rankings", icon: BarChart3, label: t('rankings') },
    { href: "/matches", icon: Swords, label: t('matches') },
    { href: "/players", icon: Users, label: t('players') },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }
  
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

  if(isAuthPage) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            {children}
        </main>
    )
  }

  return (
    <div className="md:flex h-screen w-screen overflow-hidden bg-background text-foreground" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card text-card-foreground p-3 flex justify-between items-center shadow-md sticky top-0 z-[1000] border-b border-border">
          <div className="flex items-center gap-3">
             <div className="md:hidden">
                <Button onClick={() => setIsNavOpen(!isNavOpen)} variant="ghost" size="icon">
                    {isNavOpen ? <X /> : <Menu />}
                </Button>
            </div>
             <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-primary" />
                <div className="text-xl font-accent font-bold text-primary">PIFA LEAGUE</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
             {topNavLinks.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} className={`flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 px-3 py-2 rounded-md font-heading font-medium uppercase text-sm tracking-wider relative ${pathname.startsWith(href) ? 'active text-primary' : ''}`}>
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                </Link>
            ))}
          </div>
           <div className="flex items-center gap-2">
            <UserNav />
          </div>
        </header>

         <div className="news-ticker-container">
            <div className="news-ticker-content">
                {!newsLoading && news.map((item, index) => <span key={index}><strong><Rss className="inline w-4 h-4 mr-1 text-primary"/>{item.title}:</strong> {item.excerpt}</span>)}
            </div>
        </div>
        
        <div className={`transition-all duration-350 ${isNavOpen ? 'block' : 'hidden'} md:hidden bg-card shadow-lg z-[999] border-b-2 border-border`}>
         <ul className="flex flex-col md:flex-row md:justify-center md:gap-1">
             {topNavLinks.map(({ href, icon: Icon, label }) => (
              <li key={href}>
                 <Link href={href} className={`flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 px-4 py-3 font-heading font-medium uppercase text-sm tracking-wider relative before:content-[''] before:absolute before:w-0 before:h-1 before:bg-primary before:left-0 before:bottom-0 before:transition-all before:duration-350 hover:before:w-full ${pathname.startsWith(href) ? 'active text-primary' : ''}`}>
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                </Link>
              </li>
            ))}
        </ul>
      </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          {children}
        </main>
        
        <footer className="bg-card text-muted-foreground text-center p-4 text-sm shadow-[0_-5px_15px_rgba(0,0,0,0.1)] border-t border-border">
          <p>&copy; {new Date().getFullYear()} PIFA LEAGUE Stats. Pro Edition - All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable,
          oswald.variable,
          orbitron.variable
        )}
      >
        <Providers>
          <RootLayoutContent>{children}</RootLayoutContent>
        </Providers>
      </body>
    </html>
  );
}
