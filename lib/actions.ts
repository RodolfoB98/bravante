"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function criarTreinamento(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("treinamentos").insert({
    nome_treinamento: String(formData.get("nome_treinamento") || "").trim(),
    instrutor: String(formData.get("instrutor") || "").trim(),
    carga_horaria: String(formData.get("carga_horaria") || "").trim(),
    local: String(formData.get("local") || "").trim(),
    data_treinamento: String(formData.get("data_treinamento") || "") || null,
    criado_por: user.id,
  });
  revalidatePath("/treinamentos");
}

export async function alterarStatus(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await supabase.from("treinamentos").update({ status }).eq("id", id);
  revalidatePath(`/treinamentos/${id}`);
  revalidatePath("/treinamentos");
}

export async function excluirTreinamento(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("treinamentos").delete().eq("id", id);
  revalidatePath("/treinamentos");
}

export async function inscrever(
  treinamentoId: string,
  nome: string,
  funcao: string,
  empresa: string
): Promise<{ erro?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Entre novamente." };

  const { error } = await supabase.from("inscricoes").insert({
    treinamento_id: treinamentoId,
    participante_id: user.id,
    nome: nome.trim(),
    funcao: funcao.trim(),
    empresa: empresa.trim(),
  });
  if (error) return { erro: error.message };
  revalidatePath("/disponiveis");
  return {};
}

export async function assinarPresenca(
  inscricaoId: string,
  assinatura: string
): Promise<{ erro?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("inscricoes")
    .update({ assinatura, assinado_em: new Date().toISOString() })
    .eq("id", inscricaoId);
  if (error) return { erro: error.message };
  revalidatePath("/disponiveis");
  return {};
}

export async function cancelarInscricao(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("inscricoes").delete().eq("id", id);
  revalidatePath("/disponiveis");
}
