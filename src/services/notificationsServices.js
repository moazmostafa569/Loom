/* ─── Loom · Notification API service ──────────────────────────
   Base URL: https://route-posts.routemisr.com
   All requests require Authorization: Bearer <token> header.
---------------------------------------------------------------- */

import axios from "axios";

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
  const res = await axios.get(`${BASE}/notifications`, {
    params: { unread, page, limit },
    headers: authHeaders(token),
  });

  console.log("[getNotifications] response:", res.data);
  return res.data;
}

/**
 * https://route-posts.routemisr.com/notifications?unread=false&page=1&limit=10
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
  const res = await axios.get(`${BASE}/notifications/unread-count`, {
    headers: authHeaders(token),
  });

  console.log("[getUnreadCount] response:", res.data);
  return res.data;
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
  const res = await axios.patch(`${BASE}/notifications/${notificationId}/read`, {}, {
    headers: authHeaders(token),
  });

  console.log("[markOneRead] response:", res.data);
  return res.data;
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
  const res = await axios.patch(`${BASE}/notifications/read-all`, {}, {
    headers: authHeaders(token),
  });

  console.log("[markAllRead] response:", res.data);
  return res.data;
}