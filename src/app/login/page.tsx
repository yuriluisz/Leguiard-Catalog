"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    if (result?.ok) {
      router.push("/admin");
      router.refresh();
      return;
    }

    setError("Credenciais invalidas. Confira email e senha.");
    setLoading(false);
  }

  const shellStyle: React.CSSProperties = {
    margin: "0 auto",
    minHeight: "100vh",
    width: "100%",
    maxWidth: "28rem",
    padding: "2rem 1rem",
    display: "flex",
    alignItems: "center"
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: "1rem",
    border: "1px solid #e4e4e7",
    background: "rgba(255,255,255,0.85)",
    padding: "1.5rem",
    boxShadow: "0 1px 3px 0 hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10)",
    backdropFilter: "blur(10px)"
  };

  const inputStyle: React.CSSProperties = {
    marginTop: "0.25rem",
    width: "100%",
    borderRadius: "0.75rem",
    border: "1px solid #d4d4d8",
    padding: "0.5rem 0.75rem"
  };

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: "0.75rem",
    background: "#1447e6",
    color: "#fff",
    fontWeight: 600,
    padding: "0.5rem 1rem",
    border: "none",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8" style={shellStyle}>
      <section className="w-full rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-card backdrop-blur" style={cardStyle}>
        <p className="section-title">Acesso do Lojista</p>
        <h1 className="mt-1 font-[var(--font-heading)] text-2xl font-bold">Entrar no Painel</h1>
        <p className="mt-2 text-sm text-zinc-600">Gerencie produtos, categorias e configuracoes da loja.</p>

        <form className="mt-5 space-y-3" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
              style={inputStyle}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            Senha
            <input
              type="password"
              required
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
              style={inputStyle}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent px-4 py-2 font-semibold text-white disabled:opacity-70"
            style={buttonStyle}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
