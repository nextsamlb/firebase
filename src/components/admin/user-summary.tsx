'use client'

import { useEffect, useState } from 'react'
import { getUserSummary } from '@/app/actions'
import { Skeleton } from '@/components/ui/skeleton'
import type { Player } from '@/lib/data'
import { AlertCircle } from 'lucide-react'

interface UserSummaryProps {
  user: Player
}

export function UserSummary({ user }: UserSummaryProps) {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true)
      setError('')
      
      const registrationDate = user.registrationDate || new Date();

      const result = await getUserSummary({
        email: user.email,
        role: user.role,
        registrationDate: new Date(registrationDate).toLocaleDateString(),
      })

      if ('error' in result) {
        setError(result.error)
        setSummary('Could not load summary.')
      } else {
        setSummary(result.summary)
      }
      setLoading(false)
    }
    fetchSummary()
  }, [user])

  if (loading) {
    return <Skeleton className="h-4 w-full" />
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        <p>{summary}</p>
      </div>
    )
  }

  return <p className="text-sm text-muted-foreground">{summary}</p>
}
