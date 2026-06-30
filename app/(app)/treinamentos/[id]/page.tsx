import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { alterarStatus, excluirTreinamento } from "@/lib/actions";

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  encerrado: "Encerrado",
};

export default async function DetalheTreinamento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: t } = await supabase
    .from("treinamentos")
    .select("*")
    .eq("id", id)
    .single();
  if (!t) notFound();

  const { data: inscricoes } = await supabase
    .from("inscricoes")
    .select("id, nome, funcao, empresa, assinado_em")
    .eq("treinamento_id", id)
    .order("created_at", { ascending: true });

  const lista = inscricoes ?? [];
  const assinados = lista.filter((i) => i.assinado_em).length;

  return (
    <div className="stack lg">
      <div className="rowtop">
        <div>
          <Link href="/treinamentos" className="back">← Treinamentos</Link>
          <h1>{t.nome_treinamento}</h1>
          <p className="muted">
            {t.instrutor || "Sem instrutor"} · {t.carga_horaria || "—"} · {t.local || "—"} ·{" "}
            {t.data_treinamento
              ? new Date(t.data_treinamento + "T00:00").toLocaleDateString("pt-BR")
              : "sem data"}
          </p>
        </div>
        <span className={`badge ${t.status}`}>{STATUS_LABEL[t.status]}</span>
      </div>

      <section className="card">
        <div className="rowtop">
          <h3>Presenças</h3>
          <span className="muted">
            {assinados} de {lista.length} assinaram
          </span>
        </div>

        {lista.length === 0 ? (
          <p className="muted">Ninguém inscrito ainda.</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Função</th>
                <th>Empresa</th>
                <th>Assinatura</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((i) => (
                <tr key={i.id}>
                  <td>{i.nome}</td>
                  <td>{i.funcao}</td>
                  <td>{i.empresa}</td>
                  <td>
                    {i.assinado_em ? (
                      <span className="ok">Assinou ✓</span>
                    ) : (
                      <span className="muted">Pendente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card stack">
        <h3>Lista oficial</h3>
        <p className="muted">
          Gera o formulário FRC-014 preenchido com os participantes que já assinaram.
        </p>
        <a className="btn" href={`/api/treinamentos/${t.id}/lista`}>
          Baixar lista de presença
        </a>
      </section>

      <section className="card stack">
        <h3>Status do treinamento</h3>
        <div className="btnrow">
          {(["aberto", "em_andamento", "encerrado"] as const).map((s) => (
            <form key={s} action={alterarStatus}>
              <input type="hidden" name="id" value={t.id} />
              <input type="hidden" name="status" value={s} />
              <button
                className={`btn ${t.status === s ? "" : "ghost"} sm`}
                disabled={t.status === s}
              >
                {STATUS_LABEL[s]}
              </button>
            </form>
          ))}
        </div>
      </section>

      <form action={excluirTreinamento}>
        <input type="hidden" name="id" value={t.id} />
        <button className="btn danger ghost sm">Excluir treinamento</button>
      </form>
    </div>
  );
}
