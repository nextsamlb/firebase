
'use client'

import { useEffect, useState } from 'react'
import { generateMatchCommentary } from '@/app/actions'
import { Skeleton } from '@/components/ui/skeleton'
import { updateMatch, type Match, type Player } from '@/lib/data'
import { AlertCircle, Sparkles } from 'lucide-react'

interface MatchCommentaryProps {
  match: Match
  player1: Player
  opponents: Player[]
}

export function MatchCommentary({ match, player1, opponents }: MatchCommentaryProps) {
  const [commentary, setCommentary] = useState(match.postMatchCommentary || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrGenerateCommentary = async () => {
      if (match.postMatchCommentary) {
        setCommentary(match.postMatchCommentary)
        return
      }

      if (!match.result || opponents.length === 0) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const opponentNames = opponents.map((p) => p.name).join(' & ')

      const result = await generateMatchCommentary({
        player1Name: player1.name,
        player2Name: opponentNames,
        result: match.result!,
        stageName: match.stageName,
      })

      if ('error' in result) {
        setError(result.error)
        setCommentary('Could not load commentary.')
      } else {
        setCommentary(result.commentary)
        // Save the generated commentary to the database
        try {
          await updateMatch({ ...match, postMatchCommentary: result.commentary })
        } catch (dbError) {
          console.error("Failed to save commentary to DB", dbError)
          // Don't show a user-facing error for this, just log it.
        }
      }
      setLoading(false)
    }

    fetchOrGenerateCommentary()
  }, [match, player1, opponents])

  if (!match.result) {
    return null
  }

  return (
    <div className="pt-4">
      <div className="flex items-start gap-3 text-sm">
        <Sparkles className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
        <div className="flex-grow">
          {loading && <Skeleton className="h-8 w-full" />}
          {!loading && error && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p>{commentary}</p>
            </div>
          )}
          {!loading && !error && commentary && <p className="italic text-muted-foreground">&quot;{commentary}&quot;</p>}
        </div>
      </div>
    </div>
  )
}
