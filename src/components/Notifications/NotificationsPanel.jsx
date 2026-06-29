import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    IconHeart,
    IconMessageCircle,
    IconUserPlus,
    IconAt,
    IconRepeat,
    IconArrowForwardUp,
    IconBell,
    IconBellOff,
    IconChecks,
} from "@tabler/icons-react";
import {
    getNotifications,
    getUnreadCount,
    markOneRead,
    markAllRead,
} from "../../services/notificationsServices";
import { getAvatarPhoto } from "../../utils/PostCard";
import "../../styles/notifications.css";

const TYPE_CONFIG = {
    like: { icon: IconHeart, cls: "like", label: "liked your post" },
    comment: { icon: IconMessageCircle, cls: "comment", label: "commented on your post" },
    reply: { icon: IconArrowForwardUp, cls: "reply", label: "replied to your comment" },
    follow: { icon: IconUserPlus, cls: "follow", label: "started following you" },
    mention: { icon: IconAt, cls: "mention", label: "mentioned you in a post" },
    share: { icon: IconRepeat, cls: "share", label: "shared your post" },
};

const DEFAULT_TYPE_CONFIG = {
    icon: IconBell,
    cls: "default",
    label: "interacted with your post",
};

function parseNotificationsList(res) {
    if (Array.isArray(res?.data?.notifications)) return res.data.notifications;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.notifications)) return res.notifications;
    return [];
}

const POST_LINK_TYPES = new Set(["like", "comment", "reply", "mention", "share"]);
function extractPostId(notif) {
    if (!notif || typeof notif !== "object") return null;
    const entity = notif.entity || notif.post || {};
    return (
        entity.entityId ??
        entity._id ??
        entity.id ??
        notif?.entityId ??
        null
    );
}

function extractSenderId(notif) {
    return (
        notif?.actor?._id ??
        notif?.actor?.id ??
        notif?.actor?.userId ??
        notif?.actor?.user?._id ??
        notif?.actor?.user?.id ??
        (typeof notif?.sender === "string" ? notif.sender : null) ??
        notif?.senderId ??
        notif?.sender_id ??
        notif?.sender?._id ??
        notif?.sender?.id ??
        null
    );
}


