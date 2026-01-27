/**
 * Registration Page
 */

import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import Link from "next/link";

function RegisterContent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-dark px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-white">Cortex Lattice</h1>
          </Link>
          <p className="mt-2 text-gray-400">Create your account</p>
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-6">
          <GoogleSignInButton />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-900/50 px-4 text-gray-500">or sign up with email</span>
            </div>
          </div>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-surface-dark"><div className="text-gray-400">Loading...</div></div>}>
      <RegisterContent />
    </Suspense>
  );
}
