export const formatCurrency = (n: number, opts?: { maximumFractionDigits?: number }) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: opts?.maximumFractionDigits ?? 0,
  });

export const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

export const formatNumber = (n: number) => n.toLocaleString("en-US");
