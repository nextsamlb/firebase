
'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trophy } from "lucide-react"
import Link from "next/link"

// Mock data, in a real app this would come from your database
const initialCompetitions = [
  {
    id: 'comp1',
    name: 'PIFA League Season 1',
    status: 'active',
    players: 5,
    maxPlayers: 5,
    entryFee: 0,
    prizePool: 1000,
  },
  {
    id: 'comp2',
    name: 'Summer Knockout Cup',
    status: 'registration',
    players: 2,
    maxPlayers: 8,
    entryFee: 100,
    prizePool: 800,
  },
];


export function CompetitionsClient() {
  const [competitions, setCompetitions] = useState(initialCompetitions)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  
  // In a real app, you would have a form state and handle submission
  // For now, this is a placeholder for the UI
  const handleCreateCompetition = () => {
    // Logic to create a new competition would go here
    setIsCreateOpen(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Competition Management</CardTitle>
          <CardDescription>Create and manage leagues and tournaments.</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Competition
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Competition</DialogTitle>
              <DialogDescription>Fill in the details for your new league or tournament.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="comp-name">Competition Name</Label>
                <Input id="comp-name" placeholder="e.g., PIFA World Series" />
              </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entry-fee">Entry Fee ($)</Label>
                    <Input id="entry-fee" type="number" defaultValue={50} />
                  </div>
                  <div>
                    <Label htmlFor="max-players">Max Players</Label>
                    <Input id="max-players" type="number" defaultValue={8} />
                  </div>
                </div>
                 <div>
                    <Label htmlFor="prize-pool">Prize Pool ($)</Label>
                    <Input id="prize-pool" type="number" defaultValue={400} />
                </div>
                <Button onClick={handleCreateCompetition} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
         {competitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitions.map((comp) => (
              <Link href={`/competitions/${comp.id}`} key={comp.id}>
                <Card className="bg-muted/50 h-full hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Trophy className="h-5 w-5 text-primary" />
                      {comp.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-semibold capitalize">{comp.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Players:</span>
                        <span className="font-semibold">{comp.players} / {comp.maxPlayers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entry Fee:</span>
                        <span className="font-semibold">${comp.entryFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prize Pool:</span>
                        <span className="font-semibold">${comp.prizePool}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center h-full">
            <Trophy className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No Competitions Created</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by creating your first league or tournament.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}