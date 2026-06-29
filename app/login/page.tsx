"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setCarregando(false);
    if (error) setErro(error.message);
    else setEnviado(true);
  }

  return (
    <div className="loginwrap">
      <div className="card login">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <strong>Lista de Presença</strong>
            <small>Treinamentos</small>
          </div>
        </div>

        {enviado ? (
          <div className="stack">
            <h1>Confira seu e-mail</h1>
            <p className="muted">
              Enviamos um link de acesso para <b>{email}</b>. Abra no mesmo
              aparelho para entrar.
            </p>
          </div>
        ) : (
          <form className="stack" onSubmit={entrar}>
            <h1>Entrar</h1>
            <p className="muted">Use seu e-mail corporativo. Sem senha — enviamos um link.</p>
            <label className="field">
              <span>E-mail</span>
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@bravante.com.br"
              />
            </label>
            {erro && <p className="erro">{erro}</p>}
            <button className="btn" disabled={carregando}>
              {carregando ? "Enviando…" : "Enviar link de acesso"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
