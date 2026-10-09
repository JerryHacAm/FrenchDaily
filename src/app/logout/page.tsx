import { Button, Card, PageTitle } from "@/components/ui";
import { signOutAction } from "../login/actions";

// A page with a button (not a link that signs out on load), so link previews
// and prefetching can never sign anyone out by accident.
export default function LogoutPage() {
  return (
    <div className="mx-auto max-w-sm">
      <PageTitle title="Sign out" />
      <Card>
        <form action={signOutAction}>
          <Button type="submit" className="w-full">
            Sign out
          </Button>
        </form>
      </Card>
    </div>
  );
}
