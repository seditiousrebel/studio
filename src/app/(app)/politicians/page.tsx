import EntityCard from '@/components/EntityCard';
import { placeholderPoliticians } from '@/lib/placeholder-data';
import type { Politician } from '@/lib/types';

export default function PoliticiansListPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-primary">Politicians</h1>
      <p className="text-muted-foreground">
        Browse profiles of political figures in Nepal.
      </p>
      
      {placeholderPoliticians.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholderPoliticians.map((politician: Politician) => (
            <EntityCard 
              key={politician.id} 
              entity={{...politician, entityType: 'Politician'}} 
              linkPrefix="/politicians"
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No politicians found.</p>
      )}
    </div>
  );
}
