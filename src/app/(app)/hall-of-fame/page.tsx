
'use server'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPlayers, type Player } from '@/lib/data';
import { Crown, Trophy, Shield, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

export default async function HallOfFamePage() {
  const players = await getPlayers();
  const activePlayers = players.filter(p => p.role === 'player' && p.stats.played > 0);

  if (activePlayers.length === 0) {
    return (
      <div className="space-y-8">
         <div className="relative text-center p-8 rounded-3xl overflow-hidden glass">
             <Image 
                src="https://picsum.photos/seed/hof-bg/1200/400"
                alt="Hall of Fame background"
                fill
                objectFit="cover"
                className="absolute inset-0 -z-10 opacity-30"
                data-ai-hint="stadium confetti"
              />
             <div className="relative z-10">
                <h1 className="text-5xl font-bold tracking-tight mb-2 font-accent flex items-center justify-center gap-4">
                    <Crown className="w-12 h-12 text-primary" />
                    Hall of Fame
                </h1>
                <p className="text-xl text-muted-foreground">Honoring the legends of the league.</p>
             </div>
          </div>
        <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
                <Trophy className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">The Hall is Empty</h3>
                <p>Play some matches to begin building a legacy!</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  const leagueMVP = [...activePlayers].sort((a, b) => b.stats.points - a.stats.points)[0];
  const topScorer = [...activePlayers].sort((a, b) => b.stats.goalsFor - a.stats.goalsFor)[0];
  const mostWins = [...activePlayers].sort((a, b) => b.stats.wins - a.stats.wins)[0];

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.map((n) => n[0]).join('').toUpperCase();
  }

  const LegendCard = ({ player, title, stat, unit, icon: Icon, color }: { player: Player, title: string, stat: string | number, unit: string, icon: React.ElementType, color: string }) => {
    return (
        <Card className="glass text-center transform hover:-translate-y-2 transition-transform duration-300">
            <CardHeader className="items-center pb-4">
               <Icon className={`h-16 w-16 ${color} mb-4`} />
               <CardTitle className="text-2xl font-semibold text-primary">{title}</CardTitle>
            </CardHeader>
            <CardContent>
               {player && (
                <div className="flex flex-col items-center">
                    <Avatar className="w-24 h-24 mb-3 border-4 border-primary">
                        <AvatarImage src={player.avatar} />
                        <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                    </Avatar>
                    <p className="text-3xl font-bold">{player.name}</p>
                    <p className={`text-lg font-semibold ${color}`}>{stat} {unit}</p>
                </div>
               )}
            </CardContent>
        </Card>
    );
  };


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
            <p className="text-xl text-muted-foreground">Honoring the all-time greatest players of the league.</p>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {leagueMVP && <LegendCard player={leagueMVP} title="League MVP" stat={leagueMVP.stats.points} unit="Points" icon={Crown} color="text-yellow-400" />}
        {topScorer && <LegendCard player={topScorer} title="Top Scorer" stat={topScorer.stats.goalsFor} unit="Goals" icon={Trophy} color="text-amber-500" />}
        {mostWins && <LegendCard player={mostWins} title="Most Wins" stat={mostWins.stats.wins} unit="Victories" icon={Zap} color="text-green-500" />}
      </div>
    </div>
  );
}
