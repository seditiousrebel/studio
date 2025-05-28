import EntityCard from '@/components/EntityCard';
import { placeholderBills } from '@/lib/placeholder-data';
import type { Bill } from '@/lib/types';

export default function BillsListPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-primary">Bills & Legislations</h1>
      <p className="text-muted-foreground">
        Track important bills and their progress through parliament.
      </p>
      
      {placeholderBills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholderBills.map((bill: Bill) => (
            <EntityCard 
              key={bill.id} 
              entity={{...bill, entityType: 'Bill'}} 
              linkPrefix="/bills"
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No bills found.</p>
      )}
    </div>
  );
}
