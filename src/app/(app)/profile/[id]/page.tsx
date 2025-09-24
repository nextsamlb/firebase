import PlayerProfileClient from './client';

export default function PlayerProfilePage({ params }: { params: { id: string } }) {
  return <PlayerProfileClient playerId={params.id} />;
}
