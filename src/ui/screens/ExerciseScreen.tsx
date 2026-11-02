import { useParams } from "react-router-dom";
import { Placeholder } from "@/ui/Placeholder";

export function ExerciseScreen() {
  const { slug } = useParams();
  return <Placeholder title="Exercício">Exercício {slug}.</Placeholder>;
}
