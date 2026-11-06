// After login or sign-up, a user who arrived via a pricing button
// (?plan=monthly|lifetime) goes straight back to checkout for that plan.
// Returns true when the browser is being redirected to checkout.
export async function resumeCheckout(plan: string | null): Promise<boolean> {
  if (!plan) return false;

  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
      return true;
    }
  } catch (err) {
    console.error("Failed to resume checkout:", err);
  }
  return false;
}
