import type { RouteObject } from "react-router-dom";
import { ExerciseScreen } from "@/ui/screens/ExerciseScreen";
import { HistoryScreen } from "@/ui/screens/HistoryScreen";
import { HomeScreen } from "@/ui/screens/HomeScreen";
import { RoutineEditorScreen } from "@/ui/screens/RoutineEditorScreen";
import { SessionScreen } from "@/ui/screens/SessionScreen";

/**
 * The five routes. Hash routing is deliberate: it exists so the phone's back
 * gesture returns to the previous screen instead of leaving the app, and it
 * keeps the deploy free of any server-side rewrite rule.
 *
 * Route params are `:id` — a routine or exercise id is a slug for seed rows and
 * a prefixed UUID for rows the lifter created, so "slug" would be a lie.
 */
export const routes: RouteObject[] = [
  { path: "/", element: <HomeScreen /> },
  { path: "/sessao/:id", element: <SessionScreen /> },
  { path: "/rotina/:id", element: <RoutineEditorScreen /> },
  { path: "/historico", element: <HistoryScreen /> },
  { path: "/exercicio/:id", element: <ExerciseScreen /> },
];
