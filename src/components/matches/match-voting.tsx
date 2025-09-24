

'use client'

import React, { useState, useMemo } from 'react'
import type { Match, Player } from '@/lib/data'
import { submitVote } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown, CheckCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface MatchVotingProps {
  match: Match
  players: Player[]
  currentUserId: string
}

export function MatchVoting({ match, players, currentUserId }: MatchVotingProps) {
  const [loading, setLoading] = useState(false);
  const [bestPlayerVote, setBestPlayerVote] = useState<string>('');
  const [worstPlayerVote, setWorstPlayerVote] = useState<string>('');
  const { toast } = useToast()

  const userVote = useMemo(() => {
    return match.votes ? match.votes[currentUserId] : null
  }, [match.votes, currentUserId])

  const handleVote = async () => {
    if (!bestPlayerVote || !worstPlayerVote) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Vote',
        description: 'Please select both a best and a worst player.',
      })
      return;
    }
    if (bestPlayerVote === worstPlayerVote) {
       toast({
        variant: 'destructive',
        title: 'Invalid Vote',
        description: 'Best and worst player cannot be the same person.',
      })
      return;
    }

    setLoading(true);
    try {
      await submitVote(match.id, currentUserId, bestPlayerVote, worstPlayerVote)
      toast({
        title: 'Vote Submitted!',
        description: `Your votes have been recorded.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was a problem submitting your vote.',
      })
    } finally {
      setLoading(false);
    }
  }

  if (userVote) {
    const bestPlayer = players.find(p => p.id === userVote.best);
    const worstPlayer = players.find(p => p.id === userVote.worst);
    return (
      <div className="text-center text-sm text-muted-foreground p-4 rounded-md bg-muted/50">
        <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
        You voted for <span className="font-semibold text-green-400">{bestPlayer?.name}</span> as best player and <span className="font-semibold text-red-400">{worstPlayer?.name}</span> as worst player.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium flex items-center gap-2 mb-2">
            <ThumbsUp className="h-4 w-4 text-green-500" /> Best Player
          </label>
           <Select value={bestPlayerVote} onValueChange={setBestPlayerVote}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select best player..." />
              </SelectTrigger>
              <SelectContent>
                {players.map((player) => (
                  <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        <div>
           <label className="text-sm font-medium flex items-center gap-2 mb-2">
            <ThumbsDown className="h-4 w-4 text-red-500" /> Worst Player
          </label>
           <Select value={worstPlayerVote} onValueChange={setWorstPlayerVote}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select worst player..." />
              </SelectTrigger>
              <SelectContent>
                {players.map((player) => (
                  <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
      </div>
       <div className="text-center pt-2">
        <Button onClick={handleVote} disabled={loading || !bestPlayerVote || !worstPlayerVote}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
          {loading ? 'Submitting...' : 'Submit Votes'}
        </Button>
      </div>
    </div>
  )
}
