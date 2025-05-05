"use client";
import Header from "../../../components/header";
import Sidebar from "../../../components/sidebar";
import styles from "./page.module.css";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function DetalleOrdenPage() {
  const router = useRouter();
  const { id } = useParams();

  const [orden, setOrden] = useState(null);
  const [materiales, setMateriales] = useState([]);
  const [totalOrden, setTotalOrden] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");
    try {
      const decoded = jwtDecode(token);
      if (!decoded.permisos.includes("ver_detalle_ordenes")) {
        return router.push("/login");
      }
    } catch {
      return router.push("/login");
    }

    const fetchDetalle = async () => {
      setLoading(true);
      const res = await fetch(`https://edvmanager.onrender.com/ordenesCompra/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // 404 page missing
        return router.push("/ordenesCompra");
      }
      const data = await res.json();
      setOrden(data.orden);
      setMateriales(data.materiales || []);
      setTotalOrden(data.total_orden || 0);
      setLoading(false);
    };

    fetchDetalle();
  }, [id, router]);

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.pageContainer}>
          <Sidebar />
          <main className={styles.mainContent}>
            <p>Cargando detalle...</p>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className={styles.pageContainer}>
        <Sidebar />
        <main className={styles.mainContent}>
          <h1 className="titulo-detalle-orden">Detalle Orden #{orden.id}</h1>

          <section className={styles.infoSection}>
            <p>
              <strong>Cliente:</strong> {orden.cliente.nombre} (ID{" "}
              {orden.cliente.id})
            </p>
            <p>
              <strong>Creado por:</strong> {orden.creado_por.nombre}
            </p>
            <p>
              <strong>Fecha de creación:</strong>{" "}
              {new Date(orden.fecha_hora).toLocaleString()}
            </p>
            <p>
              <strong>Estado:</strong> {orden.estado}
            </p>
            <p>
              <strong>Detalle:</strong> {orden.detalle}
            </p>
            <p>
              <strong>Última modificación:</strong>{" "}
              {new Date(orden["fecha_modificación"]).toLocaleString()} por{" "}
              {orden.modificado_por.nombre}
            </p>
          </section>

          <section className={styles.materialesSection}>
            <h2>Materiales</h2>
            <table className={styles.materialesTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Total Material</th>
                </tr>
              </thead>
              <tbody>
                {materiales.map((m) => (
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td>{m.nombre}</td>
                    <td>{m.cantidad}</td>
                    <td>{m.precio_unitario}</td>
                    <td>{m.total_material}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.total}>
              <strong>Total de la orden: $</strong> {totalOrden}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
