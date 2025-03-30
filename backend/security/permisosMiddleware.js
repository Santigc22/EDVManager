const verificarPermiso = (permisoRequerido) => (req, res, next) => {
    if (!req.usuario || !req.usuario.permisos.includes(permisoRequerido)) {
        return res.status(403).json({ message: "No tienes permisos para realizar esta acción." });
    }
    next();
};

module.exports = verificarPermiso;