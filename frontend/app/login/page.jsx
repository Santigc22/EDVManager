"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, contrasenia: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error en la autenticación");
      }

      localStorage.setItem("token", data.token);

      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#1e1e1e" }}>
      <div className="card shadow p-4 text-white text-center" style={{ width: "400px", backgroundColor: "#05874b" }}>
        <div className="d-flex justify-content-center mb-3">
          <img src="https://i.ibb.co/tPTQn9TB/Captura-1.png" alt="Logo EDV Manager" style={{ width: "100px" }} />
        </div>
        
        <h2 className="mb-2">Bienvenido a EDV Manager</h2>
        <p style={{ fontSize: "14px" }}>Para continuar, inicie sesión con su cuenta.</p>
        
        <form onSubmit={handleLogin}>
          <div className="mb-3 text-start">
            <label className="form-label">Nombre de usuario</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3 text-start">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn w-100" style={{ backgroundColor: "#ffc107", color: "#000" }}>
            Iniciar Sesión
          </button>
        </form>

        <p className="mt-3">
          ¿No tiene cuenta?{" "}
          <span
            className="text-warning"
            style={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={() => setShowInfo(true)}
          >
            Solicítela aquí.
          </span>
        </p>

        {showInfo && (
          <div className="alert alert-info text-dark mt-2 d-flex justify-content-between align-items-center">
            <span>Contáctate a este correo para solicitar tu cuenta: <b>santiago@hotmail.com</b></span>
            <button className="btn-close" onClick={() => setShowInfo(false)}></button>
          </div>
        )}
      </div>
    </div>
  );
}