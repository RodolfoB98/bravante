"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    const supabase = createClient();

    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      setCarregando(false);
      if (error) return setErro(traduzErro(error.message));
      router.push("/inicio");
      router.refresh();
      return;
    }

    // criar conta
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });
    setCarregando(false);
    if (error) return setErro(traduzErro(error.message));
    if (data.session) {
      // confirmação de e-mail desligada: já entra direto
      router.push("/inicio");
      router.refresh();
    } else {
      setErro(null);
      setModo("entrar");
    }
  }

  return (
    <div className="loginwrap">
      <div className="card login">
        <div className="login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-bravante.png" alt="Grupo Bravante" />
          <span>Lista de Presença · Treinamentos</span>
        </div>

        <form className="stack" onSubmit={entrar}>
          <h1>{modo === "entrar" ? "Entrar" : "Criar conta"}</h1>
          <p className="muted">
            {modo === "entrar"
              ? "Use seu e-mail e senha cadastrados."
              : "Crie sua conta com e-mail corporativo."}
          </p>

          {modo === "criar" && (
            <label className="field">
              <span>Nome</span>
              <input
                className="input"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
              />
            </label>
          )}

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

          <label className="field">
            <span>Senha</span>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </label>

          {erro && <p className="erro">{erro}</p>}

          <button className="btn" disabled={carregando}>
            {carregando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
          </button>

          <button
            type="button"
            className="btn ghost sm"
            onClick={() => {
              setModo(modo === "entrar" ? "criar" : "entrar");
              setErro(null);
            }}
          >
            {modo === "entrar" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function traduzErro(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("User already registered")) return "Esse e-mail já tem conta. Tente entrar.";
  if (msg.includes("Password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";
  return msg;
}
