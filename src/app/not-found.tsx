import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

// Fallback for unmatched routes — go to the default locale.
export default function RootNotFound() {
  redirect(`/${routing.defaultLocale}`);
}
