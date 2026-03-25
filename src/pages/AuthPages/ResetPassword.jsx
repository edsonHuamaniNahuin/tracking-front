import { useParams } from "react-router-dom";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";

export default function ResetPassword() {
  const { token } = useParams();
  return (
    <>
      <ResetPasswordForm token={token} />
    </>
  );
}
