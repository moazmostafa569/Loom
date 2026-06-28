import { useContext, useEffect, useRef, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  IconMapPin,
  IconLink,
  IconCalendar,
  IconHash,
  IconX,
  IconCamera,
} from "@tabler/icons-react";
import "./../../styles/profile.css";
import { getAvatarPhoto, getInitials } from "../../utils/PostCard";
import { getProfile, getUserPosts, getUserProfile, uploadProfilePicture } from "../../services/profileServices";
import PostCard from '../../components/PostCard/PostCard';
import { getStoredUserId } from "../../utils/UserDetails";
import { AuthContext } from "../../context/Authcontext";

const TABS = ["Posts", "Replies", "Media", "Likes"];

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

const DEFAULT_USER = {
  name: "Mira Solano",
  handle: "mirasolano",
  initials: "MS",
  bio: "Product designer & weekend potter. I write about small craft, slow mornings, and the spaces between projects. Based in Lisbon.",
  location: "Lisbon, PT",
  website: "mirasolano.studio",
  joined: "Feb 2023",
  posts: 312,
  followers: 4108,
  following: 286,
};

function formatJoinDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function getProfilePhoto(apiUser) {
  return getAvatarPhoto(apiUser?.photo || apiUser?.avatar || apiUser?.image);
}

function getCount(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") {
    if (Array.isArray(value.data)) return value.data.length;
    if (Array.isArray(value.users)) return value.users.length;
    if (Array.isArray(value.followers)) return value.followers.length;
    return Number(value.count ?? value.total ?? value.length ?? 0) || 0;
  }
  return Number(value ?? 0) || 0;
}

function unwrapPeopleArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const nested = [value.data, value.users, value.followers, value.items, value.results]
    .find((item) => Array.isArray(item));
  return nested || [];
}

function extractFollowers(profileResponse, apiUser) {
  const candidates = [
    apiUser?.followers,
    apiUser?.followersList,
    apiUser?.followerUsers,
    apiUser?.followedBy,
    profileResponse?.data?.followers,
    profileResponse?.followers,
    profileResponse?.data?.followerUsers,
  ];

  for (const candidate of candidates) {
    const people = unwrapPeopleArray(candidate);
    if (people.length) return people;
  }

  return [];
}

function getFollowerId(follower) {
  if (typeof follower === "string") return follower;

  const user = follower?.user || follower?.follower || follower?.followedBy || follower?.profile;
  return (
    user?._id ||
    user?.id ||
    follower?._id ||
    follower?.id ||
    follower?.userId ||
    follower?.followerId ||
    follower?.followedById ||
    ""
  );
}

function getInlineFollowerUser(follower) {
  if (!follower || typeof follower === "string") return null;

  const user = follower.user || follower.follower || follower.followedBy || follower.profile || follower;
  const hasDisplayData = user?.name || user?.fullname || user?.username || user?.email || user?.photo || user?.avatar || user?.image;
  return hasDisplayData ? user : null;
}

function unwrapProfileUser(response) {
  return response?.data?.user ?? response?.user ?? response?.data ?? response ?? null;
}

function normalizeFollower(follower, index, fetchedUser = null) {
  const user = fetchedUser || getInlineFollowerUser(follower);

  if (!user || typeof user !== "object") return null;

  const name = user.name || user.fullname || user.username || user.email?.split("@")[0];
  if (!name) return null;

  const handle = user.username || user.handle || user.email?.split("@")[0] || name.trim().split(/\s+/)[0]?.toLowerCase() || "user";
  const avatarClasses = ["av-mint", "av-gold", "av-lav", "av-coral"];

  return {
    id: getFollowerId(follower) || user._id || user.id || user.email || user.username || `${name}-${index}`,
    name,
    handle,
    initials: getInitials(name),
    photo: getAvatarPhoto(user.photo || user.avatar || user.image),
    colorClass: avatarClasses[index % avatarClasses.length],
  };
}

function mapApiUser(apiUser) {
  if (!apiUser) return null;

  return {
    name: apiUser.name || apiUser.fullname || "User",
    handle: apiUser.username || apiUser.handle || apiUser.email?.split("@")[0] || "user",
    bio: apiUser.bio || apiUser.about || "",
    location: apiUser.location || "",
    website: apiUser.website || "",
    joined: formatJoinDate(apiUser.createdAt) || apiUser.joined || "",
    posts: apiUser.postsCount ?? getCount(apiUser.posts),
    followers: apiUser.followersCount ?? getCount(apiUser.followers),
    following: apiUser.followingCount ?? getCount(apiUser.following),
    photo: getProfilePhoto(apiUser),
  };
}





