import { createClient } from "@/lib/supabase/server";
import { gerarListaPresenca } from "@/lib/gerarLista";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const { data: t } = await supabase
    .from("treinamentos")
    .select("*")
    .eq("id", id)
    .single();
  if (!t) return new Response("Treinamento não encontrado", { status: 404 });
  if (t.criado_por !== user.id) return new Response("Sem permissão", { status: 403 });

  const { data: inscricoes } = await supabase
    .from("inscricoes")
    .select("nome, funcao, empresa, assinatura, assinado_em")
    .eq("treinamento_id", id)
    .not("assinado_em", "is", null)
    .order("created_at", { ascending: true });

  const data = t.data_treinamento
    ? new Date(t.data_treinamento + "T00:00").toLocaleDateString("pt-BR")
    : "";

  const buffer = gerarListaPresenca({
    local: t.local || "",
    data,
    nome_treinamento: t.nome_treinamento || "",
    instrutor: t.instrutor || "",
    carga_horaria: t.carga_horaria || "",
    participantes: (inscricoes ?? []).map((i) => ({
      nome: i.nome,
      funcao: i.funcao || "",
      empresa: i.empresa || "",
      assinatura: i.assinatura || "",
    })),
  });

  const slug = (t.nome_treinamento || "treinamento")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="lista-presenca-${slug}.docx"`,
    },
  });
}
