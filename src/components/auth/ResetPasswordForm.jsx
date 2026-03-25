import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "@/services/authService";

import { EyeCloseIcon, EyeIcon } from "@/components/icons";
import Label from "@/components/ui/form/Label";
import Input from "@/components/ui/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";

export default function ResetPasswordForm({token}) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", repeatPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormErrors({});
    setAlert(null);

    if (form.password !== form.repeatPassword) {
      setAlert({ type: "error", message: "Las contraseñas no coinciden." });
      setLoading(false);
      return;
    }

    try {
      var response = await resetPassword(token, form);
      if (response.success) {
        setAlert({ type: "success", message: "Contraseña actualizada. Redirigiendo..." });
        setTimeout(() => navigate("/signin"), 2000);
      } else {
        setAlert({ type: "error", message: response.message });
      }
    } catch (error) {
      const res = error.response?.data;
      if (res.status === 400 && res?.errors) {
        setFormErrors(res.errors);
      } else {
        setAlert({ type: "error", message: res?.message || "Error al actualizar la contraseña." });
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
            Restablecer contraseña
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ingresa tu nueva contraseña para continuar. 🔑
          </p>
        </div>

        {alert && <Alert title={alert.type === "error" ? "Error" : "Éxito"} variant={alert.type} message={alert.message} />}

        <div className="mt-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Nueva Contraseña</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  placeholder="Nueva contraseña" 
                  value={form.password} 
                  onChange={handleChange} 
                  required={true} 
                />
                <span onClick={() => setShowPassword(!showPassword)} className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeIcon className="size-5" /> : <EyeCloseIcon className="size-5" />}
                </span>
              </div>
              {formErrors.Password && (
                <p className="text-sm text-red-500 mt-1">{formErrors.Password[0]}</p>
              )}
            </div>
            <div>
              <Label>Confirmar Contraseña</Label>
              <div className="relative">
                <Input 
                  type={showRepeatPassword ? "text" : "password"} 
                  name="repeatPassword"
                  placeholder="Confirma tu contraseña" 
                  value={form.repeatPassword} 
                  onChange={handleChange} 
                  required={true}
                />
                <span onClick={() => setShowRepeatPassword(!showRepeatPassword)} className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2">
                  {showRepeatPassword ? <EyeIcon className="size-5" /> : <EyeCloseIcon className="size-5" />}
                </span>
              </div>
              {formErrors.RepeatPassword && (
                <p className="text-sm text-red-500 mt-1">{formErrors.RepeatPassword[0]}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Restableciendo..." : "Restablecer contraseña"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}