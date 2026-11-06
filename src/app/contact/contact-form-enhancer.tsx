"use client";

import { useEffect } from "react";

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

// The contact form is static HTML, so this attaches to it after load. Each
// message is saved through /api/contact (admin inbox, rate limit) and emailed
// through Web3Forms. Web3Forms has to be called from the browser: its free plan
// doesn't accept server-side requests. Without a key the form simply posts to
// /api/contact as plain HTML.
export default function ContactFormEnhancer() {
  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>("form.contact-form");
    if (!form || !ACCESS_KEY) return;

    const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const buttonLabel = submitButton?.querySelector("span");
    const originalLabel = buttonLabel?.textContent ?? "";

    const errorText = document.createElement("p");
    errorText.setAttribute("role", "alert");
    errorText.style.cssText = "color:#dc2626;font-size:14px;margin:0;";

    const showError = (message: string) => {
      errorText.textContent = message;
      form.append(errorText);
    };

    const setSending = (sending: boolean) => {
      if (submitButton) submitButton.disabled = sending;
      if (buttonLabel) buttonLabel.textContent = sending ? "Sending..." : originalLabel;
    };

    const sendEmail = async (data: FormData) => {
      const subject = String(data.get("subject") || "").trim();
      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          from_name: "Video Saver for Skool",
          subject: subject || "New contact form message",
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
        }),
      });
      const result = await res.json().catch(() => null);
      return res.ok && result?.success === true;
    };

    const onSubmit = async (event: SubmitEvent) => {
      event.preventDefault();
      errorText.remove();
      setSending(true);

      const data = new FormData(form);
      try {
        const saved = await fetch("/api/contact", { method: "POST", body: data }).catch(() => null);
        if (saved?.status === 429) {
          showError("Too many messages. Please try again later.");
          return;
        }

        const emailed = await sendEmail(data).catch(() => false);
        if (emailed || saved?.ok) {
          window.location.assign("/thank-you");
          return;
        }
        showError("Something went wrong. Please email us at hello@skoolvideosaver.com.");
      } finally {
        setSending(false);
      }
    };

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  return null;
}
