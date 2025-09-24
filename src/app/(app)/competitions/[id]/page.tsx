import CompetitionStageClient from './client';

export default function CompetitionStagePage({ params }: { params: { id: string }}) {
  return <CompetitionStageClient competitionId={params.id} />;
}
