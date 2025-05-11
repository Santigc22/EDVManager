"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Header from "../../components/header";
import Sidebar from "../../components/sidebar";
import styles from "./page.module.css";

export default function CrearRolPage() {
    const router = useRouter();
  
    const [nombre, setNombre] = useState("");
    const [permisos, setPermisos] = useState([]);
    const [selected, setSelected] = useState([]);
    const [modules, setModules] = useState([]);
    const [activeModule, setActiveModule] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
  
    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");
      try {
        const decoded = jwtDecode(token);
        if (!decoded.permisos.includes("crear_roles")) {
          return router.push("/login");
        }
      } catch {
        return router.push("/login");
      }
  
      fetch("http://localhost:5000/permisos", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          const perms = data;
          setPermisos(perms);
  
          const mods = Array.from(
            new Set(perms.map((p) => p.nombre.split("_")[1]))
          );
          setModules(mods);
          setActiveModule(mods[0] || "");
        })
        .catch(console.error);
    }, [router]);
  
    const togglePermiso = (id) => {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrorMsg("");
      if (!nombre.trim()) {
        setErrorMsg("El nombre es obligatorio.");
        return;
      }
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:5000/roles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nombre, permisos: selected }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error al crear rol");
        router.push("/roles");
      } catch (err) {
        setErrorMsg(err.message);
      }
    };
  
    return (
      <>
        <Header />
        <div className={styles.pageContainer}>
          <Sidebar />
          <main className={styles.mainContent}>
            <h1 className="titulo-registrar-rol">Registrar Nuevo Rol</h1>
            <form className={styles.form} onSubmit={handleSubmit}>
              {errorMsg && <div className={styles.error}>{errorMsg}</div>}
  
              <div className={styles.group}>
                <label>Nombre del rol</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
  
              <div className={styles.group}>
                <label>Módulos</label>
                <div className={styles.modules}>
                  {modules.map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      className={
                        mod === activeModule
                          ? styles.moduleBtnActive
                          : styles.moduleBtn
                      }
                      onClick={() => setActiveModule(mod)}
                    >
                      {mod.charAt(0).toUpperCase() + mod.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
  
              <div className={styles.group}>
                <label>Permisos ({activeModule})</label>
                <div className={styles.permissions}>
                  {permisos
                    .filter((p) => p.nombre.split("_")[1] === activeModule)
                    .map((p) => (
                      <label key={p.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          value={p.id}
                          checked={selected.includes(p.id)}
                          onChange={() => togglePermiso(p.id)}
                        />
                        {p.nombre}
                      </label>
                    ))}
                </div>
              </div>
  
              <button type="submit" className={styles.submitBtn}>
                Registrar
              </button>
            </form>
          </main>
        </div>
      </>
    );
  }
