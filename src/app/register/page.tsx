import React, { Suspense } from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import RegisterClient from "./register-client";

export const metadata = {
  title: 'Sign Up | Video Saver for Skool',
  description: 'Create your account.',
};

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <>
      <link rel="stylesheet" href="/assets/css/login.css" />
      <Suspense fallback={null}>
        <RegisterClient />
      </Suspense>
    </>
  );
}
