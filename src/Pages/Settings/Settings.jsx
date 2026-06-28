import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
  IconUser,
  IconBell,
  IconPalette,
  IconShieldLock,
} from "@tabler/icons-react";
import { toast } from "react-toastify";

import "./../../styles/settings.css";
import { getProfile } from "../../services/profileServices";
import { changePassword } from "../../services/authServices";
import { settingsChangePasswordSchema } from "../../utils/authschema";
import { zodResolver } from "../../utils/zodResolver";
import { getInitials } from "../../utils/PostCard";
import { getThemePreference, setThemePreference } from "../../utils/theme";

const SECTIONS = [
  { id: "account", label: "Account", icon: IconUser },
  { id: "notifications", label: "Notifications", icon: IconBell },
  { id: "privacy", label: "Privacy", icon: IconShieldLock },
];

const SECTION_META = {
  account: {
    title: "Account settings",
    description: "Manage how your profile looks and how people find you on Loom.",
  },
  notifications: {
    title: "Notifications",
    description: "Choose what you want to be notified about.",
  },
  privacy: {
    title: "Privacy & safety",
    description: "Control who can see your activity and reach you.",
  },
};

const DEFAULT_AVATAR_URL =
  "https://pub-3cba56bacf9f4965bbb0989e07dada12.r2.dev/linkedPosts/default-profile.png";

function Switch({ on, onToggle }) {
  return (
    <button
      type="button"
      className={`switch${on ? " on" : ""}`}
      onClick={onToggle}
      role="switch"
      aria-checked={on}
    >
      <span className="knob" />
    </button>
  );
}

function ToggleRow({ label, sub, on, onToggle }) {
  return (
    <div className="toggle-row">
      <div>
        <div className="t-label">{label}</div>
        {sub && <div className="t-sub">{sub}</div>}
      </div>
      <Switch on={on} onToggle={onToggle} />
    </div>
  );
}

function parseApiErrorMessage(error) {
  const responseData = error?.response?.data;
  if (responseData) {
    if (typeof responseData.message === "string" && responseData.message) {
      return responseData.message;
    }
    if (Array.isArray(responseData.errors)) {
      return responseData.errors.join(". ");
    }
    if (typeof responseData.errors === "object" && responseData.errors) {
      return Object.values(responseData.errors).flat().join(". ");
    }
    if (typeof responseData === "string") {
      return responseData;
    }
  }
  return error?.message || "Failed to update password.";
}

