
'use client'

import { useState } from 'react'
import { generateMatchupAnalysis, type MatchupData, type TeamStats } from '@/app/actions'
import { Skeleton } from '@/components/ui/skeleton'
import { updateMatch, type Match, type Player } from '@/lib/data'
import { AlertCircle, Sparkles, Loader2 } from 'lucide-react'
import { useTranslation } from '@/context/language-provider'
import { Button } from '../ui/button'

interface PreMatchAnalysisProps {
  match: Match
  homePlayer: Player
  awayPlayers: Player[]
}

export function PreMatchAnalysis({ match, homePlayer, awayPlayers }: PreMatchAnalysisProps) {
  const [analysis, setAnalysis] = useState(match.preMatchAnalysis || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { language } = useTranslation();

  const fetchAnalysis = async () => {
    setLoading(true)
    setError('')
    setAnalysis('')

    const playerToTeamStats = (player: Player): TeamStats => ({
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
    });

    const homeTeam = playerToTeamStats(homePlayer);
    
    const awayTeam: TeamStats = {
        teamId: awayPlayers.map(p => p.id).join(','),
        teamName: awayPlayers.map(p => p.name).join(' & '),
        players: awayPlayers,
        totalMatches: awayPlayers.reduce((sum, p) => sum + p.stats.played, 0) / awayPlayers.length,
        wins: awayPlayers.reduce((sum, p) => sum + p.stats.wins, 0),
        draws: awayPlayers.reduce((sum, p) => sum + p.stats.draws, 0),
        losses: awayPlayers.reduce((sum, p) => sum + p.stats.losses, 0),
        goalsFor: awayPlayers.reduce((sum, p) => sum + p.stats.goalsFor, 0),
        goalsAgainst: awayPlayers.reduce((sum, p) => sum + p.stats.goalsAgainst, 0),
        averageGoalsPerMatch: 0,
        winPercentage: 0,
        form: ["W", "W", "L", "D", "L"],
    };

    const matchupData: MatchupData = {
        homeTeam,
        awayTeam,
        venue: 'PIFA Stadium',
        competition: 'PIFA League',
        language: language,
    };

    const result = await generateMatchupAnalysis(matchupData)

    if ('error' in result) {
      setError(result.error)
      setAnalysis('Could not load pre-match analysis.')
    } else {
      setAnalysis(result.analysis)
       try {
          await updateMatch({ ...match, preMatchAnalysis: result.analysis })
        } catch (dbError) {
          console.error("Failed to save analysis to DB", dbError)
        }
    }
    setLoading(false)
  }

  return (
    <div className='pt-4 mt-4 border-t'>
        <h4 className="text-sm font-semibold mb-3 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Pre-Match Analysis
        </h4>
        <div className="flex items-start gap-3 text-sm">
            <div className='flex-grow'>
                {loading && (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                )}
                {!loading && error && (
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <p>{analysis}</p>
                    </div>
                )}
                {!loading && !error && analysis && (
                    <div 
                        className="prose prose-sm prose-invert max-w-none text-muted-foreground" 
                        dangerouslySetInnerHTML={{ __html: analysis.replace(/### (.*)/g, '<strong>$1</strong>').replace(/[\r\n]+/g, '<br/>') }}
                    />
                )}
                {!loading && !analysis && !error && (
                    <div className="text-center">
                        <Button onClick={fetchAnalysis} disabled={loading} size="sm" variant="outline">
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                            ) : (
                                <><Sparkles className="mr-2 h-4 w-4" /> Generate Analysis</>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    </div>
  )
}
