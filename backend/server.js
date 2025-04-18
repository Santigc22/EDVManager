require('dotenv').config();
const express = require('express');
const cors = require('cors');
const permisosRoutes = require("./routes/permisos");
const rolesRoutes = require("./routes/roles");
const usuariosRoutes = require("./routes/usuarios");
const loginRoutes = require("./routes/login");
const proveedoresRoutes = require("./routes/proveedores");
const clientesRoutes = require("./routes/clientes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("🚀 API de Inventario funcionando!");
});

app.use("/login", loginRoutes);

app.use("/usuarios", usuariosRoutes);

app.use("/roles", rolesRoutes);

app.use("/permisos", permisosRoutes);

app.use("/proveedores", proveedoresRoutes);

app.use("/clientes", clientesRoutes);

app.listen(PORT, () => {
    console.log(`🔥 Servidor corriendo`);
});
