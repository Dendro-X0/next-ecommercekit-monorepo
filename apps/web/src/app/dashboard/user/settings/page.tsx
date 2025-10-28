import { redirect } from "next/navigation"

/**
 * Redirect settings index to default Profile tab.
 */
export default function Page(): never {
  redirect("/dashboard/user/settings/profile")
}
