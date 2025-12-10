import { useState } from "react";

export default function AuthForm({ API_BASE, onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error");
      return;
    }

    if (mode === "register") {
      alert("Usuario registrado. Ahora inicia sesión.");
      setMode("login");
      return;
    }

    // LOGIN OK → guardar token
    localStorage.setItem("token", data.token);

    // notifica a App que el login fue exitoso
    if (onLogin) onLogin();

    alert("Sesión iniciada");
  }

  return (
    <div className="auth-box">
      <h2>{mode === "login" ? "Iniciar Sesión" : "Crear cuenta"}</h2>

      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="auth-input"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="auth-input"
        />

        <button className="auth-btn" type="submit">
          {mode === "login" ? "Entrar" : "Registrarse"}
        </button>
      </form>

      <button
        className="auth-switch"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login"
          ? "¿No tienes cuenta? Regístrate"
          : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </div>
  );
}
