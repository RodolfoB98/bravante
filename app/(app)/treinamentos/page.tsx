import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { criarTreinamento } from "@/lib/actions";

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  encerrado: "Encerrado",
};

export default async function Treinamentos() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  if (profile?.role !== "lider") redirect("/disponiveis");

  const { data: treinamentos } = await supabase
    .from("treinamentos")
    .select("id, nome_treinamento, instrutor, data_treinamento, status")
    .eq("criado_por", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="stack lg">
      <h1>Treinamentos</h1>

      <section className="card">
        <h3>Novo treinamento</h3>
        <form action={criarTreinamento} className="formgrid">
          <label className="field span2">
            <span>Nome do treinamento</span>
            <input className="input" name="nome_treinamento" required placeholder="NR-35 — Trabalho em Altura" />
          </label>
          <label className="field">
            <span>Instrutor</span>
            <input className="input" name="instrutor" />
          </label>
          <label className="field">
            <span>Carga horária</span>
            <input className="input" name="carga_horaria" placeholder="8h" />
          </label>
          <label className="field">
            <span>Local</span>
            <input className="input" name="local" />
          </label>
          <label className="field">
            <span>Data</span>
            <input className="input" name="data_treinamento" type="date" />
          </label>
          <div className="span2">
            <button className="btn">Criar treinamento</button>
          </div>
        </form>
      </section>

      <section className="stack">
        {(treinamentos ?? []).length === 0 ? (
          <p className="muted">Nenhum treinamento ainda. Crie o primeiro acima.</p>
        ) : (
          (treinamentos ?? []).map((t) => (
            <Link key={t.id} href={`/treinamentos/${t.id}`} className="card row">
              <div>
                <strong>{t.nome_treinamento}</strong>
                <p className="muted">
                  {t.instrutor || "Sem instrutor"} ·{" "}
                  {t.data_treinamento
                    ? new Date(t.data_treinamento + "T00:00").toLocaleDateString("pt-BR")
                    : "sem data"}
                </p>
              </div>
              <span className={`badge ${t.status}`}>{STATUS_LABEL[t.status]}</span>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
