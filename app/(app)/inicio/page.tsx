import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Inicio() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, role")
    .eq("id", user!.id)
    .single();
  const isLider = profile?.role === "lider";
  const primeiroNome = (profile?.nome || "").split(" ")[0];

  return (
    <div className="stack lg">
      <div>
        <p className="eyebrow">{isLider ? "Líder" : "Participante"}</p>
        <h1>Olá{primeiroNome ? `, ${primeiroNome}` : ""}.</h1>
      </div>

      <div className="grid2">
        {isLider ? (
          <Link href="/treinamentos" className="card action">
            <h3>Gerenciar treinamentos</h3>
            <p className="muted">Crie treinamentos, acompanhe inscrições e gere a lista oficial.</p>
          </Link>
        ) : null}
        <Link href="/disponiveis" className="card action">
          <h3>{isLider ? "Marcar minha presença" : "Treinamentos disponíveis"}</h3>
          <p className="muted">Inscreva-se e assine a presença pelo seu celular.</p>
        </Link>
      </div>
    </div>
  );
}
