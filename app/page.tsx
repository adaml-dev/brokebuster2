import { redirect } from "next/navigation";

export default function Home() {
  // Od razu przekieruj na dashboard
  redirect("/dashboard");
}