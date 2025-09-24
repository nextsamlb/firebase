
'use server'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPlayers, getMatches, type Player, type Match } from '@/lib/data'
import { BarChart3, TrendingUp, Target, Trophy, Users, Calendar, Award, Zap, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface StatData {
  totalPlayers: number
  totalMatches: number
  totalGoals: number
  avgGoalsPerMatch: number
  topScorer: { name: string; goals: number; avatar: string; }
  bestDefense: { name: string; conceded: number; avatar: string; }
  mostWins: { name: string; wins: number; avatar: string; }
  fanFavorite: { name: string; votes: number; avatar: string; }
  mostScrutinized: { name: string; votes: number; avatar: string; }
}

export default async function StatsCentralPage() {
  const [allUsers, matches] = await Promise.all([getPlayers(), getMatches()])
  const players = allUsers.filter(p => p.role === 'player');

  const playedMatches = matches.filter(m => m.result);

  const calculateStats = (): StatData => {
    
    const totalGoals = playedMatches.reduce((acc, match) => {
        if (match.result) {
            const scores = match.result.split('-').map(Number);
            return acc + scores[0] + scores[1];
        }
        return acc;
    }, 0);
    
    const topScorer = players.length > 0 
        ? players.reduce((prev, current) => (prev.stats.goalsFor > current.stats.goalsFor) ? prev : current)
        : null;
    
    const activePlayers = players.filter(p => p.stats.played > 0);
    const bestDefense = activePlayers.length > 0 
        ? activePlayers.reduce((prev, current) => ((prev.stats.goalsAgainst / prev.stats.played) < (current.stats.goalsAgainst / current.stats.played)) ? prev : current)
        : null;
    
    const mostWins = players.length > 0
        ? players.reduce((prev, current) => (prev.stats.wins > current.stats.wins) ? prev : current)
        : null;

    const fanFavorite = players.length > 0
      ? players.reduce((prev, current) => (prev.bestPlayerVotes > current.bestPlayerVotes) ? prev : current)
      : null;
      
    const mostScrutinized = players.length > 0
      ? players.reduce((prev, current) => (prev.worstPlayerVotes > current.worstPlayerVotes) ? prev : current)
      : null;

    return {
        totalPlayers: players.length,
        totalMatches: playedMatches.length,
        totalGoals: totalGoals,
        avgGoalsPerMatch: playedMatches.length > 0 ? parseFloat((totalGoals / playedMatches.length).toFixed(1)) : 0,
        topScorer: topScorer ? { name: topScorer.name, goals: topScorer.stats.goalsFor, avatar: topScorer.avatar } : { name: 'N/A', goals: 0, avatar: ''},
        bestDefense: bestDefense ? { name: bestDefense.name, conceded: bestDefense.stats.goalsAgainst, avatar: bestDefense.avatar } : { name: 'N/A', conceded: 0, avatar: ''},
        mostWins: mostWins ? { name: mostWins.name, wins: mostWins.stats.wins, avatar: mostWins.avatar } : { name: 'N/A', wins: 0, avatar: ''},
        fanFavorite: fanFavorite ? { name: fanFavorite.name, votes: fanFavorite.bestPlayerVotes, avatar: fanFavorite.avatar } : { name: 'N/A', votes: 0, avatar: ''},
        mostScrutinized: mostScrutinized ? { name: mostScrutinized.name, votes: mostScrutinized.worstPlayerVotes, avatar: mostScrutinized.avatar } : { name: 'N/A', votes: 0, avatar: ''},
    }
  }

  const stats = calculateStats();

  const getInitials = (name: string) => {
    if (!name) return '?'
    const names = name.split(' ')
    const initials = names.map((n) => n[0]).join('')
    return initials.toUpperCase()
  }

  const StatLeaderCard = ({ icon, title, player, value, unit, color } : { icon: React.ElementType, title: string, player: { name: string, avatar: string }, value: string | number, unit: string, color: string}) => {
    const Icon = icon;
    return (
       <Card className="glass flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${color}`}>{title}</CardTitle>
                <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center flex-grow">
                <Avatar className="w-20 h-20 mb-4 border-2 border-primary">
                    <AvatarImage src={player.avatar} />
                    <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                </Avatar>
                <p className="font-bold text-xl text-foreground">{player.name}</p>
                <p className={`text-3xl font-bold ${color} mt-2`}>{value} <span className="text-lg">{unit}</span></p>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center justify-center md:justify-start gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          Stats Central
        </h1>
        <p className="text-muted-foreground text-center md:text-left">Comprehensive league statistics and analytics</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Total Players</p>
                <p className="text-3xl font-bold">{stats.totalPlayers}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Matches Played</p>
                <p className="text-3xl font-bold">{stats.totalMatches}</p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Total Goals</p>
                <p className="text-3xl font-bold">{stats.totalGoals}</p>
              </div>
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Avg Goals/Match</p>
                <p className="text-3xl font-bold">{stats.avgGoalsPerMatch}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatLeaderCard icon={Trophy} title="Top Scorer" player={stats.topScorer} value={stats.topScorer.goals} unit="Goals" color="text-yellow-400" />
        <StatLeaderCard icon={Shield} title="Best Defense" player={stats.bestDefense} value={stats.bestDefense.conceded} unit="Conceded" color="text-blue-400" />
        <StatLeaderCard icon={Zap} title="Most Wins" player={stats.mostWins} value={stats.mostWins.wins} unit="Wins" color="text-primary" />
        <StatLeaderCard icon={Award} title="Fan Favorite" player={stats.fanFavorite} value={stats.fanFavorite.votes} unit="Votes" color="text-teal-400" />
        <StatLeaderCard icon={Users} title="Most Scrutinized" player={stats.mostScrutinized} value={stats.mostScrutinized.votes} unit="Votes" color="text-red-400" />
      </div>
    </div>
  )
}
