
"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar } from "lucide-react"
import { getMatches, getPlayers, type Match, type Player } from "@/lib/data"
import { Skeleton } from "@/components/ui/skeleton"
import { MatchList } from "@/components/matches/match-list"
import { useAuth } from "@/hooks/use-auth"
import { EditMatchForm } from "@/components/admin/edit-match-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { updateMatchScore } from "@/app/actions"
import { useTranslation } from "@/context/language-provider"


export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const { t, language } = useTranslation();

  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  
  const [sortConfig, setSortConfig] = useState<{ key: 'matchNum' | 'timestamp'; direction: 'ascending' | 'descending' } | null>({ key: 'matchNum', direction: 'ascending' });

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const [allMatches, allPlayers] = await Promise.all([getMatches(), getPlayers()])
      setMatches(allMatches)
      setPlayers(allPlayers)
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [])

  const sortedMatches = useMemo(() => {
    let sortableMatches = [...matches];
    if (sortConfig !== null) {
      sortableMatches.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableMatches;
  }, [matches, sortConfig]);


  const handleEditMatch = (match: Match) => {
    setSelectedMatch(match)
    setIsMatchDialogOpen(true)
  }
  
  const handleSaveMatch = async (updatedMatch: Match) => {
    try {
      const result = await updateMatchScore({ matchId: updatedMatch.id, newScore: updatedMatch.result, language });
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      } else {
        toast({ title: 'Match Updated', description: `Match score has been updated.` });
        // Refresh matches to show updated scores and stats
        fetchMatches();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
    }
    setIsMatchDialogOpen(false);
    setSelectedMatch(null);
  }


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{t('matches')}</h1>
            <p className="text-muted-foreground">{t('matchesSubtitle')}</p>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t('matches')}</h1>
        <p className="text-muted-foreground">{t('matchesSubtitle')}</p>
      </div>

       <MatchList
            matches={sortedMatches}
            players={players}
            isAdmin={user?.role === 'admin'}
            onEditMatch={handleEditMatch}
        />


      <Dialog
        open={isMatchDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedMatch(null)
          }
          setIsMatchDialogOpen(isOpen)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('editMatchScore')}</DialogTitle>
            <DialogDescription>
              {t('editMatchScoreDescription')}
            </DialogDescription>
          </DialogHeader>
          <EditMatchForm
            match={selectedMatch}
            players={players}
            isCreating={false}
            onSave={handleSaveMatch}
            onCancel={() => setIsMatchDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
