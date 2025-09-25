

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">League Rules</h1>
        <p className="text-muted-foreground">
          The official rules and regulations of the league.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText />
            Rules
          </CardTitle>
          <CardDescription>
            Fair play is essential. Please read and understand the rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none">
          <h2>1. General Conduct</h2>
          <p>All players are expected to maintain a high standard of sportsmanship and fair play. Any form of cheating, glitch exploitation, or unsportsmanlike conduct will not be tolerated.</p>
          
          <h2>2. Match Rules</h2>
          <ul>
            <li>All matches are to be played on the specified platform and version of the game.</li>
            <li>Players must report scores accurately and promptly after each match.</li>
            <li>In case of a disconnection, the remaining time of the match should be played with the score at the time of disconnection.</li>
          </ul>

          <h2>3. Trading & Market</h2>
          <ul>
            <li>All player transfers must be done through the official market page.</li>
            <li>Collusion or price-fixing in the market is strictly prohibited.</li>
            <li>Trade offers must be reasonable and reflect fair market value.</li>
          </ul>

           <h2>4. Admin Discretion</h2>
          <p>The league administrator has the final say in all disputes and may issue warnings, point deductions, or suspensions for rule violations.</p>
        </CardContent>
      </Card>
    </div>
  );
}
