import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-auth";
import AdminLoginClient from "./admin-login-client";

export const metadata = {
  title: "Admin Login | Skool Video Downloader",
};

export default function AdminLoginPage() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;

  if (verifyAdminSessionToken(token)) {
    redirect("/admin");
  }

  return (
    <>
      <link rel="stylesheet" href="/assets/css/login.css" />
      <AdminLoginClient />
    </>
  );
}
