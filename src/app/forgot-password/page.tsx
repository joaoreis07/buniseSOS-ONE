import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { ForgotPasswordForm } from "@/modules/auth/components/password-forms";
import { AuthScreen } from "@/shared/brand/auth-screen";

export default function ForgotPasswordPage() {
  return (
    <AuthScreen>
      <Card>
        <CardHeader>
          <CardTitle>Recuperar senha</CardTitle>
          <CardDescription>
            Informe o e-mail da sua conta BusinessOS One
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </AuthScreen>
  );
}
