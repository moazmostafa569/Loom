import { useState, useEffect, useCallback } from "react";
import {
    IconHeart,
    IconMessageCircle,
    IconUserPlus,
    IconAt,
    IconRepeat,
    IconArrowForwardUp,
    IconBellOff,
    IconChecks,
    IconRefresh,
} from "@tabler/icons-react";

import {
    getNotifications,
    getUnreadCount,
    markOneRead,
    markAllRead,
} from "./../../services/notificationsServices";
import "./../../styles/notifications.css";

/* ─── token ─────────────────────────────────────────────────── */
const TOKEN = localStorage.getItem("loom_token") ?? "";

/* ─── type config ────────────────────────────────────────────── */
const TYPE_CONFIG = {
    like: { icon: IconHeart, cls: "like", label: "liked your post" },
    comment: { icon: IconMessageCircle, cls: "comment", label: "commented on your post" },
    reply: { icon: IconArrowForwardUp, cls: "reply", label: "replied to your comment" },
    follow: { icon: IconUserPlus, cls: "follow", label: "started following you" },
    mention: { icon: IconAt, cls: "mention", label: "mentioned you in a post" },
    share: { icon: IconRepeat, cls: "share", label: "shared your post" },
};

/* ─── MOCK DATA (used when token is absent / API returns 401) ── */
const MOCK = [
    {
        _id: "n1", type: "like", isRead: false, createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
        sender: { _id: "u1", name: "Priya Venkat", initials: "PV", color: "lav" },
        post: { _id: "p1", content: "Reminder that \"done\" is better than \"perfect\"…" },
    },
    {
        _id: "n2", type: "comment", isRead: false, createdAt: new Date(Date.now() - 22 * 60000).toISOString(),
        sender: { _id: "u2", name: "Jules Marchetti", initials: "JM", color: "coral" },
        post: { _id: "p1", content: "Reminder that \"done\" is better than \"perfect\"…" },
        comment: { _id: "c1", content: "This is exactly what I needed to hear today 🙌" },
    },
    {
        _id: "n3", type: "follow", isRead: false, createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
        sender: { _id: "u3", name: "Rohan Oduya", initials: "RO", color: "mint" },
    },
    {
        _id: "n4", type: "mention", isRead: true, createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        sender: { _id: "u4", name: "Tariq Khan", initials: "TK", color: "gold" },
        post: { _id: "p2", content: "Shoutout to @mirasolano for the best studio lighting tip…" },
    },
    {
        _id: "n5", type: "reply", isRead: true, createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        sender: { _id: "u5", name: "Ana Novak", initials: "AN", color: "mint" },
        comment: { _id: "c2", content: "Wait — 2700K with a diffuser? I've been doing 4000K this whole time." },
    },
    {
        _id: "n6", type: "like", isRead: true, createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
        sender: { _id: "u6", name: "Sofia Lima", initials: "SL", color: "coral" },
        post: { _id: "p3", content: "New mug glaze test — speckled stoneware with a celadon drip…" },
    },
    {
        _id: "n7", type: "share", isRead: true, createdAt: new Date(Date.now() - 30 * 3600000).toISOString(),
        sender: { _id: "u7", name: "Derek Wu", initials: "DW", color: "lav" },
        post: { _id: "p1", content: "Reminder that \"done\" is better than \"perfect\"…" },
    },
    {
        _id: "n8", type: "follow", isRead: true, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        sender: { _id: "u8", name: "Lena Park", initials: "LP", color: "gold" },
    },
];

