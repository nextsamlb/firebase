'use client'

import type React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Trophy,
  Award,
  Zap,
  Newspaper,
  ImageIcon,
  Flame,
  BrainCircuit,
  Quote,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { getMatches, type Player, type Match, MediaItem } from '@/lib/data'
import Image from 'next/image'
import { generateActivitySummary, generatePlayerReport } from '@/app/actions'
import { useTranslation } from '@/context/language-provider'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {marked} from 'marked';

const PlayerFact = ({ players }: { players: Player[] }) => {
    const [fact, setFact] = useState('');
    const [loading, setLoading] = useState(true);

    const generateFact = useCallback(() => {
        if (players.length === 0) {
            setLoading(false);
            return;
        };
        setLoading(true);
        const player = players[Math.floor(Math.random() * players.length)];
        const winRate = player.stats.played > 0 ? ((player.stats.wins / player.stats.played) * 100).toFixed(1) : 0;
        const factTypes = [
            `Did you know? ${player.name} has a win rate of ${winRate}%!`,
            `Player Spotlight: ${player.name} has scored ${player.stats.goalsFor} goals so far this season.`,
            player.position ? `${player.name}'s favorite position on the pitch is ${player.position}.` : '',
            player.nationality ? `Hailing from ${player.nationality}, ${player.name} brings a unique style to the league.` : '',
        ].filter(Boolean);

        if (factTypes.length > 0) {
            setFact(factTypes[Math.floor(Math.random() * factTypes.length)]);
        } else {
            setFact("No interesting facts available right now.");
        }
        setLoading(false);
    }, [players]);

    useEffect(() => {
        generateFact();
    }, [generateFact]);

    if (loading) return <Skeleton className="h-10 w-full" />

    return (
        <Card className="glass">
          <CardContent className="p-4">
              <div className="flex items-center gap-3">
                  <Quote className="w-5 h-5 text-primary"/>
                  <p className="text-sm text-muted-foreground italic">{fact}</p>
              </div>
          </CardContent>
        </Card>
    );
};

interface DashboardClientProps {
    players: Player[];
    initialActivitySummary: string;
    topPlayer: Player | null;
    fanFavorite: Player | null;
    media: MediaItem[];
    language: 'en' | 'ar';
}

