

import type React from 'react'
import {
  getPlayers,
  getMatches,
  type Player,
  type Match,
  NewsItem,
  MediaItem,
  getMediaItems,
} from '@/lib/data'
import Image from 'next/image'
import { getTranslations } from '@/context/language-provider-server'
import { DashboardClient } from './client'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'


const HeroSection = ({ topPlayer, t }: { topPlayer: Player | null, t: (key: string) => string }) => {
    if (!topPlayer) return null;

    return (
        <div className="relative text-center p-8 md:p-12 rounded-3xl overflow-hidden glass min-h-[300px] flex flex-col justify-center items-center">
            <Image 
                src="https://picsum.photos/seed/hero-bg/1200/400"
                alt="Stadium lights"
                fill
                className="object-cover -z-10 opacity-20"
                data-ai-hint="stadium lights"
            />
            <div className="relative z-10">
                <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary">
                    <AvatarImage src={topPlayer.avatar} alt={topPlayer.name} data-ai-hint="person face" />
                    <AvatarFallback>{topPlayer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-lg font-semibold text-primary">{t('leagueLeader')}</p>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 font-accent">
                    {topPlayer.name}
                </h2>
                <p className="text-xl text-muted-foreground">{topPlayer.stats.points} {t('points')} | {topPlayer.stats.wins} {t('wins')}</p>
                 <Link href={`/profile/${topPlayer.id}`} passHref>
                    <Button variant="outline" className="mt-6">View Profile</Button>
                </Link>
            </div>
        </div>
    )
}


export default async function HomePage() {
  const { t, language } = await getTranslations()

  const [allPlayers, allMedia, allMatches] = await Promise.all([
      getPlayers(),
      getMediaItems(),
      getMatches(),
  ]);

  const players = allPlayers.filter(p => p.role === 'player');
  const media = allMedia.slice(0, 4);
  const completedMatches = allMatches.filter(m => m.result);

  // Set an initial empty summary to avoid hitting rate limits on every page load.
  // The client will be responsible for fetching it on demand.
  const initialActivitySummary = '';

  const topPlayer = players.length > 0 ? [...players].sort((a,b) => b.stats.points - a.stats.points)[0] : null;
  const fanFavorite = players.length > 0 ? [...players].sort((a,b) => b.bestPlayerVotes - a.bestPlayerVotes)[0] : null;
  const topScorer = players.length > 0 ? [...players].sort((a, b) => b.stats.goalsFor - a.stats.goalsFor)[0] : null;
  const activePlayers = players.filter(p => p.stats.played > 0);
  const bestDefense = activePlayers.length > 0 ? activePlayers.reduce((prev, current) => ((prev.stats.goalsAgainst / prev.stats.played) < (current.stats.goalsAgainst / current.stats.played)) ? prev : current) : null;
  const mostWins = players.length > 0 ? [...players].sort((a, b) => b.stats.wins - a.stats.wins)[0] : null;

  // The most improved player report is now generated on the client to avoid rate limiting.
  const mostImprovedReport = "";

  const leagueStats = {
      totalMatches: completedMatches.length,
      totalGoals: players.reduce((sum, p) => sum + p.stats.goalsFor, 0),
      avgGoalsPerMatch: completedMatches.length > 0
          ? (completedMatches.reduce((sum, m) => {
              const scores = m.result?.split('-').map(Number) || [0,0];
              return sum + scores[0] + scores[1];
          }, 0) / completedMatches.length).toFixed(2)
          : '0.00',
  }

  return (
    <div className="p-0 md:p-0 lg:p-0 space-y-8">
       {/* Welcome Section */}
        <div className="text-center mb-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <Image
                src="https://i.ibb.co/vvw5tKym/Designer-30.jpg"
                alt="PIFA"
                width={64}
                height={64}
                className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-primary"
                data-ai-hint="logo"
              />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold text-white font-accent">PIFA League</h1>
                <p className="text-lg md:text-xl text-primary">Your Gateway to Football Excellence</p>
              </div>
            </div>
        </div>
        
        <HeroSection topPlayer={topPlayer} t={t} />

      {/* Main Content Grid */}
      <DashboardClient
        players={players}
        initialActivitySummary={initialActivitySummary}
        topScorer={topScorer}
        bestDefense={bestDefense}
        mostWins={mostWins}
        fanFavorite={fanFavorite}
        mostImprovedReport={mostImprovedReport}
        media={media}
        language={language}
        leagueStats={leagueStats}
      />
    </div>
  )
}
