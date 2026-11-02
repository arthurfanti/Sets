import { useParams } from "react-router-dom";
import { Placeholder } from "@/ui/Placeholder";

export function RoutineEditorScreen() {
  const { slug } = useParams();
  return <Placeholder title="Rotina">Rotina {slug}.</Placeholder>;
}
