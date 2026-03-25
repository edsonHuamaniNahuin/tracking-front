import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "@/services/authService";

import { EyeCloseIcon, EyeIcon } from "@/components/icons";
import Label from "@/components/ui/form/Label";
import Input from "@/components/ui/form/input/InputField";
import Checkbox from "@/components/ui/form/input/Checkbox";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";

export default function SignUpForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", lastname: "", email: "", password: "", repeatPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormErrors({});
    setAlert(null);

    try {
      const response = await register(formData);
      if (response.success) {
        setAlert({ type: "success", message: "Cuenta creada exitosamente. Redirigiendo al login..." });
        setTimeout(() => navigate("/signin"), 2000);
      } else {
        setAlert({ type: "error", message: response.message });
      }
    } catch (error) {
      const res = error.response?.data;
      if (res.status === 400 && res?.errors) {
        setFormErrors(res.errors);
      } else {
        setAlert({ type: "error", message: res?.message || "Error al registrar" });
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
            Crear cuenta
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Crea una cuenta para acceder a todas nuestras certificaciones. 🚀
          </p>
        </div>

        {alert && <Alert title={alert.type === "error" ? "Error" : "Éxito"} variant={alert.type} message={alert.message} />}

        <div className="mt-5">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>Nombre <span className="text-error-500">*</span></Label>
                <Input 
                  type="text" 
                  name="name" 
                  placeholder="Nombre" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required={true}
                />
                {formErrors.Name && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.Name[0]}</p>
                )}
              </div>
              <div>
                <Label>Apellido <span className="text-error-500">*</span></Label>
                <Input 
                  type="text" 
                  name="lastname" 
                  placeholder="Apellido" 
                  value={formData.lastname} 
                  onChange={handleChange} 
                  required={true} 
                />
                {formErrors.Lastname && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.Lastname[0]}</p>
                )}
              </div>
            </div>
            <div>
              <Label>Correo electrónico <span className="text-error-500">*</span></Label>
              <Input 
                type="email" 
                name="email" 
                placeholder="Correo" 
                value={formData.email} 
                onChange={handleChange} 
                required={true} 
              />
              {formErrors.Email && (
                <p className="text-sm text-red-500 mt-1">{formErrors.Email[0]}</p>
              )}
            </div>
            <div>
              <Label>Contraseña <span className="text-error-500">*</span></Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  placeholder="Contraseña" 
                  value={formData.password} 
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
              <Label>Confirmar contraseña <span className="text-error-500">*</span></Label>
              <div className="relative">
                <Input 
                  type={showRepeatPassword ? "text" : "password"} 
                  name="repeatPassword" 
                  placeholder="Repetir contraseña" 
                  value={formData.repeatPassword} 
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
            <div className="flex items-center gap-3">
              <Checkbox 
                checked={isChecked} 
                onChange={setIsChecked} 
                required={true} 
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Acepto los <span className="text-brand-500">Términos y Condiciones <span className="text-error-500">*</span></span>.
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Registrando..." : "Crear cuenta"}
            </Button>
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
