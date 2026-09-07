import { redirect } from "next/navigation";

/** Injuries moved under Health hub. */
export default function InjuriesRedirect() {
  redirect("/app/health?tab=injuries");
}
