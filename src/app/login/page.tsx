import React, { Suspense } from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginClient from "./login-client";

export const metadata = {
  title: 'Login | Video Saver for Skool',
  description: 'Log in to manage your Video Saver for Skool license and downloads.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: false },
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
        <LoginClient />
      </Suspense>
    </>
  );
}

