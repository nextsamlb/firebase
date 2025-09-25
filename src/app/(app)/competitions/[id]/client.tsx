
'use client'

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Trophy, Users, Target, Clock, CheckCircle, Award, TrendingUp } from "lucide-react"
import { getMatches, getPlayers, Player, Match, Competition, getCompetition } from "@/lib/data"
import { notFound } from "next/navigation"

type Standing = Player & { isTeam?: boolean; teamPlayerIds?: string[] };

export default function CompetitionStageClient({ competitionId }: { competitionId: string }) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Player[]>([]);
  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        try {
            const [allUsers, allMatches, competitionData] = await Promise.all([getPlayers(), getMatches(), getCompetition(competitionId)]);
            
            if (!competitionData) {
                setLoading(false);
                return;
            }

            const competitionMatches = allMatches.filter(m => m.competitionId === competitionId);
            const playerList = allUsers.filter(p => p.role === 'player');
            
            // Calculate standings based on matches in THIS competition
            const competitionPlayerStats: Record<string, PlayerStats> = {};

            playerList.forEach(p => {
              competitionPlayerStats[p.id] = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, assists: 0 };
            });

            competitionMatches.forEach(match => {
              if (!match.result) return;
              const scores = match.result.split('-').map(Number);
              const playerIds = [match.player1Id, ...(match.player2Ids || (match.player2Id ? [match.player2Id] : []))];

              playerIds.forEach(id => {
                if (competitionPlayerStats[id]) {
                  competitionPlayerStats[id].played += 1;
                }
              });

              const player1Stats = competitionPlayerStats[match.player1Id];
              const p1Score = scores[0];
              const p2Score = scores[1];
              
              player1Stats.goalsFor += p1Score;
              player1Stats.goalsAgainst += p2Score;
              player1Stats.goalDifference += (p1Score - p2Score);

              if (p1Score > p2Score) {
                player1Stats.wins += 1;
                player1Stats.points += 3;
              } else if (p1Score < p2Score) {
                player1Stats.losses += 1;
              } else {
                player1Stats.draws += 1;
                player1Stats.points += 1;
              }
              
              const opponentIds = match.player2Ids || (match.player2Id ? [match.player2Id] : []);
              opponentIds.forEach(oppId => {
                  const opponentStats = competitionPlayerStats[oppId];
                  if (opponentStats) {
                      opponentStats.goalsFor += p2Score;
                      opponentStats.goalsAgainst += p1Score;
                      opponentStats.goalDifference += (p2Score - p1Score);

                      if (p2Score > p1Score) {
                          opponentStats.wins += 1;
                          opponentStats.points += 3;
                      } else if (p2Score < p1Score) {
                          opponentStats.losses += 1;
                      } else {
                          opponentStats.draws += 1;
                          opponentStats.points += 1;
                      }
                  }
              });
            });

            const standingsData = playerList.map(p => ({
              ...p,
              stats: competitionPlayerStats[p.id] || p.stats,
            })).sort((a, b) => {
                if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                if (b.stats.goalDifference !== a.stats.goalDifference) return b.stats.goalDifference - a.stats.goalDifference;
                return b.stats.goalsFor - a.stats.goalsFor;
            });
            
            setPlayers(playerList);
            setCompetition(competitionData);
            setStandings(standingsData);
            setMatches(competitionMatches.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
        } catch (error) {
            console.error("Failed to fetch competition data", error);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [competitionId])
  
  const getPlayerById = (id: string) => players.find(p => p.id === id);

  const getStatusColor = (result: string | null) => {
    if (result) return "bg-green-500"
    return "bg-blue-500"
  }
  
  const getStatusText = (result: string | null) => {
     if (result) return "completed"
     return "scheduled"
  }

  const getStatusIcon = (result: string | null) => {
    if (result) return <CheckCircle className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }
  
  const getInitials = (name?: string) => {
    if (!name) return '?'
    const names = name.split(' ')
    const initials = names.map((n) => n[0]).join('')
    return initials.toUpperCase()
  }


  if (loading) {
    return (
        <div className="flex items-center justify-center p-4">
          <div className="text-center glass p-8 rounded-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-white text-xl font-semibold">Loading Competition...</p>
          </div>
        </div>
    )
  }
  
  if (!competition) {
      return notFound();
  }
  
  const topPlayers = useMemo(() => {
    return [...standings].sort((a, b) => b.stats.goalsFor - a.stats.goalsFor);
  }, [standings]);
  const leader = useMemo(() => standings.filter(s => !s.isTeam)[0], [standings]);

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="glass p-6 md:p-8 rounded-3xl max-w-4xl mx-auto border border-primary/20">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">
                {competition.name}
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">The official league competition</p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium">{players.length} Players</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-medium">{matches.length} Matches</span>
              </div>
               <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-medium">Top Player Wins</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="standings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 glass">
            <TabsTrigger value="matches">
              Matches
            </TabsTrigger>
            <TabsTrigger value="standings">
              Standings
            </TabsTrigger>
            <TabsTrigger value="stats">
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="space-y-4">
            <div className="grid gap-4">
              {matches.map((match) => {
                const homePlayer = getPlayerById(match.player1Id);
                const opponentIds = match.player2Ids || (match.player2Id ? [match.player2Id] : []);
                const awayPlayers = opponentIds.map(getPlayerById).filter(Boolean) as Player[];
                
                return (
                <Card key={match.id} className="glass">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge className={`${getStatusColor(match.result)}`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(match.result)}
                            <span className="capitalize">{getStatusText(match.result)}</span>
                          </div>
                        </Badge>
                        <span className="text-sm text-muted-foreground">{new Date(match.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Home Team */}
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-12 h-12 border-2 border-primary">
                          <AvatarImage src={homePlayer?.avatar || "/placeholder.svg"} alt={homePlayer?.name} />
                          <AvatarFallback className="bg-primary/20">{getInitials(homePlayer?.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{homePlayer?.name}</p>
                          <p className="text-sm text-muted-foreground">Home</p>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex items-center gap-4 px-6">
                        {match.result ? (
                          <div className="text-center">
                            <div className="text-3xl font-bold">
                              {match.result}
                            </div>
                            <p className="text-sm text-muted-foreground">Final</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-muted-foreground">VS</div>
                            <p className="text-sm text-muted-foreground">Scheduled</p>
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center gap-3 flex-1 justify-end text-right">
                        <div>
                          <p className="font-semibold">{awayPlayers.map(p => p?.name).join(' & ')}</p>
                          <p className="text-sm text-muted-foreground">Away</p>
                        </div>
                        <div className="flex -space-x-4 rtl:space-x-reverse">
                          {awayPlayers.map(p => (
                            <Avatar key={p?.id} className="w-12 h-12 border-2 border-primary">
                              <AvatarImage src={p?.avatar || "/placeholder.svg"} alt={p?.name} />
                              <AvatarFallback className="bg-primary/20">{getInitials(p?.name)}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          </TabsContent>

          <TabsContent value="standings" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  League Standings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Pos</th>
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Player</th>
                        <th className="text-center py-3 px-2 text-muted-foreground font-medium">P</th>
                        <th className="text-center py-3 px-2 text-muted-foreground font-medium">W</th>
                        <th className="text-center py-3 px-2 text-muted-foreground font-medium">D</th>
                        <th className="text-center py-3 px-2 text-muted-foreground font-medium">L</th>
                        <th className="text-center py-3 px-2 text-muted-foreground font-medium">GF</th>
                        <th className="text-center py-3 px-2 text-muted-foreground font-medium">GA</th>
                        <th className="text-center py-3 px-2 text-muted-foreground font-medium">GD</th>
                        <th className="text-center py-3 px-2 text-muted-foreground font-medium">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((player, index) => (
                        <tr
                          key={player.id}
                          className={`border-b border-border/20 hover:bg-muted/10 transition-colors ${
                            index < 1 ? "bg-primary/10" : ""
                          }`}
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{index + 1}</span>
                              {index < 1 && <Trophy className="w-4 h-4 text-primary" />}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={player.avatar} />
                                <AvatarFallback className="bg-primary/20 text-xs">
                                  {getInitials(player.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{player.name}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-2">{player.stats.played}</td>
                          <td className="text-center py-3 px-2 text-green-400">{player.stats.wins}</td>
                          <td className="text-center py-3 px-2 text-yellow-400">{player.stats.draws}</td>
                          <td className="text-center py-3 px-2 text-red-400">{player.stats.losses}</td>
                          <td className="text-center py-3 px-2">{player.stats.goalsFor}</td>
                          <td className="text-center py-3 px-2">{player.stats.goalsAgainst}</td>
                          <td className="text-center py-3 px-2">
                            <span className={player.stats.goalDifference > 0 ? "text-green-400" : player.stats.goalDifference < 0 ? "text-red-400" : ""}>
                              {player.stats.goalDifference > 0 ? "+" : ""}
                              {player.stats.goalDifference}
                            </span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <Badge className="bg-primary font-bold">{player.stats.points}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Top Scorer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topPlayers.length > 0 && (
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={topPlayers[0]?.avatar} />
                        <AvatarFallback className="bg-primary/20">{getInitials(topPlayers[0]?.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{topPlayers[0]?.name}</p>
                        <p className="text-2xl font-bold text-primary">{topPlayers[0]?.stats.goalsFor} Goals</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Best Win Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leader && (
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={leader?.avatar} />
                        <AvatarFallback className="bg-primary/20">{getInitials(leader?.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{leader?.name}</p>
                        <p className="text-2xl font-bold text-primary">{leader?.stats.played > 0 ? ((leader?.stats.wins / leader?.stats.played) * 100).toFixed(0) : 0}%</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    League Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Matches Played</span>
                      <span className="font-semibold">{matches.filter(m => m.result).length}/{matches.length}</span>
                    </div>
                    <Progress value={(matches.filter(m => m.result).length / (matches.length || 1)) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">{matches.filter(m => !m.result).length} matches remaining</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  )
}
