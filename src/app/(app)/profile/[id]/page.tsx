

import PlayerProfileClient from './client';

export default function PlayerProfilePage({ params: { id } }: { params: { id: string } }) {
  return <PlayerProfileClient playerId={id} />;
}
