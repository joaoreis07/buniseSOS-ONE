import { redirect } from "next/navigation";

/** Alias for the public demonstration entry. */
export default function DemonstracaoPage() {
  redirect("/demo/dashboard");
}