function getInitials(name, fallback = "??") {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return fallback;
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function getSenderDetails(notif) {
    const sender = notif?.actor || notif?.sender;
    const fallback = {
        id: extractSenderId(notif),
        name: notif?.actor?.name || notif?.sender?.name || "Someone",
        initials: notif?.actor?.name || notif?.sender?.name || "??",
        color: "coral",
        photo: getAvatarPhoto(notif?.actor?.photo || notif?.sender?.photo),
    };

    if (!sender || typeof sender !== "object") return fallback;

    const name = sender.name || sender.fullname || sender.username || "Someone";
    const hasRealName = name !== "Someone";

    return {
        id: extractSenderId(notif),
        name,
        initials: sender.initials || getInitials(hasRealName ? name : "", "??"),
        color: sender.color || "coral",
        photo: getAvatarPhoto(sender.photo || sender.avatar || sender.image),
    };
}

function getPostPreview(post) {
    if (!post || typeof post !== "object") return "";
    const text = post.entity || "";
    return text ? text.slice(0, 48) : "";
}

const TYPE_ALIASES = {
    liked: "like",
    likes: "like",
    like_post: "like",
    commented: "comment",
    comments: "comment",
    comment_post: "comment",
    replied: "reply",
    replies: "reply",
    reply_post: "reply",
    followed: "follow",
    follows: "follow",
    follower: "follow",
    follow: "follow",
    follow_user: "follow",
    followed_you: "follow",
    follow_you: "follow",
    following: "follow",
    mention: "mention",
    mentioned: "mention",
    mentions: "mention",
    mention_post: "mention",
    shared: "share",
    shares: "share",
    share_post: "share",
    repost: "share",
    reposted: "share",
};

const TABS = ["All", "Unread", "Likes", "Comments", "Follows"];
const TAB_TYPE_MAP = { Likes: "like", Comments: "comment", Follows: "follow" };

function normalizeNotificationType(type) {
    const key = String(type ?? "").trim().toLowerCase();
    return TYPE_ALIASES[key] ?? key;
}

function getTypeConfig(type) {
    const normalized = normalizeNotificationType(type);
    return TYPE_CONFIG[normalized] ?? DEFAULT_TYPE_CONFIG;
}

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

function NotifItem({ notif, onRead, following, onFollow, onNavigate, onClose }) {
    const cfg = getTypeConfig(notif.type);
    const normalizedType = normalizeNotificationType(notif.type);
    const Icon = cfg.icon;
    const sender = getSenderDetails(notif);
    const postPreview = getPostPreview(notif.post || notif.entity);
    const initials = sender.initials;
    const color = sender.color;
    const postId = extractPostId(notif);
    const senderId = sender.id || extractSenderId(notif);
    const targetPostId = postId || notif?.entityId || notif?.entity?.Id || notif?.entity?._id || notif?.entity?.id || notif?.post?._id || notif?.post?.id;
    const currentUserId = localStorage.getItem("user-id");
    const isSelfSender = Boolean(currentUserId && senderId && String(senderId) === String(currentUserId));
    const isPostNavigable = POST_LINK_TYPES.has(normalizedType) && Boolean(targetPostId);
    const isFollowNavigable = normalizedType === "follow" && Boolean(senderId);
    const isNavigable = isPostNavigable || isFollowNavigable;

    function handleClick() {
        if (!notif.isRead) onRead(notif._id);

        if (isFollowNavigable) {
            onNavigate?.(isSelfSender ? "/my_profile" : `/user_profile/${senderId}`);
            onClose?.();
            return;
        }

        if (isPostNavigable) {
            onNavigate?.(isSelfSender ? "/my_profile" : `/posts/${targetPostId}`);
            onClose?.();
        }
    }

    return (
        <div
            className={`notif-item${notif.isRead ? "" : " unread"}${isNavigable ? " notif-item--link" : ""}`}
            onClick={handleClick}
            
        >
            <div className="notif-avatars">
                <div className={`notif-av av-${color}`}>
                    {sender.photo ? (
                        <img src={sender.photo} alt={sender.name} />
                    ) : (
                        initials
                    )}
                </div>
                <div className={`notif-type-icon ${cfg.cls}`}>
                    <Icon size={11} stroke={2} />
                </div>
            </div>
            <div className="notif-content">
                <p className="notif-text">
                    <span className="sender">{sender.name}</span>{" "}
                    <span>{notif.type}</span>
                    {postPreview && <span className="post-preview"> - "{postPreview}..."</span>}
                    {false && postPreview && (
                        <span className="post-preview"> — "{notif.entity.body?.slice(0, 48)}…"</span>
                    )}
                </p>
                {notif.comment && (
                    <div className="notif-post-thumb">{notif.comment.content}</div>
                )}
                <div className="notif-time">{relativeTime(notif.createdAt)}</div>
            </div>
            <div className="notif-right">
                {!notif.isRead && <span className="notif-dot" />}
                {normalizedType === "follow" && (
                    <button
                        className={`notif-follow-btn${following[senderId] ? " following" : ""}`}
                        onClick={(e) => { e.stopPropagation(); onFollow(senderId); }}
                    >
                        {following[senderId] ? "Following" : "Follow back"}
                    </button>
                )}
            </div>
        </div>
    );
}

export default function NotificationsPanel({ token, unreadCount, onUnreadCountChange, panelRef, onClose }) {
    const navigate = useNavigate();
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
                const res = await getNotifications(token, { unread: false, page: p, limit: 8 });
                data = parseNotificationsList(res);
                const pagination = res?.meta?.pagination ?? res?.pagination ?? null;
                setHasMore(p < (pagination?.numberOfPages ?? 1));
            } else {
                await new Promise((resolve) => setTimeout(resolve, 500));
                data = [];
                setHasMore(false);
            }
            setNotifications((prev) => (replace ? data : [...prev, ...data]));
        } catch {
            if (replace) {
                setNotifications([]);
            }
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [token]);

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
        const tabType = TAB_TYPE_MAP[activeTab];
        if (tabType) return normalizeNotificationType(n.type) === tabType;
        return true;
    });

    const TAB_COUNTS = {
        All: safeNotifications.length,
        Unread: safeNotifications.filter((n) => !n.isRead).length,
        Likes: safeNotifications.filter((n) => normalizeNotificationType(n.type) === "like").length,
        Comments: safeNotifications.filter((n) => normalizeNotificationType(n.type) === "comment").length,
        Follows: safeNotifications.filter((n) => normalizeNotificationType(n.type) === "follow").length,
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
                            <div  key={date}>
                                <div   className="notif-date-label">{date}</div>
                                {items.map((n) => (
                                    <NotifItem
                                        key={n._id}
                                        notif={n}
                                        onRead={handleMarkOne}
                                        following={following}
                                        onFollow={handleFollow}
                                        onNavigate={navigate}
                                        onClose={onClose}
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
