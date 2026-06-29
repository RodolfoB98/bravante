import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckinForm from "@/components/CheckinForm";

export default async function Checkin({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: insc } = await supabase
    .from("inscricoes")
    .select("id, nome, funcao, assinado_em, treinamentos(nome_treinamento)")
    .eq("id", id)
    .single();
  if (!insc) notFound();

  const treino = Array.isArray(insc.treinamentos)
    ? insc.treinamentos[0]
    : insc.treinamentos;

  return (
    <div className="stack lg">
      <div>
        <Link href="/disponiveis" className="back">← Voltar</Link>
        <h1>Assinar presença</h1>
        <p className="muted">
          {treino?.nome_treinamento} · {insc.nome} · {insc.funcao}
        </p>
      </div>

      {insc.assinado_em ? (
        <p className="ok">Você já assinou este treinamento ✓</p>
      ) : (
        <CheckinForm inscricaoId={insc.id} />
      )}
    </div>
  );
}
