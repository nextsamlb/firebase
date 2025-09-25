

'use server'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCompetitions, getPlayers, Player } from '@/lib/data';
import { Crown, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

export default async function HallOfFamePage() {
  const [competitions, players] = await Promise.all([getCompetitions(), getPlayers()]);
  const completedCompetitions = competitions.filter(c => c.status === 'completed' && c.winnerId);
  const playerMap = new Map(players.map(p => [p.id, p]));

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.map((n) => n[0]).join('').toUpperCase();
  }

  return (
    <div className="space-y-8">
      <div className="relative text-center p-8 rounded-3xl overflow-hidden glass">
         <Image 
            src="https://picsum.photos/seed/hof-bg/1200/400"
            alt="Hall of Fame background"
            layout="fill"
            objectFit="cover"
            className="absolute inset-0 -z-10 opacity-30"
            data-ai-hint="stadium confetti"
          />
         <div className="relative z-10">
            <h1 className="text-5xl font-bold tracking-tight mb-2 font-accent flex items-center justify-center gap-4">
                <Crown className="w-12 h-12 text-primary" />
                Hall of Fame
            </h1>
            <p className="text-xl text-muted-foreground">Honoring the champions of past seasons.</p>
         </div>
      </div>
      
      {completedCompetitions.length > 0 ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {completedCompetitions.map(c => {
                const winner = c.winnerId ? playerMap.get(c.winnerId) : null;
                const runnerUp = c.runnerUpId ? playerMap.get(c.runnerUpId) : null;

                return (
                    <Card key={c.id} className="glass text-center transform hover:-translate-y-2 transition-transform duration-300">
                        <CardHeader className="items-center pb-4">
                           <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                           <CardTitle className="text-2xl font-semibold text-primary">{c.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                           {winner && (
                            <div className="flex flex-col items-center">
                                <Avatar className="w-24 h-24 mb-3 border-4 border-primary">
                                    <AvatarImage src={winner.avatar} />
                                    <AvatarFallback>{getInitials(winner.name)}</AvatarFallback>
                                </Avatar>
                                <p className="text-3xl font-bold">{winner.name}</p>
                                <p className="text-sm text-primary">Champion</p>
                            </div>
                           )}
                           {runnerUp && (
                             <div className="mt-4 pt-4 border-t border-border/50">
                                <p className="text-sm text-muted-foreground">Runner-up: <span className="font-semibold text-foreground">{runnerUp.name}</span></p>
                             </div>
                           )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
      ) : (
        <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
                <Trophy className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">The Hall is Empty</h3>
                <p>The first champion has yet to be crowned. Complete a season to begin the legacy!</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
