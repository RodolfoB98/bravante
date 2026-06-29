import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, role")
    .eq("id", user.id)
    .single();

  const isLider = profile?.role === "lider";

  return (
    <div className="app">
      <header className="topbar">
        <Link href="/inicio" className="brand small">
          <span className="brand-mark" aria-hidden />
          <strong>Lista de Presença</strong>
        </Link>
        <nav className="navlinks">
          {isLider && <Link href="/treinamentos">Treinamentos</Link>}
          <Link href="/disponiveis">{isLider ? "Inscrever-se" : "Treinamentos"}</Link>
          <form action="/auth/sign-out" method="post">
            <button className="btn ghost sm">Sair</button>
          </form>
        </nav>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}
