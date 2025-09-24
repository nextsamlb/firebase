
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

// Placeholder data - in a real app, this would come from your database
const champions = [
    { season: "Season 1 (2024)", champion: "Houssam", runnerUp: "Sameh" },
    { season: "Pre-Season Cup (2023)", champion: "Bahaa", runnerUp: "Tarek" },
]

export default function HallOfFamePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hall of Fame</h1>
        <p className="text-muted-foreground">
          Honoring the champions of past seasons.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy />
            Past Champions
          </CardTitle>
           <CardDescription>A legacy of excellence.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-8">
                {champions.map(c => (
                    <div key={c.season} className="flex flex-col items-center text-center p-6 rounded-lg bg-muted/50 border">
                        <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                        <h2 className="text-2xl font-semibold text-primary">{c.season}</h2>
                        <p className="text-4xl font-bold mt-2">{c.champion}</p>
                        <p className="text-sm text-muted-foreground mt-1">Runner-up: {c.runnerUp}</p>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
