import { Suspense } from "react";
import AuthPage from "../../components/sac-co-do/AuthPage";

export const metadata = {
  title: "Đăng nhập | Sắc Cố Đô",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AuthPage />
    </Suspense>
  );
}
