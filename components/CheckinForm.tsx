"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SignaturePad from "./SignaturePad";
import { assinarPresenca } from "@/lib/actions";

export default function CheckinForm({ inscricaoId }: { inscricaoId: string }) {
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  async function confirmar() {
    if (!assinatura) {
      setErro("Faça sua assinatura antes de confirmar.");
      return;
    }
    setSalvando(true);
    setErro(null);
    const res = await assinarPresenca(inscricaoId, assinatura);
    setSalvando(false);
    if (res?.erro) {
      setErro(res.erro);
      return;
    }
    router.push("/disponiveis");
    router.refresh();
  }

  return (
    <div className="stack">
      <SignaturePad onChange={setAssinatura} />
      {erro && <p className="erro">{erro}</p>}
      <button className="btn" onClick={confirmar} disabled={salvando}>
        {salvando ? "Confirmando…" : "Confirmar presença"}
      </button>
    </div>
  );
}
