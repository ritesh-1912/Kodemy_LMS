import { redirect } from "next/navigation";

export default function OldSignUp() {
  redirect("/auth/register");
}
