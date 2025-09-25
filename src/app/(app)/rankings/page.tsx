

'use server'

import { RankingsTable } from '@/components/rankings/rankings-table'
import { getPlayers, type Player } from '@/lib/data'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BarChart3 } from 'lucide-react';

export default async function RankingsPage() {
  const allUsers = await getPlayers();
  const players = allUsers.filter(p => p.role === 'player');
  
  const sortedPlayers = [...players]
    // All users with stats are considered players for rankings.
    .sort((a, b) => {
      if (b.stats.points !== a.stats.points) {
        return b.stats.points - a.stats.points
      }
      if (b.stats.goalDifference !== a.stats.goalDifference) {
        return b.stats.goalDifference - a.stats.goalDifference
      }
      if (b.stats.goalsFor !== a.stats.goalsFor) {
        return b.stats.goalsFor - a.stats.goalsFor
      }
      return a.name.localeCompare(b.name)
    })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
          <BarChart3 className="w-8 h-8 text-accent-gold" />
          League Standings
        </h1>
        <p className="text-muted-foreground mt-2">
          Official player rankings based on points, goal difference, and goals scored.
        </p>
      </div>
      <Card className="bg-bg-surface border-border-primary shadow-lg">
        <CardHeader>
          <CardTitle className="text-accent-blue">Current Rankings</CardTitle>
          <CardDescription className="text-text-secondary">
            Click on a player row to view detailed statistics and recent performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RankingsTable players={sortedPlayers} />
        </CardContent>
      </Card>
    </div>
  )
}
