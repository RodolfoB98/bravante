"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inscrever } from "@/lib/actions";
import { FUNCOES, OUTRA_FUNCAO } from "@/lib/funcoes";

export default function EnrollForm({
  treinamentoId,
  nomePadrao,
  empresaPadrao,
}: {
  treinamentoId: string;
  nomePadrao: string;
  empresaPadrao: string;
}) {
  const [nome, setNome] = useState(nomePadrao);
  const [empresa, setEmpresa] = useState(empresaPadrao);
  const [funcaoSel, setFuncaoSel] = useState("");
  const [funcaoLivre, setFuncaoLivre] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  const usaLivre = funcaoSel === OUTRA_FUNCAO;

  async function enviar() {
    const funcao = usaLivre ? funcaoLivre : funcaoSel;
    if (!nome.trim()) return setErro("Informe o nome.");
    if (!funcao.trim()) return setErro("Selecione ou escreva a função.");
    setSalvando(true);
    setErro(null);
    const res = await inscrever(treinamentoId, nome, funcao, empresa);
    setSalvando(false);
    if (res.erro) return setErro(res.erro);
    router.refresh();
  }

  return (
    <div className="stack">
      <label className="field">
        <span>Nome</span>
        <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
      </label>

      <label className="field">
        <span>Função</span>
        <select
          className="input"
          value={funcaoSel}
          onChange={(e) => setFuncaoSel(e.target.value)}
        >
          <option value="">Selecione…</option>
          {FUNCOES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
          <option value={OUTRA_FUNCAO}>{OUTRA_FUNCAO}</option>
        </select>
      </label>

      {usaLivre && (
        <label className="field">
          <span>Escreva a função</span>
          <input
            className="input"
            value={funcaoLivre}
            onChange={(e) => setFuncaoLivre(e.target.value)}
            placeholder="Ex.: Encarregado de pátio"
          />
        </label>
      )}

      <label className="field">
        <span>Empresa</span>
        <input className="input" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
      </label>

      {erro && <p className="erro">{erro}</p>}
      <button className="btn" onClick={enviar} disabled={salvando}>
        {salvando ? "Inscrevendo…" : "Inscrever-se"}
      </button>
    </div>
  );
}
