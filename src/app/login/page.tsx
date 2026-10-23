import { Card, Notice, PageTitle } from "@/components/ui";
import { STORAGE } from "@/lib/config";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm">
      <PageTitle title="French Daily" subtitle="Write real French every day." />
      {STORAGE === "supabase" ? (
        <Card>
          <LoginForm />
        </Card>
      ) : (
        <Notice tone="accent">
          This copy runs on your computer (STORAGE=file), so there is no login. Just open the app.
        </Notice>
      )}
    </div>
  );
}
