import React, { useEffect, useRef, useState } from 'react'
import { IconRepeat, IconBookmark, IconX, IconMessageCircle, IconHeart, IconMenu2 } from '@tabler/icons-react';
import { formatPostTime } from '../../utils/PostCard';
import { getAllComments, getReplies } from '../../services/AllComents';
import Comments from '../Comments/Comments';
import './../../styles/PostCard.css'
import { useNavigate } from 'react-router-dom';
import { savePost, updatePost, deletePost, likePost, unlikePost, sharePost } from '../../services/AllPostsServices';

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
  const [isLiked, setIsLiked] = useState(false);
  const [isShared, setIsShared] = useState(false);
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
  const originalPostUser = post?.repost?.user || post?.repost?.author || post?.original?.user || post?.original?.author || post?.sharedPost?.user || post?.sharedPost?.author;
  const originalAuthor = originalPostUser || post?.user || post?.creator || post?.author || post?.createdBy || post?.postedBy || {};
  const sharerUser = post?.user || post?.creator || post?.author || post?.createdBy || post?.postedBy || {};
  const isSharedPost = Boolean(post?.isShared || post?.isReposted || post?.isRepost || post?.isShare || post?.sharedBy || post?.repostedBy || post?.repost);
  const user = originalAuthor;
  const avatarUser = isSharedPost ? sharerUser : originalAuthor;
  const photo = (avatarUser.photo || avatarUser.avatar || avatarUser.image || '').trim();
  const showImage = photo && photo !== DEFAULT_AVATAR_URL;
  const initials = getInitials(avatarUser.name || avatarUser.fullname || avatarUser.username || 'User');
  const handleText = user.username ? `@${user.username}` : user.handle ? `@${user.handle}` : user.name ? `@${user.name.trim().split(/\s+/)[0].toLowerCase()}` : '@user';
  const createdAt = post?.createdAt || post?.created_at || post?.created || post?.timestamp || post?.date || post?.createdOn || post?.postedAt || '';
  const timeText = formatPostTime(createdAt);
  const originalPostText = post?.body || post?.text || post?.caption || post?.content || post?.description || post?.message || '';
  const [currentBody, setCurrentBody] = useState(originalPostText);
  const postText = currentBody;
  const gifUrlMatch = postText.match(/https?:\/\/\S+?\.gif(?:\?\S*)?/i);
  const postGifUrl = gifUrlMatch ? gifUrlMatch[0].trim() : '';
  const postTextWithoutGif = postGifUrl ? postText.replace(postGifUrl, '').trim() : postText;
  const postImage = (post?.image || post?.imageUrl || post?.photo || post?.mediaUrl || '').trim();
  const hasPostImage = Boolean(postImage);
  const hasGifPreview = Boolean(postGifUrl) && !hasPostImage;
  const initialLikesCount = Number(post?.likesCount ?? post?.likes ?? post?.likes_count ?? (Array.isArray(post?.likes) ? post.likes.length : undefined) ?? 0) || 0;
  const initialSharesCount = Number(post?.sharesCount ?? post?.shares_count ?? post?.shares ?? 0) || 0;
  const commentsCount = Number(post?.commentsCount ?? post?.comments ?? post?.comments_count ?? (Array.isArray(post?.comments) ? post.comments.length : undefined) ?? 0) || 0;
  const repostedByUser = (() => {
    const source = post?.repostedBy || post?.sharedBy || post?.repost?.user || post?.repost?.author;
    if (typeof source === 'string') return source;
    return source?.username || source?.handle || source?.userName || source?.name || '';
  })();
  const showRepostNotice = Boolean(post?.isReposted || post?.isShared || post?.isRepost || post?.isShare || repostedByUser);
  const normalizedRepostHandle = repostedByUser?.trim() || '';
  const repostText = normalizedRepostHandle
    ? `${normalizedRepostHandle.startsWith('@') ? normalizedRepostHandle : `@${normalizedRepostHandle}`} reposted`
    : 'Reposted';
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

    const likedFromArray = Array.isArray(post?.likes) && currentUserId ? post.likes.includes(currentUserId) : false;
    const likedState = typeof post?.isLiked === 'boolean' ? post.isLiked : likedFromArray;
    setIsLiked(Boolean(likedState));

    const storedSharedPosts = JSON.parse(localStorage.getItem('shared-posts') || '[]');
    const isPostSharedLocally = Array.isArray(storedSharedPosts) && storedSharedPosts.includes(postId);
    const apiSharedState = typeof post?.isShared === 'boolean'
      ? post.isShared
      : typeof post?.isReposted === 'boolean'
        ? post.isReposted
        : false;
    setIsShared(isPostSharedLocally || apiSharedState);

    setLocalLikesCount(initialLikesCount);
    setLocalSharesCount(initialSharesCount);
    setEditBody(originalPostText);
    setCurrentBody(originalPostText);
  }, [postId, currentUserId, originalPostText, initialLikesCount, initialSharesCount]);

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
    if (!postId) return;

    try {
      if (isLiked) {
        await unlikePost(postId);
        setIsLiked(false);
        setLocalLikesCount((count) => Math.max(0, count - 1));
      } else {
        await likePost(postId);
        setIsLiked(true);
        setLocalLikesCount((count) => count + 1);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  }

  async function handleShareToggle() {
    if (!postId || isShared) return;

    const storedSharedPosts = JSON.parse(localStorage.getItem('shared-posts') || '[]');
    const currentSharedPosts = Array.isArray(storedSharedPosts) ? storedSharedPosts : [];

    try {
      await sharePost(postId);
      setIsShared(true);
      setLocalSharesCount((count) => count + 1);
      const updatedPosts = currentSharedPosts.includes(postId)
        ? currentSharedPosts
        : [...currentSharedPosts, postId];
      localStorage.setItem('shared-posts', JSON.stringify(updatedPosts));
    } catch (error) {
      console.error('Failed to share post:', error);
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
            <span className="post-repost-icon">
              <IconRepeat size={13} stroke={2} />
            </span>
            <span>{repostText}</span>
          </div>
        )}
        <div className="post-meta">
          <span className="name">{user?.name || user?.fullname || 'Unknown User'}</span>
          <span className="handle">{handleText}</span>
          <span className="time">{timeText}</span>
          <span className="meta-menu-icon" ref={dropdownRef}>
            <IconMenu2 onClick={() => setShowDropdown(!showDropdown)} className='cursor-pointer' stroke={2} />

            {showDropdown && (
              <div className="rail__dropdown absolute top-5 right-6 bg-primary rounded-2xl shadow-lg p-5 z-50">
                <button onClick={openPostInNewTab} className="rail__dropdown-btn w-full text-left px-4 py-3 text-gray-700 cursor-pointer hover:bg-gray-300 rounded-lg mb-2 transition">
                  Open in new tab
                </button>
                <button
                  onClick={copyPostLink}
                  className="rail__dropdown-btn w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-300 cursor-pointer rounded-lg transition"
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
                      className="rail__dropdown-btn w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-300 cursor-pointer rounded-lg transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="rail__dropdown-btn w-full text-left px-4 py-3 text-gray-700 hover:bg-red-100 cursor-pointer rounded-lg transition"
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
              <img src={openImageSrc} alt="Expanded preview" />
            </div>
          </div>
        )}
        <div className="post-actions">
          <div className="act cursor-pointer" onClick={toggleLike}>
            <IconHeart stroke={2} style={{ color: isLiked ? '#ff6b5b' : undefined }} /> {likesCount}
          </div>
          <div onClick={() => fetchAllComments(postId)} className="act cursor-pointer"><IconMessageCircle stroke={2} /> {totalCommentsAndReplies}</div>
          <div
            className={`act ${isShared ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            onClick={handleShareToggle}
            aria-disabled={isShared}
          >
            <IconRepeat stroke={2} />
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
