import React, { useEffect, useRef, useState } from 'react'
import { IconRepeat, IconRepeatOff, IconBookmark, IconX, IconMessageCircle, IconHeart, IconMenu2 } from '@tabler/icons-react';
import { formatPostTime } from '../../utils/PostCard';
import { getAllComments, getReplies } from '../../services/AllComents';
import Comments from '../Comments/Comments';
import './../../styles/PostCard.css'
import { useNavigate } from 'react-router-dom';
import { savePost, updatePost, deletePost, likePost, sharePost, unSharePost, getPostLikes } from '../../services/AllPostsServices';

const DEFAULT_AVATAR_URL = 'https://pub-3cba56bacf9f4965bbb0989e07dada12.r2.dev/linkedPosts/default-profile.png';

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
}


export default function PostCard({ post, onDelete }) {

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(() => Boolean(post?.isLiked));
  const [isShared, setIsShared] = useState(false);
  const [sharePostId, setSharePostId] = useState('');
  const [localLikesCount, setLocalLikesCount] = useState(null);
  const [localSharesCount, setLocalSharesCount] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState('');
  const [isDeleted, setIsDeleted] = useState(false);
  const dropdownRef = useRef(null)
  const postId = post?.id || post?._id;
  const currentUserId = localStorage.getItem('user-id');
  const isOwner = Boolean(currentUserId && post.user?._id === currentUserId);


  async function fetchAllComments(postId) {
    if (!postId) return;
    // open comments bottom-sheet immediately
    setShowComments(true);
    setComments([]);
    setCommentsLoading(true);
    try {
      let response = await getAllComments(postId);
      const payload = response?.comments ?? response?.data?.comments ?? response?.data ?? response ?? [];
      let commentsArray = Array.isArray(payload) ? payload : [];
      // جلب جميع الردود لكل comment
      commentsArray = await Promise.all(
        commentsArray.map(async (comment) => {
          try {
            const commentId = comment._id || comment.id;
            console.log(commentId);

            const repliesResponse = await getReplies(postId, commentId);
            const repliesPayload = repliesResponse?.comments ?? repliesResponse?.replies ?? repliesResponse?.data?.comments ?? repliesResponse?.data?.replies ?? repliesResponse?.data ?? repliesResponse ?? [];
            return {
              ...comment,
              replies: Array.isArray(repliesPayload) ? repliesPayload : []
            };
          } catch (error) {
            // إذا فشل جلب الردود، عود بالـ comment بدون ردود
            return { ...comment, replies: [] };
          }
        })
      );

      setComments(commentsArray);

    } catch (error) {
      console.log(error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }




  const [openImageSrc, setOpenImageSrc] = useState('');
  const repostedContent = post?.repost || post?.sharedPost || post?.original || null;
  const isSharedPost = Boolean(post?.isShared || post?.isReposted || post?.isRepost || post?.isShare || post?.sharedBy || post?.repostedBy || repostedContent);
  const sourcePost = isSharedPost ? (repostedContent || post) : post;
  const originalPostUser = sourcePost?.user || sourcePost?.creator || sourcePost?.author || sourcePost?.createdBy || sourcePost?.postedBy || {};
  const originalAuthor = originalPostUser || post?.user || post?.creator || post?.author || post?.createdBy || post?.postedBy || {};
  const reposterUser = post?.user || post?.creator || post?.author || post?.createdBy || post?.postedBy || {};
  const user = originalAuthor;

  function getUserAvatarInfo(userObj) {
    const userPhoto = (userObj?.photo || userObj?.avatar || userObj?.image || '').trim();
    const userShowImage = userPhoto && userPhoto !== DEFAULT_AVATAR_URL;
    const userInitials = getInitials(userObj?.name || userObj?.fullname || userObj?.username || 'User');
    return { photo: userPhoto, showImage: userShowImage, initials: userInitials };
  }

  const { photo, showImage, initials } = getUserAvatarInfo(originalAuthor);
  const reposterAvatar = getUserAvatarInfo(reposterUser);
  const reposterName = reposterUser?.name || reposterUser?.fullname || localStorage.getItem('user-name') || 'User';
  const reposterHandle = reposterUser?.username
    ? `@${reposterUser.username}`
    : reposterUser?.handle
      ? (reposterUser.handle.startsWith('@') ? reposterUser.handle : `@${reposterUser.handle}`)
      : (() => {
          const stored = localStorage.getItem('user-username') || localStorage.getItem('user-handle') || '';
          return stored ? (stored.startsWith('@') ? stored : `@${stored}`) : '';
        })();
  const handleText = user.username ? `@${user.username}` : user.handle ? `@${user.handle}` : user.name ? `@${user.name.trim().split(/\s+/)[0].toLowerCase()}` : '@user';
  const createdAt = sourcePost?.createdAt || sourcePost?.created_at || sourcePost?.created || sourcePost?.timestamp || sourcePost?.date || sourcePost?.createdOn || sourcePost?.postedAt || post?.createdAt || post?.created_at || post?.created || post?.timestamp || post?.date || post?.createdOn || post?.postedAt || '';
  const timeText = formatPostTime(createdAt);
  const originalPostText = sourcePost?.body || sourcePost?.text || sourcePost?.caption || sourcePost?.content || sourcePost?.description || sourcePost?.message || '';
  const [currentBody, setCurrentBody] = useState(originalPostText);
  const postText = currentBody;
  const gifUrlMatch = postText.match(/https?:\/\/\S+?\.gif(?:\?\S*)?/i);
  const postGifUrl = gifUrlMatch ? gifUrlMatch[0].trim() : '';
  const postTextWithoutGif = postGifUrl ? postText.replace(postGifUrl, '').trim() : postText;
  const postImage = (sourcePost?.image || sourcePost?.imageUrl || sourcePost?.photo || sourcePost?.mediaUrl || '').trim();
  const hasPostImage = Boolean(postImage);
  const hasGifPreview = Boolean(postGifUrl) && !hasPostImage;
  const initialLikesCount = Number(post?.likesCount ?? post?.likes ?? post?.likes_count ?? (Array.isArray(post?.likes) ? post.likes.length : undefined) ?? 0) || 0;
  const initialSharesCount = Number(post?.sharesCount ?? post?.shares_count ?? post?.shares ?? 0) || 0;
  const commentsCount = Number(post?.commentsCount ?? post?.comments ?? post?.comments_count ?? (Array.isArray(post?.comments) ? post.comments.length : undefined) ?? 0) || 0;
  const showRepostNotice = isSharedPost;
  const repostText = reposterHandle
    ? `${reposterName} ${reposterHandle} reposted`
    : `${reposterName} reposted`;
  const sharesCount = localSharesCount !== null ? localSharesCount : initialSharesCount;
  const likesCount = localLikesCount !== null ? localLikesCount : initialLikesCount;
  const totalRepliesCount = comments.reduce((sum, comment) => sum + (Array.isArray(comment?.replies) ? comment.replies.length : 0), 0);
  const totalCommentsAndReplies = commentsCount + totalRepliesCount;
  const openImage = (src) => setOpenImageSrc(src || '');
  const closeImage = () => setOpenImageSrc('');
  const navigate = useNavigate();
  const openPostInNewTab = () => {
    const url = window.location.origin + `/posts/${postId || ''}`;
    window.open(url, '_blank');
    setShowDropdown(false);
  };

  const copyPostLink = async () => {
    const url = window.location.origin + `/posts/${postId || ''}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error('Copy failed', error);
    }
    setShowDropdown(false);
  };
  function openUserProfile(userId) {
    if (userId && userId === currentUserId) {
      navigate(`/my_profile`);
      return;
    }
    navigate(`/user_profile/${userId || ''}`);
  }

  useEffect(() => {
    const savedPosts = JSON.parse(localStorage.getItem('saved-posts') || '[]');
    const isPostSaved = savedPosts.includes(postId);
    setIsSaved(isPostSaved);

    const likedFromArray = Array.isArray(post?.likes) && currentUserId
      ? post.likes.some((liker) => {
          const id = typeof liker === 'string' ? liker : (liker?._id || liker?.id || liker?.userId || liker?.user?._id || liker?.user?.id);
          return String(id) === String(currentUserId);
        })
      : false;
    const likedState = typeof post?.isLiked === 'boolean' ? post.isLiked : likedFromArray;
    setIsLiked(Boolean(likedState));

    const rawSharedPosts = localStorage.getItem('shared-posts');
    let sharedPosts = {};
    if (rawSharedPosts) {
      try {
        const parsed = JSON.parse(rawSharedPosts);
        if (Array.isArray(parsed)) {
          sharedPosts = parsed.reduce((acc, id) => ({ ...acc, [id]: null }), {});
        } else if (parsed && typeof parsed === 'object') {
          sharedPosts = parsed;
        }
      } catch (error) {
        sharedPosts = {};
      }
    }

    const localShareId = sharedPosts[postId] || '';
    const isPostSharedLocally = Boolean(localShareId) || Object.prototype.hasOwnProperty.call(sharedPosts, postId);
    const apiSharedState = typeof post?.isShared === 'boolean'
      ? post.isShared
      : typeof post?.isReposted === 'boolean'
        ? post.isReposted
        : false;

    setSharePostId(localShareId);
    setIsShared(isPostSharedLocally || apiSharedState);

    setLocalLikesCount(initialLikesCount);
    setLocalSharesCount(initialSharesCount);
    setEditBody(originalPostText);
    setCurrentBody(originalPostText);
  }, [postId, post?.isLiked, currentUserId, originalPostText, initialLikesCount, initialSharesCount]);

  useEffect(() => {
    async function verifyLikeState() {
      if (!postId || !currentUserId) return;
      try {
        const likesResponse = await getPostLikes(postId);
        const payload = likesResponse?.likes ?? likesResponse?.data?.likes ?? likesResponse?.data ?? likesResponse ?? [];
        const likesArray = Array.isArray(payload) ? payload : [];

        const likedByMe = likesArray.some((liker) => {
          const id = typeof liker === 'string' ? liker : (liker?._id || liker?.id || liker?.userId || liker?.user?._id || liker?.user?.id);
          return String(id) === String(currentUserId);
        });

        const likedFromPost = typeof post?.isLiked === 'boolean' ? post.isLiked : false;
        setIsLiked(Boolean(likedFromPost || likedByMe));
      } catch (e) {
        console.error('Failed to verify like state:', e);
      }
    }

    verifyLikeState();
  }, [postId, currentUserId, post?.isLiked]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSavePost() {
    if (!postId) return;

    try {
      const response = await savePost(postId);
      const savedPosts = JSON.parse(localStorage.getItem('saved-posts') || '[]');
      const currentSaved = Array.isArray(savedPosts) && savedPosts.includes(postId);
      const updatedSavedPosts = Array.isArray(savedPosts)
        ? currentSaved
          ? savedPosts.filter((savedId) => savedId !== postId)
          : [...savedPosts, postId]
        : [postId];

      localStorage.setItem('saved-posts', JSON.stringify(updatedSavedPosts));
      setIsSaved(!currentSaved);
      console.log('Bookmark toggled successfully:', response);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  }

  async function toggleLike() {
    if (!postId) {
      console.error('Cannot toggle like: postId is missing');
      return;
    }

    try {
      await likePost(postId);
      if (isLiked) {
        setIsLiked(false);
        setLocalLikesCount((count) => Math.max(0, count - 1));
      } else {
        setIsLiked(true);
        setLocalLikesCount((count) => count + 1);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  }

  function parseStoredSharedPosts() {
    const raw = localStorage.getItem('shared-posts');
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.reduce((acc, id) => ({ ...acc, [id]: null }), {});
      }
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (error) {
      // ignore invalid data
    }
    return {};
  }

  function saveStoredSharedPosts(posts) {
    localStorage.setItem('shared-posts', JSON.stringify(posts));
  }

  function extractSharePostId(response) {
    const payload = response?.data ?? response?.post ?? response;
    return payload?._id || payload?.id || payload?.sharePostId || response?.data?.post?._id || response?.data?.post?.id || '';
  }

  async function handleShareToggle() {
    if (!postId) return;

    const sharedPosts = parseStoredSharedPosts();
    const currentSharePostId = sharePostId || sharedPosts[postId] || '';
    const canUnshare = Boolean(isShared && currentSharePostId);

    try {
      if (canUnshare) {
        await unSharePost(currentSharePostId);
        const nextSharedPosts = { ...sharedPosts };
        delete nextSharedPosts[postId];
        saveStoredSharedPosts(nextSharedPosts);
        setSharePostId('');
        setIsShared(false);
        setLocalSharesCount((count) => Math.max(0, count - 1));
        return;
      }

      if (isShared) {
        return;
      }

      const response = await sharePost(postId);
      const createdShareId = extractSharePostId(response);
      const nextSharedPosts = { ...sharedPosts, [postId]: createdShareId || null };
      saveStoredSharedPosts(nextSharedPosts);
      setSharePostId(createdShareId || '');
      setIsShared(true);
      setLocalSharesCount((count) => count + 1);
    } catch (error) {
      console.error('Failed to toggle share:', error);
    }
  }

  async function handleSaveEdit() {
    if (!postId) return;
    try {
      await updatePost(postId, editBody);
      setCurrentBody(editBody);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  }

  async function handleDeletePost() {
    if (!postId) return;
    try {
      await deletePost(postId);
      setShowDropdown(false);
      if (typeof onDelete === 'function') {
        onDelete(postId);
      } else {
        setIsDeleted(true);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  }

  if (isDeleted) {
    return null;
  }

  return <>
    <div className="post">
      <div className="post-rail">
        <div className={`avatar ${showImage ? 'avatar-img' : 'av-coral'} cursor-pointer`} onClick={() => openUserProfile(user?._id || user?.id)}
        >
          {showImage ? (
            <img
              className="clickable-image"
              src={photo}
              alt={user?.name || 'User avatar'}
            />
          ) : initials}
        </div>
        <div className="line" />
      </div>
      <div className="post-body">
        {showRepostNotice && (
          <div className="post-repost-banner" role="status" aria-label={repostText}>
            <span className="post-repost-icon" aria-hidden="true">
              <IconRepeat size={13} stroke={2} />
            </span>
            <span className="repost-banner-user" role="presentation">
              <span
                className={`repost-banner-avatar ${reposterAvatar.showImage ? 'avatar-img' : 'av-coral'}`}
                onClick={() => openUserProfile(reposterUser?._id || reposterUser?.id || currentUserId)}
              >
                {reposterAvatar.showImage ? (
                  <img src={reposterAvatar.photo} alt={reposterName} />
                ) : (
                  reposterAvatar.initials
                )}
              </span>
              <span className="repost-banner-text">
                <span className="repost-banner-name">{reposterName}</span>
                {reposterHandle && <span className="repost-banner-handle">{reposterHandle}</span>}
              </span>
            </span>
            <span className="repost-banner-separator" aria-hidden="true">·</span>
            <span className="repost-banner-label">Reposted</span>
          </div>
        )}
        <div className="post-meta">
          <span className="post-meta-user">
            <span className="name">{user?.name || user?.fullname || 'Unknown User'}</span>
          </span>
          <span className="handle">{handleText}</span>
          <span className="time">{timeText}</span>
          <span className="meta-menu-icon" ref={dropdownRef}>
            <IconMenu2 onClick={() => setShowDropdown(!showDropdown)} className='cursor-pointer' stroke={2} />

            {showDropdown && (
              <div className="rail__dropdown absolute top-5 right-6 rounded-2xl shadow-lg p-5 z-50">
                <button onClick={openPostInNewTab} className="rail__dropdown-btn w-full text-left px-4 py-3 cursor-pointer rounded-lg mb-2 transition">
                  Open in new tab
                </button>
                <button
                  onClick={copyPostLink}
                  className="rail__dropdown-btn w-full text-left px-4 py-3 cursor-pointer rounded-lg transition"
                >
                  Copy link
                </button>
                {isOwner && (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowDropdown(false);
                      }}
                      className="rail__dropdown-btn w-full text-left px-4 py-3 cursor-pointer rounded-lg transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="rail__dropdown-btn rail__dropdown-btn--danger w-full text-left px-4 py-3 cursor-pointer rounded-lg transition"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </span>
        </div>
        {isEditing ? (
          <div className="post-editing">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="post-edit-input"
              rows={4}
            />
            <div className="edit-buttons">
              <button onClick={handleSaveEdit} className="edit-save-btn">Save</button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditBody(postText);
                }}
                className="edit-cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="post-text">{postTextWithoutGif || "Spent the morning rewiring the studio lights — finally got that warm amber wash working in the corner booth. Small wins."}</p>
        )}
        {hasPostImage && (
          <div className="post-media">
            <img
              className="clickable-image"
              src={postImage}
              onClick={() => openImage(postImage)}
              alt={post.user?.name ? `${post.user.name} post image` : 'Post image'}
            />
          </div>
        )}
        {!hasPostImage && hasGifPreview && (
          <div className="post-media">
            <img
              className="clickable-image"
              src={postGifUrl}
              loading="eager"
              onClick={() => openImage(postGifUrl)}
              alt={post.user?.name ? `${post.user.name} gif post` : 'Post GIF'}
            />
          </div>
        )}
        {openImageSrc && (
          <div className="image-overlay" onClick={closeImage}>
            <div className="image-overlay-content relative" onClick={(event) => event.stopPropagation()}>
              <button
                className="hidden lg:flex absolute top-4 right-4 z-20 rounded-full bg-black/60 p-2 text-white hover:bg-black"
                onClick={closeImage}
                aria-label="Close image"
              >
                <IconX className="cursor-pointer" stroke={2} />
              </button>
              <img
                src={openImageSrc}
                loading={String(openImageSrc).toLowerCase().includes('.gif') ? 'eager' : undefined}
                alt="Expanded preview"
              />
            </div>
          </div>
        )}
        <div className="post-actions">
          <div
            className={`act cursor-pointer${isLiked ? ' liked' : ''}`}
            onClick={toggleLike}
            aria-label={isLiked ? 'Unlike post' : 'Like post'}
            aria-pressed={isLiked}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleLike();
              }
            }}
          >
            <IconHeart stroke={2} fill={isLiked ? 'currentColor' : 'none'} /> {likesCount}
          </div>
          <div onClick={() => fetchAllComments(postId)} className="act cursor-pointer"><IconMessageCircle stroke={2} /> {totalCommentsAndReplies}</div>
          <div
            className={`act ${isShared && !sharePostId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            onClick={handleShareToggle}
            aria-disabled={isShared && !sharePostId}
          >
            {isShared && sharePostId ? <IconRepeatOff stroke={2} /> : <IconRepeat stroke={2} />}
          </div>
          <div onClick={handleSavePost} className="act cursor-pointer"><IconBookmark stroke={2} className={isSaved ? 'saved' : ''} /></div>
        </div>
      </div>
    </div>
    {showComments && (
      <Comments
        sheet
        visible={showComments}
        loading={commentsLoading}
        onClose={() => setShowComments(false)}
        comments={comments}
        postId={postId}
        onCommentAdded={() => fetchAllComments(postId)}
      />
    )}
  </>
}