function mapProfileUser(apiUser) {
  if (!apiUser) return null;

  const photo = String(apiUser.photo || apiUser.avatar || apiUser.image || "").trim();
  const invalidPhoto = !photo || photo === DEFAULT_AVATAR_URL;

  return {
    name: apiUser.name || apiUser.fullname || "",
    username: apiUser.username || apiUser.handle || "",
    email: apiUser.email || "",
    bio: apiUser.bio || apiUser.about || "",
    location: apiUser.location || "",
    website: apiUser.website || "",
    photo: invalidPhoto ? "" : photo,
  };
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState("account");
  const [profileEdits, setProfileEdits] = useState({});
  const [passwordFeedback, setPasswordFeedback] = useState({ success: "", error: "" });

  const [privacy, setPrivacy] = useState({
    privateAccount: false,
    allowMentions: true,
    showActivity: true,
    dmFromAnyone: false,
  });

  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    followers: false,
    mentions: true,
  });

  const [theme, setTheme] = useState(() => getThemePreference());

  useEffect(() => {
    if (theme !== "auto") return undefined;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => setThemePreference("auto");

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  function handleThemeChange(nextTheme) {
    setTheme(nextTheme);
    setThemePreference(nextTheme);
  }

  const { data: profileResponse, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["settings-profile"],
    queryFn: getProfile,
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm({
    mode: "onChange",
    resolver: zodResolver(settingsChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      rePassword: "",
    },
  });

  function togglePrivacy(key) {
    setPrivacy((p) => ({ ...p, [key]: !p[key] }));
  }

  function toggleNotification(key) {
    setNotifications((n) => ({ ...n, [key]: !n[key] }));
  }

  function handleProfileFieldChange(field, value) {
    setProfileEdits((prev) => ({ ...prev, [field]: value }));
  }

  async function submitPasswordChange(data) {
    setPasswordFeedback({ success: "", error: "" });

    const payload = {
      password: data.currentPassword,
      newPassword: data.password,
    };

    console.log("[Settings] changePassword payload:", payload);

    try {
      const response = await changePassword(payload);
      console.log("[Settings] changePassword response:", response);

      const message = response?.message || "Password updated successfully.";
      toast.success(message);
      setPasswordFeedback({ success: message, error: "" });
      resetPasswordForm();
    } catch (error) {
      console.error("[Settings] changePassword error:", error.response?.data ?? error);
      const errorMessage = parseApiErrorMessage(error);
      toast.error(errorMessage);
      setPasswordFeedback({ success: "", error: errorMessage });
    }
  }

  const apiUser = profileResponse?.data?.user ?? profileResponse?.user ?? profileResponse?.data ?? null;
  const mappedProfile = mapProfileUser(apiUser);
  const profileForm = {
    name: profileEdits.name ?? mappedProfile?.name ?? "",
    username: profileEdits.username ?? mappedProfile?.username ?? "",
    email: profileEdits.email ?? mappedProfile?.email ?? "",
    bio: profileEdits.bio ?? mappedProfile?.bio ?? "",
    location: profileEdits.location ?? mappedProfile?.location ?? "",
    website: profileEdits.website ?? mappedProfile?.website ?? "",
  };
  const avatarInitials = getInitials(profileForm.name || profileForm.email || "User");
  const avatarPhoto = mappedProfile?.photo || "";
  const sectionMeta = SECTION_META[activeSection] ?? SECTION_META.account;

  return (
    <div className="settings-page">
      <div className="settings-layout ">
        <nav className="setnav " aria-label="Settings sections ">
          <h2>Settings</h2>
          {SECTIONS.map((s, i) => (
            <div
              key={s.id}
              className={`setnav-item${activeSection === s.id ? " active" : ""}`}
              onClick={() => setActiveSection(s.id)}
            >
              <div className="node-col">
                <div className={`dot${activeSection === s.id ? " active" : ""}`} />
                {i < SECTIONS.length - 1 && <div className="seg" />}
              </div>
              <button type="button" className="label">
                <s.icon size={17} stroke={1.5} /> {s.label}
              </button>
            </div>
          ))}
        </nav>

        <main className="settings-content  ">
          <div className="top ">
            <h1>{sectionMeta.title}</h1>
            <p>{sectionMeta.description}</p>
          </div>

          {activeSection === "account" && (
            <>
              <div className="settings-panel">
                <h3>Profile</h3>
                <p className="desc">This information appears on your public profile.</p>

                {profileLoading && <p className="settings-status">Loading profile...</p>}
                {profileError && (
                  <p className="settings-status settings-status--error">
                    {profileError.response?.data?.message || profileError.message || "Failed to load profile."}
                  </p>
                )}

                {!profileLoading && !profileError && (
                  <>
                    <div className="settings-avatar-row">
                      {avatarPhoto ? (
                        <img src={avatarPhoto} alt={profileForm.name || "Profile"} className="settings-avatar-img" />
                      ) : (
                        <div className="settings-avatar-lg">{avatarInitials}</div>
                      )}
                    </div>

                    <div className="settings-row2">
                      <div className="settings-field">
                        <label htmlFor="display-name">Display name</label>
                        <input
                          id="display-name"
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => handleProfileFieldChange("name", e.target.value)}
                        />
                      </div>
                      <div className="settings-field">
                        <label htmlFor="username">Username</label>
                        <input
                          id="username"
                          type="text"
                          value={profileForm.username}
                          onChange={(e) => handleProfileFieldChange("username", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="settings-field">
                      <label htmlFor="bio">Bio</label>
                      <textarea
                        id="bio"
                        value={profileForm.bio}
                        onChange={(e) => handleProfileFieldChange("bio", e.target.value)}
                      />
                    </div>

                    <div className="settings-row2">
                      <div className="settings-field">
                        <label htmlFor="location">Location</label>
                        <input
                          id="location"
                          type="text"
                          value={profileForm.location}
                          onChange={(e) => handleProfileFieldChange("location", e.target.value)}
                        />
                      </div>
                      <div className="settings-field">
                        <label htmlFor="website">Website</label>
                        <input
                          id="website"
                          type="text"
                          value={profileForm.website}
                          onChange={(e) => handleProfileFieldChange("website", e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="settings-panel">
                <h3>Email & password</h3>
                <p className="desc">Used for sign-in and account recovery.</p>

                <div className="settings-field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    readOnly
                    className="settings-field--readonly"
                  />
                </div>

                <form className="settings-password-form" onSubmit={handlePasswordSubmit(submitPasswordChange)} noValidate>
                  <div className="settings-field">
                    <label htmlFor="current-password">Current password</label>
                    <input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      {...registerPassword("currentPassword")}
                    />
                    {passwordErrors.currentPassword?.message && (
                      <p className="settings-inline-error">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div className="settings-row2">
                    <div className="settings-field">
                      <label htmlFor="new-password">New password</label>
                      <input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        {...registerPassword("password")}
                      />
                      {passwordErrors.password?.message && (
                        <p className="settings-inline-error">{passwordErrors.password.message}</p>
                      )}
                    </div>
                    <div className="settings-field">
                      <label htmlFor="confirm-password">Confirm new password</label>
                      <input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        {...registerPassword("rePassword")}
                      />
                      {passwordErrors.rePassword?.message && (
                        <p className="settings-inline-error">{passwordErrors.rePassword.message}</p>
                      )}
                    </div>
                  </div>

                  {passwordFeedback.success && (
                    <p className="settings-inline-success" role="status">{passwordFeedback.success}</p>
                  )}
                  {passwordFeedback.error && (
                    <p className="settings-inline-error" role="alert">{passwordFeedback.error}</p>
                  )}

                  <button type="submit" className="btn-fill settings-password-btn" disabled={passwordSubmitting}>
                    {passwordSubmitting ? "Updating..." : "Update password"}
                  </button>
                </form>
              </div>

              <div className="settings-panel">
                <h3><IconPalette size={17} stroke={1.5} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />Appearance</h3>
                <p className="desc">Loom looks best in the dark, but it&apos;s your call.</p>
                <div className="theme-row">
                  {[
                    { id: "dark", label: "Dark", swatch: "swatch-dark" },
                    { id: "light", label: "Light", swatch: "swatch-light" },
                    { id: "auto", label: "Auto", swatch: "swatch-auto" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`theme-opt${theme === t.id ? " active" : ""}`}
                      onClick={() => handleThemeChange(t.id)}
                    >
                      <div className={`theme-swatch ${t.swatch}`} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

            </>
          )}

          {activeSection === "notifications" && (
            <div className="settings-panel">
              <h3>Push & email alerts</h3>
              <p className="desc">Pick the moments you want to hear about.</p>
              <ToggleRow
                label="Likes on your posts"
                sub="When someone likes one of your threads"
                on={notifications.likes}
                onToggle={() => toggleNotification("likes")}
              />
              <ToggleRow
                label="Comments & replies"
                sub="When someone responds to your posts"
                on={notifications.comments}
                onToggle={() => toggleNotification("comments")}
              />
              <ToggleRow
                label="New followers"
                sub="When someone starts following you"
                on={notifications.followers}
                onToggle={() => toggleNotification("followers")}
              />
              <ToggleRow
                label="Mentions"
                sub="When someone tags you in a post"
                on={notifications.mentions}
                onToggle={() => toggleNotification("mentions")}
              />
            </div>
          )}

          {activeSection === "privacy" && (
            <div className="settings-panel">
              <h3>Who can see & reach you</h3>
              <p className="desc">Fine-tune your visibility on Loom.</p>
              <ToggleRow
                label="Private account"
                sub="Only approved followers see your posts"
                on={privacy.privateAccount}
                onToggle={() => togglePrivacy("privateAccount")}
              />
              <ToggleRow
                label="Allow mentions"
                sub="Let others tag you in posts and replies"
                on={privacy.allowMentions}
                onToggle={() => togglePrivacy("allowMentions")}
              />
              <ToggleRow
                label="Show activity status"
                sub="Let followers see when you were last active"
                on={privacy.showActivity}
                onToggle={() => togglePrivacy("showActivity")}
              />
              <ToggleRow
                label="Messages from anyone"
                sub="Allow DMs from people you don't follow"
                on={privacy.dmFromAnyone}
                onToggle={() => togglePrivacy("dmFromAnyone")}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
