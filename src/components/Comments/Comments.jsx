import { useState, useRef, useEffect, useMemo, useContext } from "react";
import {
  IconArrowUp,
  IconHeart,
  IconMessageCircle,
  IconDotsVertical,
  IconMoodSmile,
  IconArrowsSort,
} from "@tabler/icons-react";
import EmojiPicker from "emoji-picker-react";
import { useNavigate } from "react-router-dom";

import "./../../styles/comments.css";
import { formatPostTime, getAvatarPhoto, getInitials, handleAddComment } from "../../utils/PostCard";
import { createReply, deleteComment, getReplies, ReactComment, UpdateComment } from "../../services/AllComents";
import { List } from "./CommentsSkeleton/CommentsSkeleton";
import { getStoredUserId } from "../../utils/UserDetails";
import { AuthContext } from "../../context/Authcontext";
const avatarColors = ["coral", "mint", "gold", "lav"];



function getColorFromId(value) {
  const text = String(value || "comment");
  const total = text.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarColors[total % avatarColors.length];
}

function getLikesCount(comment) {
  if (Array.isArray(comment?.likes)) return comment.likes.length;
  return Number(comment?.likesCount ?? comment?.likes ?? comment?.likes_count ?? 0) || 0;
}

function getCommentLiked(comment, currentUserId = getStoredUserId()) {
  if (comment?.liked !== undefined) return Boolean(comment.liked);
  if (comment?.isLiked !== undefined) return Boolean(comment.isLiked);
  if (comment?.isLikedByMe !== undefined) return Boolean(comment.isLikedByMe);

  if (Array.isArray(comment?.likes) && currentUserId) {
    return comment.likes.some((like) => {
      const id = typeof like === "string" ? like : like?._id || like?.id || like?.userId || like?.user?._id;
      return id && String(id) === String(currentUserId);
    });
  }

  return false;
}

function commentHasLikeField(comment) {
  if (!comment) return false;
  return comment.liked !== undefined || comment.isLiked !== undefined;
}

function unwrapLikeResponse(response) {
  return response?.comment ?? response?.data?.comment ?? response?.data ?? response;
}

function getCommentUser(comment) {
  return comment?.commentCreator || comment?.user || comment?.createdBy || comment?.author || {};
}

function getHandle(user, name) {
  const fallback = String(name || "user")
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase()
    .replace(/[^\w]/g, "");

  return user?.username || user?.handle || user?.email?.split("@")[0] || fallback || "user";
}

function getCommentCreatorId(comment) {
  const creator = comment?.commentCreator;

  if (typeof creator === "string") return creator;
  if (creator?._id) return creator._id;
  if (creator?.id) return creator.id;

  return (
    comment?.user?._id || comment?.user?.id ||
    comment?.createdBy?._id || comment?.createdBy?.id ||
    comment?.author?._id || comment?.author?.id ||
    null
  );
}

function isOwnedByCurrentUser(comment, currentUserId) {
  if (!currentUserId) return false;

  const creatorId = getCommentCreatorId(comment);
  return Boolean(creatorId && String(creatorId) === String(currentUserId));
}

function getAvatarUrl(user) {
  return getAvatarPhoto(user?.photo || user?.avatar || user?.image);
}


function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCommentText(value) {
  return escapeHtml(value).replace(/@(\w+)/g, '<span class="mention">@$1</span>');
}

function normalizeComment(comment, index, currentUserId = getStoredUserId()) {
  const user = getCommentUser(comment);
  const originalId = comment?._id || comment?.id || `comment-${index}`;
  const name = user?.name || comment?.name || "Unknown User";
  const createdAt = comment?.createdAt || comment?.created_at || comment?.date || "";
  const replies = Array.isArray(comment?.replies)
    ? comment.replies.map((reply, replyIndex) => normalizeComment(reply, replyIndex, currentUserId))
    : [];

  const isMine = isOwnedByCurrentUser(comment, currentUserId);
  const liked = getCommentLiked(comment, currentUserId);

  return {
    id: originalId,
    originalId,
    rawComment: comment,
    name,
    handle: getHandle(user, name),
    initials: getInitials(name),
    color: comment?.color || getColorFromId(originalId),
    avatarUrl: getAvatarUrl(user),
    userId: getCommentCreatorId(comment),
    time: formatPostTime(createdAt),
    timestamp: createdAt ? new Date(createdAt).getTime() || 0 : 0,
    text: comment?.content || comment?.body || comment?.text || "",
    likes: getLikesCount(comment),
    liked,
    isAuthor: Boolean(comment?.isAuthor || comment?.isAuthorComment),
    isMine,
    replies,
  };
}


