import { redirect } from "next/navigation";

/** Public demo entry — dashboard of the interactive demonstration. */
export default function DemoIndexPage() {
  redirect("/demo/dashboard");
}
