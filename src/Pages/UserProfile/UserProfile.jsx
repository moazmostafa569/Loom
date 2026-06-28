import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  IconBell,
  IconMail,
  IconMapPin,
  IconLink,
  IconCalendar,
  IconHash,
  IconX,
} from "@tabler/icons-react";

import "./../../styles/profile.css";
import { getInitials } from "../../utils/PostCard";
import { getUserProfile, getUserPosts } from "../../services/profileServices";
import PostCard from "../../components/PostCard/PostCard";
import { handleFollowingUsers } from "../../utils/UserDetails";

const DEFAULT_AVATAR_URL =
  "https://pub-3cba56bacf9f4965bbb0989e07dada12.r2.dev/linkedPosts/default-profile.png";

const TABS = ["Posts", "Replies", "Media", "Likes"];

const DEFAULT_USER = {
  _id: "",
  name: "User",
  handle: "user",
  bio: "",
  location: "",
  website: "",
  joined: "",
  posts: 0,
  followers: 0,
  following: 0,
};

function ProfileBanner() {
  return (
    <div className="profile-banner">
      <svg viewBox="0 0 700 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <rect width="700" height="200" fill="#262232" />
        <path d="M-20 150 C 80 100, 160 180, 260 120 C 360 60, 440 140, 540 90 C 620 50, 660 90, 720 60" fill="none" stroke="#8fe3c0" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="2 8" />
        <path d="M-20 60 C 100 40, 180 100, 300 70 C 420 40, 480 110, 600 80 C 660 64, 700 100, 740 80" fill="none" stroke="#ff6b5b" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="2 8" />
        <circle cx="260" cy="120" r="14" fill="none" stroke="#8fe3c0" strokeWidth="1.5" />
        <circle cx="540" cy="90" r="10" fill="none" stroke="#8fe3c0" strokeWidth="1.5" />
        <circle cx="300" cy="70" r="8" fill="none" stroke="#ff6b5b" strokeWidth="1.5" />
        <circle cx="600" cy="80" r="12" fill="none" stroke="#f4c95d" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function formatJoinDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function getProfilePhoto(apiUser) {
  const photo = String(apiUser?.photo || apiUser?.avatar || apiUser?.image || "").trim();
  const invalidPhoto = !photo || photo === DEFAULT_AVATAR_URL;
  return invalidPhoto ? "" : photo;
}

function mapApiUser(apiUser) {
  if (!apiUser) return null;




  return {
    _id: apiUser._id || apiUser.id || "",
    name: apiUser.name || apiUser.fullname || "User",
    handle: apiUser.username || apiUser.handle || apiUser.email?.split("@")[0] || "user",
    bio: apiUser.bio || apiUser.about || "",
    location: apiUser.location || "",
    website: apiUser.website || "",
    joined: formatJoinDate(apiUser.createdAt) || apiUser.joined || "",
    posts: apiUser.postsCount ?? apiUser.posts ?? 0,
    followers: apiUser.followersCount ?? apiUser.followers ?? 0,
    following: apiUser.followingCount ?? apiUser.following ?? 0,
    photo: getProfilePhoto(apiUser),
  };
}

export default function UserProfile() {
  const { id: userId } = useParams();
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState("Posts");
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  function openAvatarPreview() {
    setAvatarPreviewOpen(true);
  }

  function closeAvatarPreview() {
    setAvatarPreviewOpen(false);
  }

  async function handleFollowClick() {
    const targetUserId = profileUser?._id || profileUser?.id;
    if (!targetUserId) return;

    await handleFollowingUsers(targetUserId);
    setIsFollowing((prev) => !prev);
  }

  const { data: profileRes, isLoading: loading, error: profileError } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is missing.')
      }
      return getUserProfile(userId)
    },
    enabled: Boolean(userId),
  })

  const { data: postsRes } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is missing.')
      }
      return getUserPosts(userId)
    },
    enabled: Boolean(userId),
  })

  const profileResponse = profileRes || null
  const posts = (() => {
    const postsData = postsRes?.data?.posts ?? postsRes?.posts ?? (Array.isArray(postsRes?.data) ? postsRes.data : []);
    return Array.isArray(postsData) ? postsData : [];
  })()

  useEffect(() => {
    if (!userId) {
      setFetchError('User ID is missing.');
      return;
    }

    if (profileError) {
      setFetchError(profileError.response?.data?.message || profileError.message || 'Failed to load profile');
      return;
    }

    setFetchError(null);
    const isUserFollowing =
      profileResponse?.data?.isFollowing ??
      profileResponse?.data?.user?.isFollowing ??
      profileResponse?.user?.isFollowing ??
      profileResponse?.isFollowing ??
      false;
    setIsFollowing(isUserFollowing);
  }, [profileError, profileResponse, userId]);

  const apiUser =
    profileResponse?.data?.user ??
    profileResponse?.user ??
    profileResponse?.data ??
    null;
  const profileUser = mapApiUser(apiUser) ?? DEFAULT_USER;
  const avatarSrc = profileUser.photo || "";
  const firstName = profileUser.name?.split(" ")[0] || "User";
  const initials = getInitials(profileUser.name);

  if (loading) {
    return (
      <div className="profile-page">
        <p className="profile-status">Loading profile...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="profile-page">
        <p className="profile-status profile-status--error">{fetchError}</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-grid">

        <main className="profile-main lg:!-ms-10">
          <ProfileBanner />

          <div className="profile-head ">
            <div
              className="avatar-xl !rounded-full cursor-pointer"
              onClick={openAvatarPreview}
              aria-label="Open profile image"
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  openAvatarPreview();
                }
              }}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt={`${profileUser.name} profile`} className="avatar-xl__image w-full h-full object-cover rounded-full" />
              ) : (
                initials
              )}
              <span className="status" />
            </div>

            <div className="profile-actions">
              <button className="btn-outline" aria-label="Notify on posts">
                <IconBell size={16} stroke={1.5} />
              </button>
              <button className="btn-outline">
                <IconMail size={16} stroke={1.5} /> Message
              </button>
              {<button className="btn-fill" onClick={handleFollowClick}>
                {isFollowing ? "Following" : "Follow"}
              </button>
              }
            </div>

            {avatarPreviewOpen && avatarSrc && (
              <div className="avatar-preview-overlay" onClick={closeAvatarPreview}>
                <div className="avatar-preview-content" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className="avatar-xl__btn avatar-xl__btn--ghost avatar-preview-close"
                    onClick={closeAvatarPreview}
                    aria-label="Close avatar preview"
                  >
                    <IconX size={16} stroke={2} />
                  </button>
                  <img src={avatarSrc} alt={`${profileUser.name} profile`} className="avatar-preview-image" />
                </div>
              </div>
            )}

            <div className="profile-info">
              <h1>{profileUser.name}</h1>
              <div className="handle">@{profileUser.handle}</div>
              {profileUser.bio && <p className="bio">{profileUser.bio}</p>}

              <div className="meta-row">
                {profileUser.location && (
                  <div className="item"><IconMapPin size={15} stroke={1.5} /> {profileUser.location}</div>
                )}
                {profileUser.website && (
                  <div className="item"><IconLink size={15} stroke={1.5} /> <a href="#">{profileUser.website}</a></div>
                )}
                {profileUser.joined && (
                  <div className="item"><IconCalendar size={15} stroke={1.5} /> Joined {profileUser.joined}</div>
                )}
              </div>

              <div className="stats">
                <div className="stat"><span className="num">{profileUser.posts}</span><span className="lbl">posts</span></div>
                <div className="stat"><span className="num">{Number(profileUser.followers).toLocaleString()}</span><span className="lbl">followers</span></div>
                <div className="stat"><span className="num">{profileUser.following}</span><span className="lbl">following</span></div>
              </div>
            </div>
          </div>

          <div className="profile-tabs">
            {TABS.map(tab => (
              <div
                key={tab}
                className={`profile-tab${activeTab === tab ? " active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>

          <div className="profile-thread">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post._id || post.id} post={post} />
              ))
            ) : (
              <p className="profile-status">No posts yet.</p>
            )}
          </div>
        </main>

        <aside className="profile-side">
          <div className="panel">
            <h3>About</h3>
            <div className="info-row"><span className="lbl">Member since</span><span className="val">{profileUser.joined || "—"}</span></div>
          </div>

          <div className="panel">
            <h3>Topics {firstName} posts about</h3>
            <span className="tag-pill"><IconHash size={12} stroke={1.5} />studiolife</span>
            <span className="tag-pill"><IconHash size={12} stroke={1.5} />ceramics</span>
            <span className="tag-pill"><IconHash size={12} stroke={1.5} />productdesign</span>
            <span className="tag-pill"><IconHash size={12} stroke={1.5} />slowliving</span>
          </div>
        </aside>

      </div>
    </div>
  );
}
