import { useEffect, useState } from "react";
import { listRoutines } from "@/db/repositories";
import type { Routine } from "@/domain";
import { Placeholder } from "@/ui/Placeholder";

export function HomeScreen() {
  const [routines, setRoutines] = useState<Routine[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listRoutines()
      .then((rows) => {
        if (!cancelled) setRoutines(rows);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Placeholder title="Rotinas">
      {failed ? <p>Não foi possível carregar as rotinas.</p> : null}
      {routines !== null && routines.length > 0 ? (
        <ul>
          {routines.map((routine) => (
            <li key={routine.id}>{routine.name}</li>
          ))}
        </ul>
      ) : null}
    </Placeholder>
  );
}
