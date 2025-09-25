
'use client'

import type { Player, Match } from '@/lib/data'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { MatchCommentary } from './match-commentary'
import { MatchVoting } from './match-voting'
import { PreMatchAnalysis } from './pre-match-analysis'
import { Button } from '../ui/button'
import { Edit } from 'lucide-react'
import Image from 'next/image'

interface MatchListProps {
  matches: Match[]
  players: Player[]
  isAdmin: boolean;
  onEditMatch: (match: Match) => void;
}

export function MatchList({
  matches,
  players,
  isAdmin,
  onEditMatch,
}: MatchListProps) {
  const { user } = useAuth()

  const getPlayerById = (id: string) => players.find(p => p.id === id)

  const getInitials = (name?: string) => {
    if (!name) return '?'
    const names = name.split(' ')
    const initials = names.map((n) => n[0]).join('')
    return initials.toUpperCase()
  }

  const getOpponentDisplay = (match: Match) => {
    const opponentIds = match.player2Ids || (match.player2Id ? [match.player2Id] : []);
    const opponentPlayers = opponentIds.map(id => getPlayerById(id)).filter(p => p) as Player[];

    if (opponentPlayers.length === 0) {
      return <span className="text-muted-foreground">N/A</span>;
    }
    return (
      <div className="flex items-center gap-3 flex-1 justify-end text-right">
        <div>
          <p className="font-semibold truncate">{opponentPlayers.map(p => p?.name).join(' & ')}</p>
          <p className="text-sm text-muted-foreground">Away</p>
        </div>
        <div className="flex -space-x-4 rtl:space-x-reverse">
          {opponentPlayers.map(p => (
            <Avatar key={p?.id} className="w-12 h-12 border-2 border-primary">
              <AvatarImage src={p?.avatar || "/placeholder.svg"} alt={p?.name} />
              <AvatarFallback>{getInitials(p?.name)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
    )
  };
  
  const getMatchPlayers = (match: Match): Player[] => {
      const allPlayerIds = [match.player1Id, ...(match.player2Ids || (match.player2Id ? [match.player2Id] : []))];
      return players.filter(p => p.id && allPlayerIds.includes(p.id));
  }

   const getOpponentPlayers = (match: Match): Player[] => {
      const opponentIds = match.player2Ids || (match.player2Id ? [match.player2Id] : []);
      return opponentIds.map(id => getPlayerById(id)).filter(Boolean) as Player[];
  }


  return (
    <div className="space-y-4 p-0">
        {matches.map((match) => {
          const player1 = getPlayerById(match.player1Id);
          const opponents = getOpponentPlayers(match);

          return (
             <Card key={match.id} className="overflow-hidden glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge className={match.result ? "bg-green-500" : "bg-blue-500"}>
                      {match.result ? 'COMPLETED' : 'UPCOMING'}
                    </Badge>
                    <span className="text-muted-foreground text-sm">Match #{match.matchNum}</span>
                  </div>
                   <div className="flex items-center gap-2">
                    {isAdmin && (
                        <Button size="sm" variant="outline" onClick={() => onEditMatch(match)}>
                            <Edit className="w-4 h-4 mr-2" />
                            {match.result ? 'Edit Score' : 'Set Score'}
                        </Button>
                    )}
                    <span className="text-muted-foreground text-sm">{new Date(match.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {/* Home Team */}
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="w-12 h-12 border-2 border-primary">
                      <AvatarImage src={player1?.avatar || "/placeholder.svg"} alt={player1?.name} />
                      <AvatarFallback>{getInitials(player1?.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{player1?.name}</p>
                      <p className="text-sm text-muted-foreground">Home</p>
                    </div>
                  </div>

                  <div className="text-center px-4">
                    {match.result ? (
                      <div className="text-3xl font-bold">
                        {match.result}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground">VS</div>
                    )}
                  </div>
                  
                  {getOpponentDisplay(match)}
                </div>

                {player1 && opponents.length > 0 ? (
                  match.result ? (
                  <>
                    <MatchCommentary match={match} player1={player1} opponents={opponents} />
                     {user && (
                         <div className="pt-4 mt-4 border-t">
                            <h4 className="text-sm font-semibold mb-3 text-center text-muted-foreground">Vote for Player of the Match</h4>
                            <MatchVoting match={match} players={getMatchPlayers(match)} currentUserId={user.id} />
                         </div>
                     )}
                  </>
                ) : (
                  <PreMatchAnalysis match={match} homePlayer={player1} awayPlayers={opponents} />
                )
              ) : null}
              </CardContent>
            </Card>
          )
        })}
    </div>
  )
}
