import EntityCard from '@/components/EntityCard';
import { placeholderPromises } from '@/lib/placeholder-data';
import type { PromiseEntity } from '@/lib/types';

export default function PromisesListPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-primary">Promises</h1>
      <p className="text-muted-foreground">
        Track promises made by politicians and parties.
      </p>
      
      {placeholderPromises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholderPromises.map((promise: PromiseEntity) => (
            <EntityCard 
              key={promise.id} 
              entity={{...promise, entityType: 'Promise'}} 
              linkPrefix="/promises"
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No promises found.</p>
      )}
    </div>
  );
}
