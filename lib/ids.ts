const allowedPrefixes = new Set(["bpr", "rdg", "tsp", "bkg", "prd", "usr"]);
let lastTimestamp = 0;
let sequence = 0;

export function newId(prefix: "bpr" | "rdg" | "tsp" | "bkg" | "prd" | "usr"): string {
  if (!allowedPrefixes.has(prefix)) throw new Error("Invalid ID prefix");
  const now = Date.now();
  sequence = now === lastTimestamp ? sequence + 1 : 0;
  lastTimestamp = now;
  const time = now.toString(36).padStart(9, "0");
  const order = sequence.toString(36).padStart(4, "0");
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 18);
  return `${prefix}_${time}${order}_${random}`;
}
