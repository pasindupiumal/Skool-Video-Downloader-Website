"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MessageToggle({ id, read }: { id: string; read: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: !read }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: "4px 10px",
        fontSize: "0.8rem",
        fontWeight: 600,
        borderRadius: "6px",
        cursor: loading ? "not-allowed" : "pointer",
        border: "1px solid #ebecedcc",
        background: read ? "#fff" : "rgba(11,99,255,0.08)",
        color: read ? "#666" : "#0b63ff",
      }}
    >
      {loading ? "..." : read ? "Mark Unread" : "Mark Read"}
    </button>
  );
}
