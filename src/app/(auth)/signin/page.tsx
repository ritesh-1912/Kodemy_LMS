import { redirect } from "next/navigation";

export default function OldSignIn() {
  redirect("/auth/login");
}
