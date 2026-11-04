import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-auth";
import PublishArticleClient from "./publish-client";

export default function PublishArticlePage() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;

  if (!verifyAdminSessionToken(token)) {
    redirect("/admin/login");
  }

  return <PublishArticleClient />;
}
