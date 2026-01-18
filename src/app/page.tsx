"use client";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Wallet, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { signInWithGoogle, user, loading } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          The Transparency Platform
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          {user ? (
            <Link
              href="/dashboard"
              className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
            >
              <h2 className="mb-3 text-2xl font-semibold">
                Go to Dashboard <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
              </h2>
            </Link>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 font-bold text-lg bg-blue-600 hover:bg-blue-700"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-to-br before:from-transparent before:to-blue-500 before:opacity-10 after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-to-t after:from-blue-700 after:via-blue-800 after:opacity-40 after:blur-2xl before:lg:h-[360px]">
        <div className="z-20 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left gap-8">
            <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
                <Users className="w-8 h-8 mb-2" />
                <h2 className={"mb-3 text-2xl font-semibold"}>Network</h2>
                <p className={"m-0 max-w-[30ch] text-sm opacity-50"}>
                    Visualize your team growth in real-time.
                </p>
            </div>
             <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
                <TrendingUp className="w-8 h-8 mb-2" />
                <h2 className={"mb-3 text-2xl font-semibold"}>Earn</h2>
                <p className={"m-0 max-w-[30ch] text-sm opacity-50"}>
                    Automated income distribution for every new member.
                </p>
            </div>
             <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
                <Wallet className="w-8 h-8 mb-2" />
                <h2 className={"mb-3 text-2xl font-semibold"}>Wallet</h2>
                <p className={"m-0 max-w-[30ch] text-sm opacity-50"}>
                    Transparent wallet with easy withdrawal requests.
                </p>
            </div>
        </div>
      </div>
    </main>
  );
}
