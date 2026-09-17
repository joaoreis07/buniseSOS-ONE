import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { RegisterForm } from "@/modules/auth/components/register-form";
import { AuthScreen } from "@/shared/brand/auth-screen";

export default function RegisterPage() {
  return (
    <AuthScreen>
      <Card>
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>
            Cadastre sua empresa e comece como ADMIN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </AuthScreen>
  );
}
