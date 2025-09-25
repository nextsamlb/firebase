
'use client'

import { useEffect, useState } from 'react'
import { generateMatchCommentary } from '@/app/actions'
import { Skeleton } from '@/components/ui/skeleton'
import { updateMatch, type Match, type Player } from '@/lib/data'
import { AlertCircle, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { useTranslation } from '@/context/language-provider'

interface MatchCommentaryProps {
  match: Match
  player1: Player
  opponents: Player[]
}

export function MatchCommentary({ match, player1, opponents }: MatchCommentaryProps) {
  const [commentary, setCommentary] = useState(match.postMatchCommentary || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { language } = useTranslation();

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
        language
      })

      if ('error' in result) {
        setError(result.error)
        setCommentary('Could not load commentary.')
      } else {
        setCommentary(result.commentary)
        try {
          await updateMatch({ ...match, postMatchCommentary: result.commentary })
        } catch (dbError) {
          console.error("Failed to save commentary to DB", dbError)
        }
      }
      setLoading(false)
    }

    fetchOrGenerateCommentary()
  }, [match, player1, opponents, language])

  if (!match.result) {
    return null
  }

  return (
    <div className="pt-4 mt-4 border-t">
       {match.matchImage && (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-4 shadow-lg">
                <Image src={match.matchImage} alt={`Highlight from match ${match.matchNum}`} layout="fill" objectFit="cover" />
            </div>
        )}
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
