import EntityCard from '@/components/EntityCard';
import { placeholderParties } from '@/lib/placeholder-data';
import type { Party } from '@/lib/types';

export default function PartiesListPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-primary">Political Parties</h1>
      <p className="text-muted-foreground">
        Explore political parties active in Nepal.
      </p>
      
      {placeholderParties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholderParties.map((party: Party) => (
            <EntityCard 
              key={party.id} 
              entity={{...party, entityType: 'Party'}} 
              linkPrefix="/parties"
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No parties found.</p>
      )}
    </div>
  );
}