export default function MyProfile() {
  const [postsError, setPostsError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [avatarOptionsOpen, setAvatarOptionsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");
  const [myPosts, setMyPosts] = useState([]);
  const { setMyImage, setMyName } = useContext(AuthContext);

  const { data: profileResponse, isLoading: loading, error: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await getProfile();
      setMyImage(response?.data?.user?.photo || response?.user?.photo || "");
      setMyName(response?.data?.user?.name || response?.user?.name || response?.data?.user?.fullname || response?.user?.fullname || "");
      return response;
    },
  })

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function openFilePicker() {
    setAvatarOptionsOpen((open) => !open);
  }

  function closeAvatarPreview() {
    setAvatarPreviewOpen(false);
  }

  function handleOpenImage() {
    if (!avatarSrc) return;
    setAvatarPreviewOpen(true);
    setAvatarOptionsOpen(false);
  }

  function handleChangeImage() {
    fileInputRef.current?.click();
    setAvatarOptionsOpen(false);
  }

  function handleFileSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextPreviewUrl;
    setSelectedFile(file);
    setPreviewUrl(nextPreviewUrl);
    setUploadError(null);
    event.target.value = "";
  }

  function cancelPhotoSelection() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadError(null);
  }

  async function handleUploadPhoto() {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("photo", selectedFile);
      await uploadProfilePicture(formData);
      if (typeof refetchProfile === 'function') await refetchProfile();
      cancelPhotoSelection();
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      setUploadError(err.response?.data?.message || err.message || "Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function fetchMyPosts() {
      const storedUserId = getStoredUserId();
      const apiUser = profileResponse?.data?.user ?? profileResponse?.user ?? profileResponse?.data ?? null;
      const fallbackUserId = apiUser?._id || apiUser?.id || null;
      const currentUserId = storedUserId || fallbackUserId;

      if (!currentUserId) {
        if (!profileResponse) {
          return;
        }
        setPostsError("Unable to load posts: missing current user ID.");
        return;
      }

      setPostsError(null);

      try {
        const res = await getUserPosts(currentUserId);
        const postsData =
          res?.data?.posts ??
          res?.posts ??
          (Array.isArray(res?.data) ? res.data : []) ??
          [];

        if (mounted) {
          setMyPosts(Array.isArray(postsData) ? postsData : []);
        }
      } catch (error) {
        console.error("Error fetching user posts:", error);
        if (mounted) {
          setPostsError(error.response?.data?.message || error.message || "Failed to load user posts.");
        }
      }
    }

    fetchMyPosts();

    return () => {
      mounted = false;
    };
  }, [profileResponse]);


  const apiUser = profileResponse?.data?.user ?? profileResponse?.user ?? profileResponse?.data ?? null;
  const profileUser = mapApiUser(apiUser) ?? DEFAULT_USER;
  const followerRefs = extractFollowers(profileResponse, apiUser);
  const followerIdsToFetch = followerRefs
    .filter((follower) => !getInlineFollowerUser(follower))
    .map(getFollowerId)
    .filter(Boolean)
    .filter((id, index, ids) => ids.indexOf(id) === index);
  const followerProfileQueries = useQueries({
    queries: followerIdsToFetch.map((followerId) => ({
      queryKey: ["profile-follower", followerId],
      queryFn: () => getUserProfile(followerId),
      enabled: Boolean(followerId),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const followerProfilesById = new Map(
    followerIdsToFetch.map((followerId, index) => [
      followerId,
      unwrapProfileUser(followerProfileQueries[index]?.data),
    ])
  );
  const followersLoading = followerProfileQueries.some((query) => query.isLoading || query.isFetching);
  const followersPreview = followerRefs
    .map((follower, index) => normalizeFollower(follower, index, followerProfilesById.get(getFollowerId(follower))))
    .filter(Boolean)
    .slice(0, 3);
  const fetchError = profileError
    ? profileError.response?.data?.message || profileError.message || "Failed to load profile"
    : null;
  const avatarSrc = previewUrl || profileUser.photo || "";
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

  return <>
    <div className="profile-page ">
      <div className="profile-grid">

        <main className="profile-main lg:!-ms-10 ">
          <ProfileBanner />

          <div className={`profile-head${selectedFile ? " profile-head--pending-upload" : ""}`}>
            {<div className="avatar-xl avatar-xl--upload">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="avatar-xl__input"
                onChange={handleFileSelected}
                aria-hidden="true"
                tabIndex={-1}
              />

              <button
                type="button"
                className="avatar-xl__trigger"
                onClick={openFilePicker}
                aria-label={avatarSrc ? "Open avatar options" : "Upload profile photo"}
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt={`${profileUser.name} profile`} className="avatar-xl__image" />
                ) : (
                  <span className="avatar-xl__initials">{initials}</span>
                )}
                <span className="avatar-xl__overlay" aria-hidden="true">
                  <IconCamera size={18} stroke={1.75} />
                </span>
              </button>

              <span className="status" />

              {avatarOptionsOpen && !selectedFile && (
                <div className="avatar-xl__actions avatar-xl__actions--dual">
                  {avatarSrc && (
                    <button
                      type="button"
                      className="avatar-xl__btn avatar-xl__btn--secondary bg-primary"
                      onClick={handleOpenImage}
                    >
                      Open image
                    </button>
                  )}
                  <button
                    type="button"
                    className="avatar-xl__btn avatar-xl__btn--primary"
                    onClick={handleChangeImage}
                  >
                    Change image
                  </button>
                </div>
              )}

              {selectedFile && (
                <div className="avatar-xl__actions">
                  <button
                    type="button"
                    className="avatar-xl__btn avatar-xl__btn--primary"
                    onClick={handleUploadPhoto}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Save photo"}
                  </button>
                  <button
                    type="button"
                    className="avatar-xl__btn avatar-xl__btn--ghost"
                    onClick={cancelPhotoSelection}
                    disabled={uploading}
                    aria-label="Cancel photo selection"
                  >
                    <IconX size={16} stroke={2} />
                  </button>
                </div>
              )}
            </div>

            }
            {uploadError && (
              <p className="profile-upload-error" role="alert">{uploadError}</p>
            )}

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

            <div className="profile-actions">
              <button className="btn-outline !hidden" aria-label="Notify on posts">
                {/* <IconBell size={16} stroke={1.5} /> */}
              </button>
              <button className="btn-outline !hidden">
                {/* <IconMail size={16} stroke={1.5} /> Message */}
              </button>
              {/* <button className="btn-fill">Follow</button> */}
            </div>

            <div className="profile-info !pt-6">
              <h1>{profileUser.name}</h1>
              <div className="handle">@{profileUser.handle}</div>

              <div className="meta-row">
                <div className="item"><IconMapPin size={15} stroke={1.5} /> {profileUser.location}</div>
                <div className="item"><IconLink size={15} stroke={1.5} /> <a href="#">{profileUser.website}</a></div>
                <div className="item"><IconCalendar size={15} stroke={1.5} /> Joined {profileUser.joined}</div>
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

          <div className="profile-thread ">
            {postsError ? (
              <p className="profile-status profile-status--error">{postsError}</p>
            ) : myPosts.length > 0 ? (
              myPosts.map((post) => (
                <PostCard key={post._id || post.id} post={post} isLast={false} user={profileUser} />
              ))
            ) : (
              <p className="profile-status">No posts found.</p>
            )}
          </div>
        </main>

        <aside className="profile-side">
          <div className="panel">
            <h3>About</h3>
            <div className="info-row"><span className="lbl">Member since</span><span className="val">{profileUser.joined}</span></div>
            <div className="info-row"><span className="lbl">Threads started</span><span className="val">94</span></div>
            <div className="info-row"><span className="lbl">Replies sent</span><span className="val">1,840</span></div>
            <div className="info-row"><span className="lbl">Last active</span><span className="val">2h ago</span></div>
          </div>

          <div className="panel">
            <h3>Topics {firstName} posts about</h3>
            <span className="tag-pill"><IconHash size={12} stroke={1.5} />studiolife</span>
            <span className="tag-pill"><IconHash size={12} stroke={1.5} />ceramics</span>
            <span className="tag-pill"><IconHash size={12} stroke={1.5} />productdesign</span>
            <span className="tag-pill"><IconHash size={12} stroke={1.5} />slowliving</span>
          </div>

          <div className="panel">
            <h3>Followed by people you know</h3>
            {followersPreview.length ? (
              followersPreview.map((follower) => (
                <div className="mutual" key={follower.id}>
                  <div className={`avatar ${follower.photo ? "avatar--image" : follower.colorClass}`}>
                    {follower.photo ? (
                      <img src={follower.photo} alt={`${follower.name} profile`} />
                    ) : (
                      follower.initials
                    )}
                  </div>
                  <div className="info">
                    <div className="name">{follower.name}</div>
                    <div className="handle">@{follower.handle}</div>
                  </div>
                </div>
              ))
            ) : followersLoading ? (
              <p className="profile-side-empty">Loading followers...</p>
            ) : (
              <p className="profile-side-empty">No followers yet.</p>
            )}
          </div>
        </aside>

      </div >
    </div >
  </>
}