export function DashboardClient({
    players,
    initialActivitySummary,
    topPlayer,
    fanFavorite,
    media: initialMedia,
    language
}: DashboardClientProps) {
  const [activitySummary, setActivitySummary] = useState(initialActivitySummary);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [playerReport, setPlayerReport] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  
  const { user, isAuthenticated } = useAuth()
  const { t } = useTranslation()

  const handleGenerateSummary = useCallback(async () => {
    setGeneratingSummary(true);
    setActivitySummary('');
    try {
        const matches = await getMatches();
        const allPlayers = players;
        const recentMatches = matches
            .filter(m => m.result)
            .slice(0, 5)
            .map(m => {
                const player1 = allPlayers.find(p => p.id === m.player1Id);
                const opponentIds = m.player2Ids || (m.player2Id ? [m.player2Id] : []);
                const opponents = opponentIds.map(id => allPlayers.find(p => p.id === id)?.name).filter(Boolean).join(' & ');
                return {
                    matchId: m.id,
                    stageName: m.stageName,
                    player1Name: player1?.name || 'Unknown',
                    player2Name: opponents,
                    result: m.result || 'N/A',
                    timestamp: m.timestamp
                }
            });

        const result = await generateActivitySummary({ matches: recentMatches, transfers: [], language });

        if ('summary' in result) {
            setActivitySummary(result.summary);
        } else {
            setActivitySummary('Failed to generate summary.');
        }
    } catch (error) {
        setActivitySummary('An error occurred while generating the summary.');
    } finally {
        setGeneratingSummary(false);
    }
  }, [language, players]);

  const handleGenerateReport = async () => {
    const player = players.find(p => p.id === selectedPlayer);
    if (!player) return;
    setGeneratingReport(true);
    setPlayerReport('');
    try {
      const report = await generatePlayerReport({
        name: player.name,
        nickname: player.nickname,
        matchesPlayed: player.stats.played,
        wins: player.stats.wins,
        goals: player.stats.goalsFor,
        assists: player.stats.assists,
        winRate: ((player.stats.wins / (player.stats.played || 1)) * 100).toFixed(1) + '%',
        language: language,
      })
      if ('error' in report) {
        setPlayerReport('Failed to generate AI report.')
      } else {
        setPlayerReport(report.report)
      }
    } catch (error) {
      console.error('Failed to generate AI report:', error)
      setPlayerReport('An unexpected error occurred while generating the report.')
    } finally {
      setGeneratingReport(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    const names = name.split(' ')
    const initials = names.map((n) => n[0]).join('')
    return initials.toUpperCase()
  }

  return (
    <>
      {isAuthenticated && user && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 -mt-4 mb-8">
            <Avatar className="w-16 h-16 border-4 border-primary">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.nickname} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-white">{t('welcomeMessage')}, {user.nickname}!</h3>
              <p className="text-white/70">{t('welcomeSubtitle')}</p>
            </div>
          </div>
        )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
            <PlayerFact players={players} />
           {/* AI Activity Summary */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-primary" />
                  {t('aiLeagueRecap')}
                </div>
                <Button onClick={handleGenerateSummary} disabled={generatingSummary} size="sm" variant="outline">
                  {generatingSummary ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4" />}
                </Button>
              </CardTitle>
              <CardDescription>{t('aiSummaryDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {generatingSummary ? (
                 <Skeleton className="h-24 w-full" />
              ) : activitySummary ? (
                <p className="text-white/80 italic">{activitySummary}</p>
              ) : (
                <div className="text-center py-6">
                    <Newspaper className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">{t('noRecentActivity')}</p>
                    <Button onClick={handleGenerateSummary} disabled={generatingSummary} variant="default">
                        {generatingSummary ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Zap className="w-4 h-4 mr-2" />}
                        {t('generateSummary')}
                    </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
           {/* Media Hub Section */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  {t('mediaHub')}
                </div>
                <Link href="/media-hub">
                   <Button variant="outline" size="sm">{t('viewAll')}</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {media.map(item => (
                  <Link href="/media-hub" key={item.id}>
                    <Image src={item.src} alt={item.title} width={400} height={300} className="rounded-lg object-cover w-full h-auto shadow-md aspect-video hover:opacity-80 transition-opacity" data-ai-hint={item.hint}/>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
           {/* Top Stories */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                {t('topStories')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {topPlayer && (
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16 border-2 border-primary">
                    <AvatarImage src={topPlayer.avatar} />
                    <AvatarFallback>{getInitials(topPlayer.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('leagueLeader')}</p>
                    <p className="font-bold text-white text-lg">{topPlayer.name}</p>
                    <p className="font-bold text-primary">{topPlayer.stats.points} {t('points')}</p>
                  </div>
                </div>
              )}
              {fanFavorite && (
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-teal-400"/>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('fanFavorite')}</p>
                    <p className="font-bold text-white">{fanFavorite.name} ({fanFavorite.bestPlayerVotes} {t('votes')})</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
           {/* Player Analysis */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary" />
                {t('playerAnalysis')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('playerAnalysisDescription')}</p>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger className="w-full bg-card/80 border-border text-foreground">
                  <SelectValue placeholder={t('selectPlayer')} />
                  </SelectTrigger>
                  <SelectContent>
                  {players.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      </SelectItem>
                  ))}
                  </SelectContent>
              </Select>
              <Button
                  onClick={handleGenerateReport}
                  disabled={!selectedPlayer || generatingReport}
                  className="w-full"
              >
                  {generatingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  {generatingReport ? t('generating') : t('generateReport')}
              </Button>

              {generatingReport && <Skeleton className="h-48 w-full" />}
              {playerReport && !generatingReport && (
                <div 
                    className="prose prose-sm prose-invert max-w-none text-white whitespace-pre-wrap rounded-md bg-muted/50 p-3 mt-4"
                    dangerouslySetInnerHTML={{ __html: marked(playerReport) }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
