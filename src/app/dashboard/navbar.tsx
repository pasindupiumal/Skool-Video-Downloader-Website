"use client";

import React from "react";
import { signOut } from "next-auth/react";
import styles from "./dashboard.module.css";

interface NavbarProps {
  userEmail: string;
  userName?: string | null;
}

export default function DashboardNavbar({ userEmail, userName }: NavbarProps) {
  const displayName = userName || userEmail;

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <a className={styles.navLogo} href="/">
          <img
            src="/assets/images/img_a38993e738.png"
            height={32}
            width={32}
            alt="Skool Video Downloader Logo"
          />
          <span>Skool Video Downloader</span>
        </a>
        <div className={styles.navLinks}>
          <a href="/dashboard" className={styles.navLinkActive}>Dashboard</a>
          <a href="/blog" className={styles.navLink}>Blog</a>
        </div>
        <div className={styles.navUser}>
          <span className={styles.userEmail} title={userEmail}>
            {displayName}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={styles.logoutBtn}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
