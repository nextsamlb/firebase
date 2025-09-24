
'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Plus, DollarSign, Trophy, Target, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Player, addPlayer as addPlayerData } from "@/lib/data"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"


export function PlayersPageClient({ initialPlayers }: { initialPlayers: Player[]}) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [loading, setLoading] = useState(false)
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false)
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    nickname: "",
    avatar: "",
    balance: 50000000,
  })
  const { user } = useAuth()
  const { toast } = useToast()

  const handleAddPlayer = async () => {
    try {
      const playerToAdd: Omit<Player, 'id'> = {
          name: newPlayer.name,
          nickname: newPlayer.nickname,
          email: `${newPlayer.name.toLowerCase().replace(' ', '')}@pifa.com`,
          password: 'password123',
          role: 'player',
          avatar: newPlayer.avatar || `https://picsum.photos/seed/${newPlayer.name}/100/100`,
          balance: newPlayer.balance,
          stats: { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, assists: 0 },
          bestPlayerVotes: 0,
          worstPlayerVotes: 0,
          registrationDate: new Date().toISOString(),
      };
      
      const createdPlayer = await addPlayerData(playerToAdd);
      setPlayers([...players, createdPlayer]);

      setNewPlayer({
        name: "",
        nickname: "",
        avatar: "",
        balance: 50000000,
      })
      setIsAddPlayerOpen(false)
      toast({ title: "Player Added", description: `${createdPlayer.name} has been added to the league.`})
    } catch(e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to add player."})
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Players...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Player Profiles
          </h1>
          <p className="text-muted-foreground">Complete player statistics and information</p>
        </div>

        {user?.role === 'admin' && (
          <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Player</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    placeholder="Player name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nickname</label>
                  <Input
                    value={newPlayer.nickname}
                    onChange={(e) => setNewPlayer({ ...newPlayer, nickname: e.target.value })}
                    placeholder="Player nickname"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <Input
                    value={newPlayer.avatar}
                    onChange={(e) => setNewPlayer({ ...newPlayer, avatar: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Balance</label>
                    <Input
                      type="number"
                      value={newPlayer.balance}
                      onChange={(e) => setNewPlayer({ ...newPlayer, balance: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddPlayer} className="w-full">
                  Add Player
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((player) => (
            <Card key={player.id} className="overflow-hidden glass flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Image
                    src={player.avatar || `https://picsum.photos/seed/${player.id}/100/100`}
                    alt={player.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                    data-ai-hint="person face"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-lg text-foreground">
                        <Link href={`/profile/${player.id}`} className="hover:underline">{player.name}</Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">"{player.nickname}"</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-grow flex flex-col">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-2 bg-primary/10 rounded">
                    <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="font-semibold text-primary">{player.stats.points}</p>
                    <p className="text-muted-foreground">Points</p>
                  </div>
                  <div className="text-center p-2 bg-green-500/10 rounded">
                    <Target className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <p className="font-semibold text-green-500">{player.stats.goalsFor}</p>
                    <p className="text-muted-foreground">Goals</p>
                  </div>
                  <div className="text-center p-2 bg-yellow-500/10 rounded">
                    <TrendingUp className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                    <p className="font-semibold text-yellow-500">{player.stats.wins}</p>
                    <p className="text-muted-foreground">Wins</p>
                  </div>
                  <div className="text-center p-2 bg-purple-500/10 rounded">
                    <DollarSign className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                    <p className="font-semibold text-purple-500">${player.balance.toLocaleString()}</p>
                    <p className="text-muted-foreground">Balance</p>
                  </div>
                </div>

                {/* Detailed Stats */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Matches Played:</span>
                    <span className="font-semibold text-foreground">{player.stats.played}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>W-D-L:</span>
                    <span className="font-semibold text-foreground">
                      {player.stats.wins}-{player.stats.draws}-{player.stats.losses}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Goal Difference:</span>
                    <span
                      className={`font-semibold ${player.stats.goalDifference > 0 ? "text-green-500" : player.stats.goalDifference < 0 ? "text-red-500" : "text-foreground"}`}
                    >
                      {player.stats.goalDifference > 0 ? "+" : ""}
                      {player.stats.goalDifference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best/Worst Votes:</span>
                    <span className="font-semibold text-foreground">
                      <span className="text-green-500">{player.bestPlayerVotes}</span>/
                      <span className="text-red-500">{player.worstPlayerVotes}</span>
                    </span>
                  </div>
                </div>
                
                <div className="mt-auto pt-4">
                  <Link href={`/profile/${player.id}`} className="w-full">
                     <Button size="sm" variant="outline" className="w-full">
                        View Full Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
        ))}
      </div>
    </div>
  )
}

    