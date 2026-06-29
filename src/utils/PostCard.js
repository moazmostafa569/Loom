import { toast } from "react-toastify";
import { createComment } from "../services/AllComents";

export const DEFAULT_AVATAR_URL = 'https://pub-3cba56bacf9f4965bbb0989e07dada12.r2.dev/linkedPosts/default-profile.png';

export function getAvatarPhoto(value) {
  const photo = String(value || '').trim();
  if (!photo || photo === DEFAULT_AVATAR_URL || photo.includes('/linkedPosts/default-profile.png')) return '';
  return photo;
}

function normalizePostTimestamp(value) {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  const hasTimezone = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed);
  const looksLikeIsoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed);

  return looksLikeIsoDateTime && !hasTimezone ? `${trimmed}Z` : trimmed;
}

export function formatPostTime(value) {
  if (!value) return '· 12m';
  const created = new Date(normalizePostTimestamp(value));
  if (Number.isNaN(created.getTime())) return '· 12m';

  const diffMs = Date.now() - created.getTime();
  if (diffMs < 0 && Math.abs(diffMs) < 30_000) return '· just now';
  if (diffMs >= 0 && diffMs < 30_000) return '· just now';
  if (diffMs < 0) return '· 12m';

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const minutes = Math.floor(diffMs / minute);
  if (minutes < 1) return '· just now';
  if (minutes < 60) return minutes === 1 ? '· 1 minute ago' : `· ${minutes} minutes ago`;

  const hours = Math.floor(diffMs / hour);
  if (hours < 24) return hours === 1 ? '· 1 hour ago' : `· ${hours} hours ago`;

  const days = Math.floor(diffMs / day);
  if (days < 7) return days === 1 ? '· 1 day ago' : `· ${days} days ago`;

  return `· ${created.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
}

export function openPicture(src) {
  if (!src) return;
  window.open(src, '_blank', 'noopener,noreferrer');
}
export async function handleAddComment(postId, comment, imageFile = null) {
  try {
    console.log(`Adding comment to post ${postId}: ${comment}`);
    const formData = new FormData();
    formData.append('content', comment);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    const response = await createComment(postId, formData);
    console.log(response);
    return response;
  } catch (error) {
    console.error('Error adding comment:', error);
    toast.error('Failed to add comment. Please try again.');
    throw error;
  }
}

export function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
}

