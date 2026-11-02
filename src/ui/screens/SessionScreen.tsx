import { useParams } from "react-router-dom";
import { Placeholder } from "@/ui/Placeholder";

export function SessionScreen() {
  const { id } = useParams();
  return <Placeholder title="Sessão">Sessão {id}.</Placeholder>;
}
