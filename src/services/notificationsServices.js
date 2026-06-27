/* ─── Loom · Notification API service ──────────────────────────
   Base URL: https://route-posts.routemisr.com
   All requests require Authorization: Bearer <token> header.
---------------------------------------------------------------- */

const BASE = "https://route-posts.routemisr.com";

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * 1. GET /notifications
 *    Returns a paginated list of notifications.
 *
 *    Response shape:
 *    {
 *      status: "success",
 *      results: number,
 *      pagination: { currentPage, numberOfPages, limit },
 *      data: Notification[]
 *    }
 *
 *    Notification shape:
 *    {
 *      _id: string,
 *      recipient: string,
 *      sender: { _id, name, photo },
 *      type: "like" | "comment" | "reply" | "follow" | "mention" | "share",
 *      post?: { _id, content },
 *      comment?: { _id, content },
 *      isRead: boolean,
 *      createdAt: string (ISO)
 *    }
 */
export async function getNotifications(token, { unread = false, page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({ unread: String(unread), page: String(page), limit: String(limit) });
  const res = await fetch(`${BASE}/notifications?${params}`, {
    method: "GET",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`getNotifications failed: ${res.status}`);
  return res.json();
}

/**
 * 2. GET /notifications/unread-count
 *    Returns the number of unread notifications.
 *
 *    Response shape:
 *    {
 *      status: "success",
 *      data: { unreadCount: number }
 *    }
 */
export async function getUnreadCount(token) {
  const res = await fetch(`${BASE}/notifications/unread-count`, {
    method: "GET",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`getUnreadCount failed: ${res.status}`);
  return res.json();
}

/**
 * 3. PATCH /notifications/:id/read
 *    Marks a single notification as read.
 *
 *    Response shape:
 *    {
 *      status: "success",
 *      data: Notification   // updated notification
 *    }
 */
export async function markOneRead(token, notificationId) {
  const res = await fetch(`${BASE}/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`markOneRead failed: ${res.status}`);
  return res.json();
}

/**
 * 4. PATCH /notifications/read-all
 *    Marks all notifications as read.
 *
 *    Response shape:
 *    {
 *      status: "success",
 *      message: "All notifications marked as read"
 *    }
 */
export async function markAllRead(token) {
  const res = await fetch(`${BASE}/notifications/read-all`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`markAllRead failed: ${res.status}`);
  return res.json();
}