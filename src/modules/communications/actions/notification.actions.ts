"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/shared/auth/session";
import {
  markAllNotificationsReadForTenant,
  markNotificationReadForTenant,
} from "@/modules/communications/services/notification.service";

export async function markNotificationReadAction(
  formData: FormData,
): Promise<void> {
  const user = await requirePermission("notifications:view");
  const notificationId = String(formData.get("notificationId") || "");
  if (!notificationId) return;
  try {
    await markNotificationReadForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      notificationId,
    });
    revalidatePath("/app");
    revalidatePath("/app/notifications");
  } catch {
    return;
  }
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requirePermission("notifications:view");
  try {
    await markAllNotificationsReadForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
    });
    revalidatePath("/app");
    revalidatePath("/app/notifications");
  } catch {
    return;
  }
}
