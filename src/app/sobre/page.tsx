import { redirect } from "next/navigation";

/** Legacy product page — landing now lives at `/`. */
export default function SobrePage() {
  redirect("/");
}
