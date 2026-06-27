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
} from "../../services/notificationsServices";
import "../../styles/notifications.css";

const TYPE_CONFIG = {
    like: { icon: IconHeart, cls: "like", label: "liked your post" },
    comment: { icon: IconMessageCircle, cls: "comment", label: "commented on your post" },
    reply: { icon: IconArrowForwardUp, cls: "reply", label: "replied to your comment" },
    follow: { icon: IconUserPlus, cls: "follow", label: "started following you" },
    mention: { icon: IconAt, cls: "mention", label: "mentioned you in a post" },
    share: { icon: IconRepeat, cls: "share", label: "shared your post" },
};

const TABS = ["All", "Unread", "Likes", "Comments", "Follows"];
const TAB_TYPE_MAP = { Likes: "like", Comments: "comment", Follows: "follow" };

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

export default function NotificationsPanel({ token, unreadCount, onUnreadCountChange, panelRef }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [activeTab, setActiveTab] = useState("All");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [following, setFollowing] = useState({});

    const fetchNotifs = useCallback(async (p = 1, replace = true) => {
        setLoading(true);
        try {
            let data;
            if (token) {
                const unreadOnly = activeTab === "Unread";
                const res = await getNotifications(token, { unread: unreadOnly, page: p, limit: 8 });
                data = Array.isArray(res.data) ? res.data : [];
                setHasMore(p < (res.pagination?.numberOfPages ?? 1));
            } else {
                await new Promise((resolve) => setTimeout(resolve, 500));
                data = [];
                setHasMore(false);
            }
            setNotifications((prev) => replace ? data : [...prev, ...data]);
        } catch {
            setNotifications([]);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [activeTab, token]);

    const fetchUnread = useCallback(async () => {
        if (!token) {
            onUnreadCountChange?.(0);
            return;
        }
        try {
            const res = await getUnreadCount(token);
            onUnreadCountChange?.(res.data?.unreadCount ?? 0);
        } catch {
            onUnreadCountChange?.(0);
        }
    }, [onUnreadCountChange, token]);

    useEffect(() => {
        fetchNotifs(1, true);
    }, [fetchNotifs]);

    useEffect(() => {
        fetchUnread();
    }, [fetchUnread]);

    function handleMarkOne(id) {
        setNotifications((prev) =>
            prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        onUnreadCountChange?.((prevCount) => Math.max(0, (typeof prevCount === "number" ? prevCount : unreadCount) - 1));
        if (token) {
            markOneRead(token, id).catch(() => { /* ignore */ });
        }
    }

    async function handleMarkAll() {
        if (marking) return;
        setMarking(true);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        onUnreadCountChange?.(0);
        if (token) {
            try {
                await markAllRead(token);
            } catch {
                /* ignore */
            }
        }
        setMarking(false);
    }

    function handleFollow(userId) {
        setFollowing((prev) => ({ ...prev, [userId]: !prev[userId] }));
    }

    async function loadMore() {
        const nextPage = page + 1;
        setPage(nextPage);
        await fetchNotifs(nextPage, false);
    }

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
        <div ref={panelRef} className="notif-panel open">
            <div className="notif-panel-inner">
                <div className="notif-panel-header">
                    <div className="notif-panel-title-row">
                        <div>
                            <h2>Notifications</h2>
                            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                        </div>
                        <button
                            className="notif-mark-all"
                            onClick={handleMarkAll}
                            disabled={marking || unreadCount === 0}
                            aria-label="Mark all notifications as read"
                        >
                            <IconChecks size={14} stroke={1.5} />
                            Mark all read
                        </button>
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
                <div className="notif-panel-list">
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
                    {!loading && hasMore && (
                        <div className="notif-load-more">
                            <button className="notif-load-btn" onClick={loadMore}>
                                Load more
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
