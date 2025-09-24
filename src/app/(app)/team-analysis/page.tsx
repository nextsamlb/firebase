
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Swords, Zap, Loader2, BarChart3 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateTeamAnalysis, generateMatchupAnalysis, type TeamStats, type MatchupData } from '@/app/actions'
import { getPlayers, Player } from "@/lib/data"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/context/language-provider"
import {marked} from 'marked';


export default function TeamAnalysisPage() {
  const [teams, setTeams] = useState<TeamStats[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<string>("")
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<string>("")
  const [teamAnalysis, setTeamAnalysis] = useState<string>("")
  const [matchupAnalysis, setMatchupAnalysis] = useState<string>("")
  const [generatingTeamAnalysis, setGeneratingTeamAnalysis] = useState(false)
  const [generatingMatchupAnalysis, setGeneratingMatchupAnalysis] = useState(false)
  const [loading, setLoading] = useState(true)
  const { t, language } = useTranslation();

  useEffect(() => {
    async function loadTeamData() {
        const players = await getPlayers();
        
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
        }));

        setTeams(teamStats);
        setLoading(false);
    }
    loadTeamData();
  }, [])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center glass p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">{t('loadingTeamAnalysis')}</p>
        </div>
      </div>
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
       {/* Header */}
        <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2 font-accent flex items-center justify-center gap-3">
            <BarChart3 className="w-8 h-8 md:w-12 md:h-12 text-primary" />
            {t('teamAnalysisCenter')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">{t('teamAnalysisSubtitle')}</p>
        </div>

      {/* Main Content */}
      <Card className="glass">
          <CardContent className="p-6">
             <Tabs defaultValue="team-analysis" className="w-full">
                <TabsList className="grid w-full grid-cols-2 glass mb-6">
                    <TabsTrigger value="team-analysis">
                        <TrendingUp className="w-4 h-4 me-2" />
                        {t('teamAnalysis')}
                    </TabsTrigger>
                    <TabsTrigger value="matchup-analysis">
                         <Swords className="w-4 h-4 me-2" />
                        {t('matchupAnalysis')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="team-analysis" className="space-y-6">
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>{t('selectTeam')}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col md:flex-row items-center gap-4">
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
                        </CardContent>
                    </Card>
                    
                    {generatingTeamAnalysis && <Skeleton className="w-full h-48" />}

                    {teamAnalysis && !generatingTeamAnalysis && renderAnalysis(t('teamAnalysisReport'), teamAnalysis, BarChart3)}

                    {!teamAnalysis && !generatingTeamAnalysis && (
                    <div className="text-center py-12 text-muted-foreground">
                        <TrendingUp className="w-16 h-16 mx-auto mb-4" />
                        <p>{t('selectTeamForAnalysis')}</p>
                    </div>
                    )}
                </TabsContent>

                <TabsContent value="matchup-analysis" className="space-y-6">
                     <Card className="glass">
                        <CardHeader>
                            <CardTitle>{t('selectTwoTeamsForAnalysis')}</CardTitle>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                     </Card>
                     
                    {generatingMatchupAnalysis && <Skeleton className="w-full h-48" />}

                    {matchupAnalysis && !generatingMatchupAnalysis && renderAnalysis(t('matchupAnalysisReport'), matchupAnalysis, Swords)}

                    {!matchupAnalysis && !generatingMatchupAnalysis && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Swords className="w-16 h-16 mx-auto mb-4" />
                        <p>{t('selectTwoTeamsForAnalysis')}</p>
                    </div>
                    )}
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
