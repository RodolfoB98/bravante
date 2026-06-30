import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EnrollForm from "@/components/EnrollForm";
import { cancelarInscricao } from "@/lib/actions";

export default async function Disponiveis() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, empresa")
    .eq("id", user!.id)
    .single();

  const { data: treinamentos } = await supabase
    .from("treinamentos")
    .select("id, nome_treinamento, instrutor, carga_horaria, local, data_treinamento, status")
    .in("status", ["aberto", "em_andamento"])
    .order("data_treinamento", { ascending: true });

  const { data: minhas } = await supabase
    .from("inscricoes")
    .select("id, treinamento_id, assinado_em")
    .eq("participante_id", user!.id);

  const porTreino = new Map(
    (minhas ?? []).map((m) => [m.treinamento_id, m])
  );

  return (
    <div className="stack lg">
      <h1>Treinamentos disponíveis</h1>

      {(treinamentos ?? []).length === 0 ? (
        <p className="muted">Nenhum treinamento aberto no momento.</p>
      ) : (
        (treinamentos ?? []).map((t) => {
          const insc = porTreino.get(t.id);
          return (
            <section key={t.id} className="card stack">
              <div className="rowtop">
                <div>
                  <strong>{t.nome_treinamento}</strong>
                  <p className="muted">
                    {t.instrutor || "Sem instrutor"} · {t.carga_horaria || "—"} ·{" "}
                    {t.local || "—"} ·{" "}
                    {t.data_treinamento
                      ? new Date(t.data_treinamento + "T00:00").toLocaleDateString("pt-BR")
                      : "sem data"}
                  </p>
                </div>
              </div>

              {!insc ? (
                <EnrollForm
                  treinamentoId={t.id}
                  nomePadrao={profile?.nome || ""}
                  empresaPadrao={profile?.empresa || "Navemestra"}
                />
              ) : insc.assinado_em ? (
                <div className="rowtop">
                  <span className="ok">Presença confirmada ✓</span>
                </div>
              ) : (
                <div className="btnrow">
                  <Link className="btn" href={`/checkin/${insc.id}`}>
                    Fazer check-in (assinar)
                  </Link>
                  <form action={cancelarInscricao}>
                    <input type="hidden" name="id" value={insc.id} />
                    <button className="btn ghost sm">Cancelar inscrição</button>
                  </form>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