/* ─── Avatar ───────────────────────────────────────────────── */
function Avatar({ initials, color = "coral", small = false, src = "", name = "User", onClick }) {
  const clickableProps = onClick
    ? {
        role: "button",
        tabIndex: 0,
        onClick,
        onKeyDown: (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
          }
        },
      }
    : {};

  return (
    <div className={`av av--${color}${small ? " av--sm" : ""}${onClick ? " av--clickable" : ""}`} {...clickableProps}>
      {src ? <img src={src} alt={name} /> : initials}
    </div>
  );
}

/* ─── Single reply ─────────────────────────────────────────── */
function Reply({ reply, currentUserId, postId, onAvatarClick }) {
  const replyId = reply.originalId ?? reply.id;
  const [liked, setLiked] = useState(() => getCommentLiked(reply.rawComment ?? reply, currentUserId));
  const [likes, setLikes] = useState(() => getLikesCount(reply));
  const prevReplyIdRef = useRef(replyId);
  const isOwner = isOwnedByCurrentUser(reply.rawComment ?? reply, currentUserId);

  useEffect(() => {
    if (String(prevReplyIdRef.current) !== String(replyId)) {
      prevReplyIdRef.current = replyId;
      setLiked(getCommentLiked(reply.rawComment ?? reply, currentUserId));
      setLikes(getLikesCount(reply));
    }
  }, [replyId, reply, currentUserId]);

  async function sendLike() {
    if (!postId || !replyId) return;

    const wasLiked = liked;
    const prevLikes = likes;

    setLiked(!wasLiked);
    setLikes(Math.max(0, prevLikes + (wasLiked ? -1 : 1)));

    try {
      const response = await ReactComment(postId, replyId);
      const payload = unwrapLikeResponse(response);
      const hasLikeInResponse = commentHasLikeField(payload);
      const hasLikesInResponse =
        payload &&
        (payload.likesCount !== undefined ||
          payload.likes_count !== undefined ||
          Array.isArray(payload.likes));
      const nextLiked = hasLikeInResponse
        ? getCommentLiked(payload, currentUserId)
        : !wasLiked;
      const nextLikes = hasLikesInResponse
        ? getLikesCount(payload)
        : Math.max(0, prevLikes + (wasLiked ? -1 : 1));

      setLiked(nextLiked);
      setLikes(nextLikes);
    } catch (error) {
      console.error(error);
      setLiked(wasLiked);
      setLikes(prevLikes);
    }
  }

  return (
    <div className="comment">
      <div className="comment__rail">
        <Avatar
          initials={reply.initials}
          color={reply.color}
          small
          src={reply.avatarUrl}
          name={reply.name}
          onClick={reply.userId ? () => onAvatarClick?.(reply.userId) : undefined}
        />
        <div className="comment__line comment__line--hidden" />
      </div>

      <div className="comment__body">
        <div className="comment__meta">
          <span className="comment__name">{reply.name}</span>
          <span className="comment__handle">@{reply.handle}</span>
          <span className="comment__time">· {reply.time}</span>
          {reply.isAuthor && (
            <span className="comment__badge comment__badge--mint">Author</span>
          )}
        </div>

        <p
          className="comment__text"
          dangerouslySetInnerHTML={{
            __html: formatCommentText(reply.text),
          }}
        />

        <div className="comment__actions">
          <button
            className={`comment__action${liked ? " liked" : ""}`}
            onClick={sendLike}
            aria-label={liked ? "Unlike" : "Like"}
            aria-pressed={liked}
          >
            <IconHeart size={15} stroke={1.5} fill={liked ? "currentColor" : "none"} />
            {likes > 0 && <span>{likes}</span>}
          </button>
          <button className="comment__action" aria-label="Reply">
            <IconMessageCircle size={15} stroke={1.5} />
            Reply
          </button>
          {isOwner && (
            <button className="comment__more comment__more--mine" aria-label="More options">
              <IconDotsVertical />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Single comment ───────────────────────────────────────── */
function Comment({ comment, currentUserId, currentUserAvatar, isLast, onReplyClick, onReplySubmit, onCommentUpdated, activeReplies = [], postId, onFetchReplies, onAvatarClick }) {
  const [liked, setLiked] = useState(() => getCommentLiked(comment.rawComment ?? comment, currentUserId));
  const [likes, setLikes] = useState(() => getLikesCount(comment));
  const [replyingTo, setReplyingTo] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  const replyRef = useRef(null);
  const replyEmojiPickerRef = useRef(null);
  const editRef = useRef(null);
  const [commentState, setCommentState] = useState(comment);
  const replies = Array.isArray(commentState.replies) ? commentState.replies : [];
  const repliesToShow = activeReplies.length ? activeReplies : replies;
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(comment.text);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const isOwner = isOwnedByCurrentUser(comment.rawComment ?? comment, currentUserId);
  const commentId = comment.originalId ?? comment.id;
  const prevCommentIdRef = useRef(commentId);

  useEffect(() => {
    setEditedText(comment.text);

    if (String(prevCommentIdRef.current) !== String(commentId)) {
      prevCommentIdRef.current = commentId;
      setLiked(getCommentLiked(comment.rawComment ?? comment, currentUserId));
      setLikes(getLikesCount(comment));
      setCommentState(comment);
      return;
    }

    setCommentState((prev) => ({
      ...comment,
      liked: prev.liked,
      likes: prev.likes,
    }));
  }, [commentId, comment, currentUserId]);

  useEffect(() => {
    if (activeReplies.length > 0) {
      setRepliesOpen(true);
    }
  }, [activeReplies.length]);

  useEffect(() => {
    if (!showDropdown) return;

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  useEffect(() => {
    if (!showReplyEmojiPicker) return;

    function handleClickOutside(event) {
      if (replyEmojiPickerRef.current?.contains(event.target)) return;
      setShowReplyEmojiPicker(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showReplyEmojiPicker]);


  async function sendLike() {
    if (!postId) return;
    const commentId = commentState.originalId ?? commentState.id;
    if (!commentId) return;

    const wasLiked = liked;
    const prevLikes = likes;

    setLiked(!wasLiked);
    setLikes(Math.max(0, prevLikes + (wasLiked ? -1 : 1)));

    try {
      const response = await ReactComment(postId, commentId);
      const payload = unwrapLikeResponse(response);
      const optimisticLikes = Math.max(0, prevLikes + (wasLiked ? -1 : 1));
      const hasLikeInResponse = commentHasLikeField(payload);
      const hasLikesInResponse =
        payload &&
        (payload.likesCount !== undefined ||
          payload.likes_count !== undefined ||
          Array.isArray(payload.likes));
      const nextLiked = hasLikeInResponse
        ? getCommentLiked(payload, currentUserId)
        : !wasLiked;
      const nextLikes = hasLikesInResponse ? getLikesCount(payload) : optimisticLikes;

      setLiked(nextLiked);
      setLikes(nextLikes);
      setCommentState((prev) => ({
        ...prev,
        liked: nextLiked,
        likes: nextLikes,
        rawComment: prev.rawComment
          ? {
              ...prev.rawComment,
              liked: nextLiked,
              isLiked: nextLiked,
              likesCount: nextLikes,
            }
          : prev.rawComment,
      }));
    } catch (error) {
      console.error(error);
      setLiked(wasLiked);
      setLikes(prevLikes);
    }
  }


  async function handleDeleteComment() {
    if (!postId) return;
    const commentId = commentState.originalId ?? commentState.id;
    if (!commentId) return;

    setIsLoading(true);
    try {
      const result = await deleteComment(postId, commentId);
      const deleted =
        result?.success ||
        String(result?.message || "").toLowerCase().includes("deleted") ||
        result?.data === null ||
        (!result && result !== undefined);

      if (deleted) {
        setShowDropdown(false);
        onCommentUpdated?.();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setIsLoading(false);
    }
  }


  function startEditing() {
    setEditedText(commentState.text);
    setError(null);
    setIsEditing(true);
    setShowDropdown(false);
    setTimeout(() => editRef.current?.focus(), 80);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditedText(commentState.text);
    setError(null);
  }

  async function saveEdit() {
    const trimmed = editedText.trim();
    const commentId = commentState.originalId ?? commentState.id;

    if (!postId || !commentId || !trimmed) return;
    if (trimmed === commentState.text) {
      cancelEditing();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await UpdateComment(postId, commentId, { content: trimmed });
      setCommentState((prev) => ({ ...prev, text: trimmed }));
      setIsEditing(false);
      onCommentUpdated?.();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors ||
        err.message ||
        "Failed to update comment";
      setError(typeof message === "string" ? message : "Failed to update comment");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReplyClick() {
    setRepliesOpen(true);
    setReplyingTo(true);
    const commentId = comment.originalId ?? comment.id;
    onReplyClick?.(commentId);
    setTimeout(() => replyRef.current?.focus(), 80);
  }

  function handleReplyEmojiClick(emojiData) {
    setReplyText((prev) => `${prev}${emojiData.emoji}`);
    replyRef.current?.focus();
  }

  return (
    <div className="comment">
      <div className="comment__rail">
        <Avatar
          initials={comment.initials}
          color={comment.color}
          src={comment.avatarUrl}
          name={comment.name}
          onClick={comment.userId ? () => onAvatarClick?.(comment.userId) : undefined}
        />
        <div className={`comment__line${isLast && !repliesOpen ? " comment__line--hidden" : ""}`} />
      </div>

      <div className="comment__body">
        <div className="comment__meta">
          <span className="comment__name">{comment.name}</span>
          <span className="comment__handle">@{comment.handle}</span>
          <span className="comment__time">· {comment.time}</span>
          {comment.isAuthor && (
            <span className="comment__badge comment__badge--mint">Author</span>
          )}
        </div>

        {isEditing ? (
          <div className="comments__compose" style={{ paddingTop: 8 }}>
            <textarea
              ref={editRef}
              className="comments__input"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={3}
              aria-label="Edit comment"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="comments__compose-foot">
              <div />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="comment__action"
                  onClick={cancelEditing}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="comments__submit"
                  disabled={!editedText.trim() || isLoading}
                  onClick={saveEdit}
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p
            className="comment__text"
            dangerouslySetInnerHTML={{
              __html: formatCommentText(commentState.text),
            }}
          />
        )}

        <div className="comment__actions">
          <button
            className={`comment__action${liked ? " liked" : ""}`}
            onClick={sendLike}
            aria-label={liked ? "Unlike" : "Like"}
            aria-pressed={liked}
          >
            <IconHeart size={16} stroke={1.5} fill={liked ? "currentColor" : "none"} />
            {likes > 0 && <span>{likes}</span>}
          </button>

          <button disabled={!comment} className="comment__action disabled:cursor-not-allowed" onClick={handleReplyClick} aria-label="Reply">
            <IconMessageCircle size={16} stroke={1.5} />
            Reply
          </button>

          {isOwner && (
            <div className="comment__more-container" ref={dropdownRef}>
              <button
                className="comment__more comment__more--mine"
                aria-label="More options"
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <IconDotsVertical size={15} />
              </button>
              {showDropdown && (
                <div className="rail__dropdown absolute top-5 right-6 rounded-2xl shadow-lg p-5 z-50">
                  <button
                    type="button"
                    onClick={startEditing}
                    className="rail__dropdown-btn w-full text-left px-4 py-3 cursor-pointer rounded-lg mb-2 transition"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteComment}
                    className="rail__dropdown-btn rail__dropdown-btn--danger w-full text-left px-4 py-3 cursor-pointer rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* inline reply input */}
        {replyingTo && (
          <div className="comments__compose" style={{ paddingTop: 12 }}>
            <Avatar
              initials={currentUserAvatar.initials}
              color={currentUserAvatar.color}
              small
              src={currentUserAvatar.photo}
              name={currentUserAvatar.name}
            />
            <div className="comments__compose-body relative">
              <textarea
                ref={replyRef}
                className="comments__input"
                placeholder={`Reply to @${comment.handle}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
              />
              {showReplyEmojiPicker && (
                <div className="comments__emoji-picker absolute z-50 bottom-0 top-30" ref={replyEmojiPickerRef}>
                  <EmojiPicker onEmojiClick={handleReplyEmojiClick} />
                </div>
              )}
              <div className="comments__compose-foot">
                <div className="comments__compose-icons">
                  <button
                    type="button"
                    aria-label="Add emoji"
                    onClick={() => setShowReplyEmojiPicker((open) => !open)}
                  >
                    <IconMoodSmile size={17} stroke={1.5} />
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="comment__action"
                    onClick={() => { setReplyingTo(false); setReplyText(""); setShowReplyEmojiPicker(false); }}
                  >
                    Cancel
                  </button>
                  <button
                    className="comments__submit"
                    disabled={!replyText.trim()}
                    onClick={async () => {
                      if (!replyText.trim()) return;
                      const commentId = comment.originalId ?? comment.id;
                      try {
                        await onReplySubmit?.(commentId, replyText.trim());
                        setReplyingTo(false);
                        setReplyText("");
                        setShowReplyEmojiPicker(false);
                        setRepliesOpen(true);
                      } catch (error) {
                        console.error("Failed to post reply:", error);
                      }
                    }}
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* replies */}
        {repliesToShow.length > 0 && (
          <div className="comment__replies">
            {!repliesOpen ? (
              <button
                className="comment__toggle-replies"
                onClick={() => setRepliesOpen(true)}
              >
                Show {repliesToShow.length} {repliesToShow.length === 1 ? "reply" : "replies"}
              </button>
            ) : (
              <>
                {repliesToShow.map((reply) => (
                  <Reply
                    key={reply.id}
                    reply={reply}
                    currentUserId={currentUserId}
                    postId={postId}
                    onAvatarClick={onAvatarClick}
                  />
                ))}
                <button
                  className="comment__toggle-replies"
                  onClick={() => setRepliesOpen(false)}
                >
                  Hide replies
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Comments (main export) ───────────────────────────────── */
export default function Comments({
  comments = [],
  currentUser = {},
  // post id for posting new comments
  postId = null,
  // sheet props
  sheet = false,
  visible = false,
  loading = false,
  onClose = () => { },
  onCommentAdded = () => { },
  initialVh = 60,
}) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState("");
  const commentTextareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const commentImageInputRef = useRef(null);
  const [sortBy, setSortBy] = useState("oldest");
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyTargetId, setReplyTargetId] = useState(null);
  const [selectedReplies, setSelectedReplies] = useState([]);
  const currentUserId = getStoredUserId();
  const { email, myImage, myName } = useContext(AuthContext);
  const navigate = useNavigate();
  const currentUserName = currentUser.name || myName || email || "User";
  const currentUserAvatar = {
    initials: currentUser.initials || getInitials(currentUserName),
    color: currentUser.color || "coral",
    photo: getAvatarPhoto(currentUser.photo || currentUser.avatar || currentUser.image || myImage),
    name: currentUserName,
  };

  function openUserProfile(userId) {
    if (!userId) return;
    onClose?.();
    if (currentUserId && String(userId) === String(currentUserId)) {
      navigate("/my_profile");
      return;
    }
    navigate(`/user_profile/${userId}`);
  }

  const normalizedComments = useMemo(
    () =>
      Array.isArray(comments)
        ? comments.map((comment, index) => normalizeComment(comment, index, currentUserId))
        : [],
    [comments, currentUserId]
  );

  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleDocumentClick = (event) => {
      if (!emojiPickerRef.current) return;
      if (emojiPickerRef.current.contains(event.target)) return;
      setShowEmojiPicker(false);
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("touchstart", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("touchstart", handleDocumentClick);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    setShowAllComments(false);
    setReplyTargetId(null);
    setSelectedReplies([]);
  }, [comments, sheet]);

  useEffect(() => {
    if (!replyTargetId) {
      setSelectedReplies([]);
      return;
    }

    fetchAllReplies(replyTargetId);
  }, [replyTargetId]);

  function sortComments(commentsToSort, sortType) {
    return [...commentsToSort].sort((a, b) => {
      if (sortType === "oldest") {
        return a.timestamp - b.timestamp;
      }
      return b.timestamp - a.timestamp;
    });
  }




  async function fetchAllReplies(commentId) {
    if (!postId || !commentId) {
      setSelectedReplies([]);
      return;
    }

    try {
      const response = await getReplies(postId, commentId);

      const payload =
        response?.comments ??
        response?.replies ??
        response?.data?.comments ??
        response?.data?.replies ??
        response?.data ??
        response ?? [];

      const replies = Array.isArray(payload)
        ? payload.map((reply, index) => normalizeComment(reply, index, currentUserId))
        : [];
      setSelectedReplies(replies);
      setReplyTargetId(commentId);
    } catch (error) {
      console.log(error);
      setSelectedReplies([]);
    }
  }

  async function handleCreateReply(commentId, text) {
    if (!postId || !commentId || !text.trim()) return;

    const result = await createReply(postId, commentId, { content: text });
    console.log(commentId);

    const replyData =
      Array.isArray(result)
        ? result
        : result?.comments ??
        result?.replies ??
        result?.data?.comments ??
        result?.data?.replies ??
        result?.data ??
        (result && typeof result === "object" ? [result] : []);

    if (Array.isArray(replyData) && replyData.length > 0) {
      setSelectedReplies(replyData.map((reply, index) => normalizeComment(reply, index, currentUserId)));
    }

    setReplyTargetId(commentId);
    await fetchAllReplies(commentId);


  }



  const sorted = sortComments(normalizedComments, sortBy);
  const displayedComments = showAllComments ? sorted : sorted.slice(0, 3);

  // sheet state/hooks
  const sheetRef = useRef(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const MIN_VH = 30;
  const MAX_VH = 90;
  const CLOSE_VH = 50;
  const sheetHeightRef = useRef(0);
  const [sheetHeight, setSheetHeight] = useState(() => {
    if (typeof window === "undefined") return 0;
    const initial = Math.round(window.innerHeight * (initialVh / 100));
    sheetHeightRef.current = initial;
    return initial;
  });

  // reset height when opened
  useEffect(() => {
    if (visible && typeof window !== "undefined") {
      const initial = Math.round(window.innerHeight * (initialVh / 100));
      sheetHeightRef.current = initial;
      setSheetHeight(initial);
    }
  }, [visible, initialVh]);

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  function getMaxSheetHeight() {
    return Math.round(window.innerHeight * (MAX_VH / 100));
  }

  function onPointerMove(e) {
    if (!dragging.current) return;

    const delta = startY.current - e.clientY;
    const minH = window.innerHeight * (MIN_VH / 100);
    const maxH = getMaxSheetHeight();
    let newH = startHeight.current + delta;
    newH = Math.max(minH, Math.min(maxH, newH));
    sheetHeightRef.current = newH;
    setSheetHeight(newH);
  }

  function onPointerUp() {
    dragging.current = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);

    const currentHeight = sheetHeightRef.current;
    const closeThreshold = window.innerHeight * (CLOSE_VH / 100);

    if (currentHeight < closeThreshold) {
      sheetHeightRef.current = 0;
      setSheetHeight(0);
      setTimeout(() => onClose(), 180);
      return;
    }

    const expandedThreshold = window.innerHeight * 0.85;
    if (currentHeight > expandedThreshold) {
      const expandedHeight = getMaxSheetHeight();
      sheetHeightRef.current = expandedHeight;
      setSheetHeight(expandedHeight);
    }
  }

  function onHandlePointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;

    dragging.current = true;
    startY.current = e.clientY ?? (e.touches && e.touches[0]?.clientY) || 0;
    startHeight.current = sheetHeightRef.current;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    try { e.currentTarget?.setPointerCapture?.(e.pointerId); } catch (err) { }
    e.preventDefault();
  }

  const handleEmojiToggle = () => setShowEmojiPicker((prev) => !prev);
  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    commentTextareaRef.current?.focus();
  };

  function removeCommentImage() {
    if (commentImagePreview) {
      URL.revokeObjectURL(commentImagePreview);
    }
    setCommentImage(null);
    setCommentImagePreview("");
  }


  const composeBox = (
    <div className="comments__compose">
      <Avatar
        initials={currentUserAvatar.initials}
        color={currentUserAvatar.color}
        src={currentUserAvatar.photo}
        name={currentUserAvatar.name}
      />
      <div className="comments__compose-body relative">
        <textarea
          ref={commentTextareaRef}
          className="comments__input"
          placeholder="Add to the thread..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          aria-label="Write a comment"
        />
        {showEmojiPicker && (
          <div className="comments__emoji-picker  absolute z-50 bottom-0 top-30 " ref={emojiPickerRef}>
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
        <div className="comments__compose-foot">
          <div className="comments__compose-icons">
            <button type="button" aria-label="Add emoji" onClick={handleEmojiToggle}>
              <IconMoodSmile size={17} stroke={1.5} />
            </button>
          </div>
          <button
            className="comments__submit"
            disabled={!(text.trim() || commentImage) || !postId}
            aria-label="Post comment"
            onClick={async () => {
              if (!postId || !(text.trim() || commentImage)) return;
              try {
                await handleAddComment(postId, text.trim(), commentImage);
                setText("");
                removeCommentImage();
                setShowEmojiPicker(false);
                onCommentAdded();
              } catch (error) {
                console.error("Failed to add comment:", error);
              }
            }}
          >
            <IconArrowUp size={14} stroke={2} style={{ display: "inline", marginRight: 4 }} />
            Post
          </button>
        </div>
      </div>
    </div>
  );

  const headerBar = (
    <div className="comments__header">
      <h2 className="comments__title">
        Replies
        <span className="comments__count">{normalizedComments.length}</span>
      </h2>
      <button
        type="button"
        className="comments__sort"
        onClick={() => setSortBy((s) => (s === "oldest" ? "newest" : "oldest"))}
        aria-label="Toggle sort order"
      >
        <IconArrowsSort size={14} stroke={1.5} />
        {sortBy === "oldest" ? "Sort by: Oldest" : "Sort by: Newest"}
      </button>
    </div>
  );

  const commentsList = (
    <>
      <div className="comments__list" role="list">
        {loading ? (
          <List />
        ) : displayedComments.length ? (
          displayedComments.map((comment, index) => (
            <Comment
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              currentUserAvatar={currentUserAvatar}
              isLast={index === displayedComments.length - 1}
              postId={postId}
              activeReplies={comment.id === replyTargetId ? selectedReplies : []}
              onReplyClick={(selectedCommentId) => {
                setReplyTargetId(selectedCommentId);
              }}
              onReplySubmit={handleCreateReply}
              onCommentUpdated={onCommentAdded}
              onFetchReplies={fetchAllReplies}
              onAvatarClick={openUserProfile}
            />
          ))
        ) : (
          <p className="comments__empty">No comments yet.</p>
        )}
      </div>

      {normalizedComments.length > 3 && (
        <div className="comments__load-more">
          <button
            className="comments__load-btn"
            onClick={() => setShowAllComments((prev) => !prev)}
          >
            {showAllComments ? "Show fewer replies" : "Load more replies"}
          </button>
        </div>
      )}
    </>
  );

  const commentsBody = (
    <section className={`comments${sheet ? " comments--sheet" : ""}`} aria-label="Comments">
      {sheet ? (
        <>
          {headerBar}
          {composeBox}
          <div className="comments__scroll">{commentsList}</div>
        </>
      ) : (
        <>
          {headerBar}
          {composeBox}
          {commentsList}
        </>
      )}
    </section>
  );

  if (!sheet) return commentsBody;

  return (
    <>
      <div className={`sheet-backdrop ${visible ? 'open' : ''}`} onClick={onClose} />
      <div
        ref={sheetRef}
        className={`bottom-sheet ${visible ? 'open' : ''}`}
        style={{ height: sheetHeight ? `${sheetHeight}px` : undefined }}
      >
        <div className="sheet-handle" onPointerDown={onHandlePointerDown}>
          <div className="sheet-handle-bar" />
        </div>
        <div className="sheet-content">
          {commentsBody}
        </div>
      </div>
    </>
  );
}
