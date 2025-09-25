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
  BrainCircuit,
  Quote,
  Loader2,
  RefreshCw,
  BarChart3,
  Swords,
  TrendingUp,
  LineChart,
  Shield,
  Activity,
  Goal,
} from 'lucide-react'
import Link from 'next/link'
import { getMatches, type Player, type Match, MediaItem } from '@/lib/data'
import Image from 'next/image'
import { generateActivitySummary, generatePlayerReport, generateTeamAnalysis, generateMatchupAnalysis, type TeamStats, type MatchupData, generateMostImprovedReport } from '@/app/actions'
import { useTranslation } from '@/context/language-provider'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {marked} from 'marked';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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
    topScorer: Player | null;
    bestDefense: Player | null;
    mostWins: Player | null;
    fanFavorite: Player | null;
    mostImprovedReport: string;
    media: MediaItem[];
    language: 'en' | 'ar';
    leagueStats: {
        totalMatches: number;
        totalGoals: number;
        avgGoalsPerMatch: string;
    }
}

export function DashboardClient({
    players,
    initialActivitySummary,
    topScorer,
    bestDefense,
    mostWins,
    fanFavorite,
    media: initialMedia,
    leagueStats,
}: DashboardClientProps) {
  const [activitySummary, setActivitySummary] = useState(initialActivitySummary);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [teams, setTeams] = useState<TeamStats[]>([])
  
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<string>("")
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<string>("")
  const [teamAnalysis, setTeamAnalysis] = useState<string>("")
  const [matchupAnalysis, setMatchupAnalysis] = useState<string>("")
  const [generatingTeamAnalysis, setGeneratingTeamAnalysis] = useState(false)
  const [generatingMatchupAnalysis, setGeneratingMatchupAnalysis] = useState(false)
  const [playerReport, setPlayerReport] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [mostImprovedReport, setMostImprovedReport] = useState('');
  const [generatingMostImproved, setGeneratingMostImproved] = useState(false);

  const { t, language } = useTranslation()

  useEffect(() => {
    const teamStats: TeamStats[] = players.filter(p => p.role === 'player').map((player:Player) => ({
        teamId: player.id,
        teamName: player.name,
        players: [player],
        totalMatches: player.stats.played,
        wins: player.stats.wins,
        draws: player.stats.draws,
        losses: player.stats.losses,
        goalsFor: player.stats.goalsFor,
        goalsAgainst: player.stats.goalsAgainst,
        averageGoalsPerMatch: player.stats.played > 0 ? parseFloat((player.stats.goalsFor / player.stats.played).toFixed(1)) : 0,
        winPercentage: player.stats.played > 0 ? parseFloat(((player.stats.wins / player.stats.played) * 100).toFixed(1)) : 0,
        form: ["W", "L", "W", "D", "W"], // Mock recent form
        language,
    }));
    setTeams(teamStats);
  }, [players, language])

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

  const handleGenerateTeamAnalysis = async () => {
    const team = teams.find((t) => t.teamId === selectedTeam)
    if (!team) return

    setGeneratingTeamAnalysis(true)
    setTeamAnalysis('');
    try {
      const result = await generateTeamAnalysis({...team, language})
      if ('analysis' in result) {
        setTeamAnalysis(result.analysis)
      } else {
         console.error("Failed to generate team analysis:", result.error)
      }
    } catch (error) {
      console.error("Failed to generate team analysis:", error)
    } finally {
      setGeneratingTeamAnalysis(false)
    }
  }
  
  const handleGenerateMostImprovedReport = async () => {
    if (players.length < 2) return;
    setGeneratingMostImproved(true);
    setMostImprovedReport('');
    try {
        const playerStatsForReport = players.map(p => ({
            id: p.id,
            name: p.name,
            previousWinRate: Math.random() * 0.5, // Mock previous data
            currentWinRate: p.stats.played > 0 ? p.stats.wins / p.stats.played : 0,
            previousGoals: Math.floor(Math.random() * p.stats.goalsFor),
            currentGoals: p.stats.goalsFor,
        }));
        const result = await generateMostImprovedReport({ players: playerStatsForReport });
        if ('report' in result) {
            setMostImprovedReport(result.report);
        } else {
            setMostImprovedReport('Failed to generate report.');
        }
    } catch (error) {
      setMostImprovedReport('An error occurred while generating the report.');
    } finally {
        setGeneratingMostImproved(false);
    }
  }


  const handleGenerateMatchupAnalysis = async () => {
    const homeTeam = teams.find((t) => t.teamId === selectedHomeTeam)
    const awayTeam = teams.find((t) => t.teamId === selectedAwayTeam)
    if (!homeTeam || !awayTeam) return

    setGeneratingMatchupAnalysis(true)
    setMatchupAnalysis('');
    try {
      const matchupData: MatchupData = {
        homeTeam,
        awayTeam,
        headToHead: {
          totalMeetings: 5,
          homeWins: 2,
          awayWins: 2,
          draws: 1,
          lastMeeting: {
            date: "2024-12-15",
            score: "2-1",
            venue: "PIFA Stadium",
          },
        },
        venue: "PIFA Stadium",
        competition: "PIFA League",
        language: language
      }

      const result = await generateMatchupAnalysis(matchupData)
       if ('analysis' in result) {
        setMatchupAnalysis(result.analysis)
      } else {
         console.error("Failed to generate matchup analysis:", result.error)
      }
    } catch (error) {
      console.error("Failed to generate matchup analysis:", error)
    } finally {
      setGeneratingMatchupAnalysis(false)
    }
  }

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

  const StatLeaderCard = ({ icon, title, player, value, unit, color } : { icon: React.ElementType, title: string, player: Player | null, value: string | number, unit: string, color: string}) => {
    const Icon = icon;
    if (!player) return null;
    return (
       <Card className="glass flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${color}`}>{title}</CardTitle>
                <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center flex-grow">
                <Avatar className="w-16 h-16 mb-2 border-2 border-primary">
                    <AvatarImage src={player.avatar} />
                    <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                </Avatar>
                <p className="font-bold text-lg text-foreground">{player.name}</p>
                <p className={`text-2xl font-bold ${color} mt-1`}>{value} <span className="text-base font-medium">{unit}</span></p>
            </CardContent>
        </Card>
    )
  }

  const renderAnalysis = (title: string, analysis: string, icon: React.ElementType) => {
    const Icon = icon;
    const htmlAnalysis = marked(analysis);
    return (
        <Card className="glass mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div 
                    className="prose prose-sm prose-invert max-w-none text-foreground whitespace-pre-wrap" 
                    dangerouslySetInnerHTML={{ __html: htmlAnalysis }}
                />
            </CardContent>
        </Card>
    );
  };


  return (
    <div className="space-y-8">
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
      
        {/* League Stats & Stat Leaders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <BarChart3 className="w-5 h-5"/>
                        League at a Glance
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-muted-foreground" />
                            <span className="text-foreground">Total Matches Played</span>
                        </div>
                        <span className="font-bold text-lg text-primary">{leagueStats.totalMatches}</span>
                    </div>
                     <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Goal className="w-5 h-5 text-muted-foreground" />
                            <span className="text-foreground">Total Goals Scored</span>
                        </div>
                        <span className="font-bold text-lg text-primary">{leagueStats.totalGoals}</span>
                    </div>
                     <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-muted-foreground" />
                            <span className="text-foreground">Avg Goals/Match</span>
                        </div>
                        <span className="font-bold text-lg text-primary">{leagueStats.avgGoalsPerMatch}</span>
                    </div>
                </CardContent>
            </Card>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <StatLeaderCard icon={Trophy} title="Top Scorer" player={topScorer} value={topScorer?.stats.goalsFor || 0} unit="Goals" color="text-yellow-400" />
                <StatLeaderCard icon={Zap} title="Most Wins" player={mostWins} value={mostWins?.stats.wins || 0} unit="Wins" color="text-primary" />
                <StatLeaderCard icon={Shield} title="Best Defense" player={bestDefense} value={bestDefense ? (bestDefense.stats.goalsAgainst / (bestDefense.stats.played || 1)).toFixed(2) : 0} unit="GA/Match" color="text-green-400" />
                <StatLeaderCard icon={Award} title="Fan Favorite" player={fanFavorite} value={fanFavorite?.bestPlayerVotes || 0} unit="Votes" color="text-teal-400" />
                <div className="sm:col-span-2 md:col-span-1">
                    <Card className="glass flex flex-col h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-purple-400">Most Improved</CardTitle>
                            <LineChart className="h-4 w-4 text-purple-400" />
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center text-center flex-grow">
                            {generatingMostImproved ? <Skeleton className="h-32 w-full" /> : mostImprovedReport ? (
                                <div
                                    className="prose prose-sm prose-invert max-w-none text-muted-foreground text-left"
                                    dangerouslySetInnerHTML={{ __html: marked(mostImprovedReport) }}
                                />
                            ) : (
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-3">Generate a report to see who is on the rise.</p>
                                    <Button size="sm" variant="outline" onClick={handleGenerateMostImprovedReport} disabled={generatingMostImproved}>
                                        {generatingMostImproved ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                                        Generate
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

       {/* AI Analysis Center */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
                 <BrainCircuit className="w-6 h-6 text-primary" />
                AI Analysis Center
            </CardTitle>
            <CardDescription>
                Get AI-powered analysis for players, teams, and matchups.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Tabs defaultValue="player-analysis" className="w-full">
                <TabsList className="grid w-full grid-cols-3 glass mb-6">
                    <TabsTrigger value="player-analysis">
                        <TrendingUp className="w-4 h-4 me-2" />
                        {t('playerAnalysis')}
                    </TabsTrigger>
                    <TabsTrigger value="team-analysis">
                        <BarChart3 className="w-4 h-4 me-2" />
                        {t('teamAnalysis')}
                    </TabsTrigger>
                    <TabsTrigger value="matchup-analysis">
                         <Swords className="w-4 h-4 me-2" />
                        {t('matchupAnalysis')}
                    </TabsTrigger>
                </TabsList>

                {/* Player Analysis Tab */}
                <TabsContent value="player-analysis" className="space-y-4">
                    <p className="text-sm text-muted-foreground">{t('playerAnalysisDescription')}</p>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                            <SelectTrigger className="w-full md:w-64 bg-card/80 border-border text-foreground">
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
                            className="w-full md:w-auto"
                        >
                            {generatingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                            {generatingReport ? t('generating') : t('generateReport')}
                        </Button>
                    </div>

                    {generatingReport && <Skeleton className="h-48 w-full" />}
                    {playerReport && !generatingReport && (
                        renderAnalysis("Player Report", playerReport, BrainCircuit)
                    )}
                </TabsContent>

                {/* Team Analysis Tab */}
                <TabsContent value="team-analysis" className="space-y-6">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                            <SelectTrigger className="w-full md:w-64 bg-card/80 border-border text-foreground">
                            <SelectValue placeholder={t('selectTeam')} />
                            </SelectTrigger>
                            <SelectContent>
                            {teams.map((team) => (
                                <SelectItem key={team.teamId} value={team.teamId}>
                                {team.teamName}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleGenerateTeamAnalysis}
                            disabled={!selectedTeam || generatingTeamAnalysis}
                            className="w-full md:w-auto"
                        >
                            {generatingTeamAnalysis ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                            {generatingTeamAnalysis ? t('generating') : t('generateAnalysis')}
                        </Button>
                    </div>
                    
                    {generatingTeamAnalysis && <Skeleton className="w-full h-48" />}

                    {teamAnalysis && !generatingTeamAnalysis && renderAnalysis(t('teamAnalysisReport'), teamAnalysis, BarChart3)}

                </TabsContent>

                {/* Matchup Analysis Tab */}
                <TabsContent value="matchup-analysis" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div className="space-y-2">
                            <label className="text-muted-foreground text-sm">{t('homeTeam')}</label>
                            <Select value={selectedHomeTeam} onValueChange={setSelectedHomeTeam}>
                                <SelectTrigger className="bg-card/80 border-border text-foreground">
                                    <SelectValue placeholder={t('selectHomeTeam')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {teams.map((team) => (
                                    <SelectItem key={team.teamId} value={team.teamId} disabled={team.teamId === selectedAwayTeam}>
                                        {team.teamName}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="text-center font-bold text-muted-foreground hidden md:block">VS</div>
                        
                        <div className="space-y-2">
                            <label className="text-muted-foreground text-sm">{t('awayTeam')}</label>
                            <Select value={selectedAwayTeam} onValueChange={setSelectedAwayTeam}>
                            <SelectTrigger className="bg-card/80 border-border text-foreground">
                                <SelectValue placeholder={t('selectAwayTeam')} />
                            </SelectTrigger>
                            <SelectContent>
                                {teams.map((team) => (
                                <SelectItem key={team.teamId} value={team.teamId} disabled={team.teamId === selectedHomeTeam}>
                                    {team.teamName}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>
                    </div>
                        <div className="text-center mt-6">
                        <Button
                            onClick={handleGenerateMatchupAnalysis}
                            disabled={
                            !selectedHomeTeam ||
                            !selectedAwayTeam ||
                            selectedHomeTeam === selectedAwayTeam ||
                            generatingMatchupAnalysis
                            }
                        >
                            {generatingMatchupAnalysis ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                            {generatingMatchupAnalysis ? t('generating') : t('generateMatchupAnalysis')}
                        </Button>
                    </div>
                    
                    {generatingMatchupAnalysis && <Skeleton className="w-full h-48" />}

                    {matchupAnalysis && !generatingMatchupAnalysis && renderAnalysis(t('matchupAnalysisReport'), matchupAnalysis, Swords)}
                </TabsContent>
            </Tabs>
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
            {media.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {media.map(item => (
                <Link href="/media-hub" key={item.id}>
                <Image src={item.src} alt={item.title} width={400} height={300} className="rounded-lg object-cover w-full h-auto shadow-md aspect-video hover:opacity-80 transition-opacity" data-ai-hint={item.hint}/>
                </Link>
            ))}
            </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4" />
                    <p>No recent match highlights.</p>
                    <p className="text-sm">Complete a match to see AI-generated highlights here.</p>
                </div>
            )}
        </CardContent>
        </Card>

       <PlayerFact players={players} />
    </div>
  )
}
