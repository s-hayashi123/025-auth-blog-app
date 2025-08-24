import { Session } from "next-auth";
import Link from "next/link";
import SignInButton from "./SignInButton"; // 後で作成
import SignOutButton from "./SignOutButton"; // 後で作成

export default function Header({ session }: { session: Session | null }) {
  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Auth Blog
        </Link>
        <div>
          {session ? (
            <div className="flex items-center gap-4">
              <p>Welcome, {session.user?.name}</p>
              <SignOutButton />
            </div>
          ) : (
            <SignInButton />
          )}
        </div>
      </nav>
    </header>
  );
}
