import type React from 'react'
import {
  Trophy,
  Users,
  Award,
  Newspaper,
  ImageIcon,
  Flame,
} from 'lucide-react'
import { getPlayers, getMatches, type Player, type Match, NewsItem, MediaItem, getMediaItems } from '@/lib/data'
import Image from 'next/image'
import { getTranslations } from '@/context/language-provider-server'
import { DashboardClient } from './client'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default async function HomePage() {
  const { t, language } = await getTranslations()

  const [allPlayers, allMedia] = await Promise.all([
      getPlayers(),
      getMediaItems()
  ]);

  const players = allPlayers.filter(p => p.role === 'player');
  const media = allMedia.slice(0, 4);

  // Set an initial empty summary to avoid hitting rate limits on every page load.
  // The client will be responsible for fetching it on demand.
  const initialActivitySummary = '';

  const topPlayer = players.length > 0 ? [...players].sort((a,b) => b.stats.points - a.stats.points)[0] : null;
  const fanFavorite = players.length > 0 ? [...players].sort((a,b) => b.bestPlayerVotes - a.bestPlayerVotes)[0] : null;

  const getInitials = (name: string) => {
    if (!name) return '?'
    const names = name.split(' ')
    const initials = names.map((n) => n[0]).join('')
    return initials.toUpperCase()
  }

  return (
    <div className="relative p-4 md:p-6 lg:p-8 space-y-8">
       {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat -z-10">
        <Image src="https://picsum.photos/seed/lobby/1920/1080" alt="Stadium background" layout="fill" objectFit="cover" data-ai-hint="stadium lights" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
      </div>

       {/* Welcome Section */}
        <div className="text-center">
          <div className="glass p-6 md:p-8 rounded-3xl max-w-4xl mx-auto border border-primary/20">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
              <Image
                src="https://i.ibb.co/vvw5tKym/Designer-30.jpg"
                alt="PIFA"
                width={64}
                height={64}
                className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-primary"
                data-ai-hint="logo"
              />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 font-accent">PIFA League Lobby</h1>
                <p className="text-lg md:text-xl text-primary">Your Gateway to Football Excellence</p>
              </div>
            </div>
            {/* User-specific welcome is now in Client Component */}
          </div>
        </div>

      {/* Main Content Grid */}
      <DashboardClient
        players={players}
        initialActivitySummary={initialActivitySummary}
        topPlayer={topPlayer}
        fanFavorite={fanFavorite}
        media={media}
        language={language}
      />
    </div>
  )
}
