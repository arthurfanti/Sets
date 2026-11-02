import { useEffect, useState } from "react";
import { listRoutines } from "@/db/repositories";
import type { Routine } from "@/domain";
import { Placeholder } from "@/ui/Placeholder";

export function HomeScreen() {
  const [routines, setRoutines] = useState<Routine[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listRoutines().then((rows) => {
      if (!cancelled) setRoutines(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Placeholder title="Rotinas">
      {routines === null ? null : routines.length === 0 ? (
        <p>Nenhuma rotina ainda.</p>
      ) : (
        <ul>
          {routines.map((routine) => (
            <li key={routine.id}>{routine.name}</li>
          ))}
        </ul>
      )}
    </Placeholder>
  );
}
