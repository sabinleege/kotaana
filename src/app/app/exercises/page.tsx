import { redirect } from "next/navigation";

/** Exercises page removed — only available inside AI Workout module. */
export default function ExercisesRedirect() {
  redirect("/app/workout");
}
