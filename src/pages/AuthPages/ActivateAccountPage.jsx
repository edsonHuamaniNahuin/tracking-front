import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Loader from "@/components/ui/loader/Loader";
import Button from "@/components/ui/button/Button";
import { ErrorIcon, CheckIcon } from "@/components/icons";

import { activateAccount } from "@/services/authService";

export default function ActivateAccountPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            return;
        }

        const activate = async () => {
            try {
                const response = await activateAccount({ token });
                if(response.success) {
                    setStatus("success");
                } else {
                    setStatus("error");
                }
            } catch (error) {
                setStatus("error");
            }
        };

        activate();
    }, [token, navigate]);

    return (
        <div className="flex flex-col flex-1 justify-center gap-8">
            {status === "loading" && (
                <>
                    <div className="flex flex-col items-center justify-center mb-4 w-full max-w-md mx-auto gap-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Activando tu cuenta
                        </h2>
                        <Loader />
                        <p className="mt-4 text-sm text-gray-500">
                            Estamos verificando tu información y activando tu cuenta...
                        </p>
                    </div>
                </>
            )}

            {status === "error" && (
                <>
                    <div className="flex flex-col items-center justify-center mb-4 w-full max-w-md mx-auto gap-4">
                        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                            Error de activación
                        </h2>
                        <div className="flex justify-center">
                            <ErrorIcon className="w-8 h-8 text-red-600" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No pudimos activar tu cuenta
                        </p>
                    </div>
                    <div className="flex justify-center gap-3">
                        <Button variant="primary" onClick={() => window.location.reload()}>
                            Intentar nuevamente
                        </Button>
                        <Button variant="outline" onClick={() => (window.location.href = "mailto:soporte@zonatech.org.pe")}>
                            Contactar soporte
                        </Button>
                    </div>
                </>
            )}

            {status === "success" && (
                <>
                    <div className="flex flex-col items-center justify-center mb-4 w-full max-w-md mx-auto gap-4">
                        <h2 className="text-lg font-semibold text-green-600 dark:text-green-400">
                            ¡Cuenta activada con éxito!
                        </h2>
                        <div className="flex justify-center">
                            <CheckIcon className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Tu cuenta ha sido verificada.
                        </p>
                    </div>
                    <div className="flex justify-center gap-3">
                        <Button variant="primary" onClick={() => navigate("/signin")}>
                            Iniciar sesión
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
