import { Navigate } from "react-router-dom";

// /admin ahora redirige a /portal - unificación de rutas
const Admin = () => {
  return <Navigate to="/portal" replace />;
};

export default Admin;
