import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "@/services/authService";

import Label from "@/components/ui/form/Label";
import Input from "@/components/ui/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";

export default function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    setFormErrors({});

    try {
      const response = await forgotPassword({email});
      if (response.success) {
        setAlert({ type: "success", message: "Correo enviado. Revisa tu bandeja de entrada." });
        setTimeout(() => navigate("/signin"), 2000);
      } else {
        setAlert({ type: "error", message: response.message });
      }
    } catch (error) {
      const res = error.response?.data;
      if (res.status === 400 && res?.errors) {
        setFormErrors(res.errors);
      } else {
        setAlert({ type: "error", message: res?.message || "Error al enviar el correo." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <h1 className="mb-2 font-semibold text-gray-800 dark:text-white/90 text-title-md">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ingresa tu correo electrónico para recibir un enlace de restablecimiento. 📧
          </p>
        </div>

        {alert && <Alert title={alert.type === "error" ? "Error" : "Éxito"} variant={alert.type} message={alert.message} />}

        <div className="mt-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Label>Correo electrónico</Label>
            <Input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required={true} />
            {formErrors.Email && (
              <p className="text-sm text-red-500 mt-1">{formErrors.Email[0]}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Enviando..." : "Enviar enlace"}</Button>
          </form>
        </div>

        <div className="mt-5">
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            ¿Ya tienes cuenta? <Link to="/signin" className="text-brand-500">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
