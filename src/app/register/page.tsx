
import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="register-page">
          <div className="register-card">
            <p>Loading registration form...</p>
          </div>
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
