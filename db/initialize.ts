import { getD1BindingAsync } from "@/db";

export async function initializeDatabase() {
  const db = await getD1BindingAsync();
  await db.batch([
    db.prepare("CREATE INDEX IF NOT EXISTS readings_user_created_idx ON readings(user_id, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS readings_owner_id_idx ON readings(user_id, id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS tarot_specialists_sort_idx ON tarot_specialists(sort_order)"),
    db.prepare("PRAGMA optimize"),
  ]);
}