/* ─── helpers ────────────────────────────────────────────────── */
function relativeTime(iso) {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function groupByDate(items) {
    const now = Date.now();
    const groups = {};
    items.forEach((n) => {
        const diff = (now - new Date(n.createdAt)) / 1000;
        const key = diff < 86400 ? "Today" : diff < 172800 ? "Yesterday" : "Older";
        if (!groups[key]) groups[key] = [];
        groups[key].push(n);
    });
    return groups;
}

/* ─── Skeleton ───────────────────────────────────────────────── */
function Skeleton() {
    return (
        <>
            {[80, 60, 90, 70].map((w, i) => (
                <div className="notif-skeleton" key={i}>
                    <div className="skel skel-av" />
                    <div className="skel-lines">
                        <div className="skel skel-line" style={{ width: `${w}%` }} />
                        <div className="skel skel-line" style={{ width: "40%" }} />
                    </div>
                </div>
            ))}
        </>
    );
}

/* ─── Single notification row ────────────────────────────────── */
function NotifItem({ notif, onRead, following, onFollow }) {
    const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.like;
    const Icon = cfg.icon;
    const initials = notif.sender?.initials ?? notif.sender?.name?.slice(0, 2).toUpperCase() ?? "??";
    const color = notif.sender?.color ?? "coral";

    function handleClick() {
        if (!notif.isRead) onRead(notif._id);
    }

    return (
        <div className={`notif-item${notif.isRead ? "" : " unread"}`} onClick={handleClick}>
            <div className="notif-avatars">
                <div className={`notif-av av-${color}`}>{initials}</div>
                <div className={`notif-type-icon ${cfg.cls}`}>
                    <Icon size={11} stroke={2} />
                </div>
            </div>

            <div className="notif-content">
                <p className="notif-text">
                    <span className="sender">{notif.sender?.name}</span>{" "}
                    <span>{cfg.label}</span>
                    {notif.post && (
                        <span className="post-preview"> — "{notif.post.content?.slice(0, 48)}…"</span>
                    )}
                </p>
                {notif.comment && (
                    <div className="notif-post-thumb">{notif.comment.content}</div>
                )}
                <div className="notif-time">{relativeTime(notif.createdAt)}</div>
            </div>

            <div className="notif-right">
                {!notif.isRead && <span className="notif-dot" />}
                {notif.type === "follow" && (
                    <button
                        className={`notif-follow-btn${following[notif.sender?._id] ? " following" : ""}`}
                        onClick={(e) => { e.stopPropagation(); onFollow(notif.sender?._id); }}
                    >
                        {following[notif.sender?._id] ? "Following" : "Follow back"}
                    </button>
                )}
            </div>
        </div>
    );
}

/* ─── Switch ─────────────────────────────────────────────────── */
function Switch({ on, onToggle }) {
    return (
        <button className={`n-switch${on ? " on" : ""}`} onClick={onToggle} role="switch" aria-checked={on}>
            <span className="knob" />
        </button>
    );
}

/* ─── Main export ────────────────────────────────────────────── */
const TABS = ["All", "Unread", "Likes", "Comments", "Follows"];

const PREFS = [
    { id: "likes", label: "Likes", sub: "When someone likes your post" },
    { id: "comments", label: "Comments", sub: "Replies and new comments" },
    { id: "follows", label: "Follows", sub: "New followers" },
    { id: "mentions", label: "Mentions", sub: "When someone mentions you" },
];

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [activeTab, setActiveTab] = useState("All");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [following, setFollowing] = useState({});
    const [prefs, setPrefs] = useState({ likes: true, comments: true, follows: true, mentions: false });

    /* fetch notifications */
    const fetchNotifs = useCallback(async (p = 1, replace = true) => {
        setLoading(true);
        try {
            const unreadOnly = activeTab === "Unread";
            let data;
            if (TOKEN) {
                const res = await getNotifications(TOKEN, { unread: unreadOnly, page: p, limit: 10 });
                data = Array.isArray(res.data) ? res.data : [];
                setHasMore(p < (res.pagination?.numberOfPages ?? 1));
            } else {
                await new Promise((r) => setTimeout(r, 600));
                data = MOCK;
                setHasMore(false);
            }
            setNotifications((prev) => replace ? data : [...prev, ...data]);
        } catch {
            setNotifications(MOCK);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    /* fetch unread count */
    const fetchUnread = useCallback(async () => {
        if (!TOKEN) {
            setUnreadCount(MOCK.filter((n) => !n.isRead).length);
            return;
        }
        try {
            const res = await getUnreadCount(TOKEN);
            setUnreadCount(res.data?.unreadCount ?? 0);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { fetchNotifs(1, true); setPage(1); }, [fetchNotifs]);
    useEffect(() => { fetchUnread(); }, [fetchUnread]);

    /* mark one read */
    async function handleMarkOne(id) {
        setNotifications((prev) =>
            prev.map((n) => n._id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        if (TOKEN) {
            try { await markOneRead(TOKEN, id); } catch { /* revert? */ }
        }
    }

    /* mark all read */
    async function handleMarkAll() {
        if (marking) return;
        setMarking(true);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        if (TOKEN) {
            try { await markAllRead(TOKEN); } catch { /* silent */ }
        }
        setMarking(false);
    }

    /* follow back */
    function handleFollow(userId) {
        setFollowing((prev) => ({ ...prev, [userId]: !prev[userId] }));
    }

    /* load more */
    async function loadMore() {
        const next = page + 1;
        setPage(next);
        await fetchNotifs(next, false);
    }

    /* filter by tab */
    const TAB_TYPE_MAP = { Likes: "like", Comments: "comment", Follows: "follow" };
    const safeNotifications = Array.isArray(notifications) ? notifications : [];

    const filtered = safeNotifications.filter((n) => {
        if (activeTab === "Unread") return !n.isRead;
        if (TAB_TYPE_MAP[activeTab]) return n.type === TAB_TYPE_MAP[activeTab];
        return true;
    });

    const TAB_COUNTS = {
        All: safeNotifications.length,
        Unread: safeNotifications.filter((n) => !n.isRead).length,
        Likes: safeNotifications.filter((n) => n.type === "like").length,
        Comments: safeNotifications.filter((n) => n.type === "comment").length,
        Follows: safeNotifications.filter((n) => n.type === "follow").length,
    };

    const grouped = groupByDate(filtered);

    return (
        <div className="notif-layout">
            <main className="notif-main">
                <div className="notif-header">
                    <div className="notif-header-row">
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <h1>Notifications</h1>
                            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                className="notif-mark-all"
                                onClick={() => fetchNotifs(1, true)}
                                aria-label="Refresh notifications"
                            >
                                <IconRefresh size={14} stroke={1.5} />
                            </button>
                            <button
                                className="notif-mark-all"
                                onClick={handleMarkAll}
                                disabled={marking || unreadCount === 0}
                                aria-label="Mark all as read"
                            >
                                <IconChecks size={14} stroke={1.5} />
                                Mark all read
                            </button>
                        </div>
                    </div>

                    <div className="notif-tabs">
                        {TABS.map((tab) => (
                            <div
                                key={tab}
                                className={`notif-tab${activeTab === tab ? " active" : ""}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                                {TAB_COUNTS[tab] > 0 && (
                                    <span className="tab-cnt">{TAB_COUNTS[tab]}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="notif-list">
                    {loading ? (
                        <Skeleton />
                    ) : filtered.length === 0 ? (
                        <div className="notif-empty">
                            <div className="empty-icon"><IconBellOff size={26} stroke={1.5} /></div>
                            <h3>All clear here</h3>
                            <p>When people like, comment, or follow you, it'll show up here.</p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([date, items]) => (
                            <div key={date}>
                                <div className="notif-date-label">{date}</div>
                                {items.map((n) => (
                                    <NotifItem
                                        key={n._id}
                                        notif={n}
                                        onRead={handleMarkOne}
                                        following={following}
                                        onFollow={handleFollow}
                                    />
                                ))}
                            </div>
                        ))
                    )}
                </div>

                {!loading && hasMore && (
                    <div className="notif-load-more">
                        <button className="notif-load-btn" onClick={loadMore}>
                            Load more
                        </button>
                    </div>
                )}
            </main>

            <aside className="notif-side">
                <div className="side-panel">
                    <h3>Activity summary</h3>
                    <div className="side-stat">
                        <span className="lbl">Unread</span>
                        <span className="val coral">{unreadCount}</span>
                    </div>
                    <div className="side-stat">
                        <span className="lbl">Total</span>
                        <span className="val">{notifications.length}</span>
                    </div>
                    <div className="side-stat">
                        <span className="lbl">Likes today</span>
                        <span className="val mint">
                            {notifications.filter((n) => n.type === "like" && (Date.now() - new Date(n.createdAt)) < 86400000).length}
                        </span>
                    </div>
                    <div className="side-stat">
                        <span className="lbl">New followers</span>
                        <span className="val">
                            {notifications.filter((n) => n.type === "follow").length}
                        </span>
                    </div>
                </div>

                <div className="side-panel">
                    <h3>Notification preferences</h3>
                    {PREFS.map((p) => (
                        <div className="notif-pref-row" key={p.id}>
                            <div>
                                <div className="lbl">{p.label}</div>
                                <div className="sub">{p.sub}</div>
                            </div>
                            <Switch
                                on={prefs[p.id]}
                                onToggle={() => setPrefs((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                            />
                        </div>
                    ))}
                </div>
            </aside>
        </div>
    );
}
