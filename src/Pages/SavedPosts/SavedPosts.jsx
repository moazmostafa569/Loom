import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconBookmark,
  IconBookmarkOff,
  IconLayoutGrid,
  IconLayoutList,
  IconSearch,
  IconHeart,
  IconMessageCircle,
  IconRepeat,
  IconPlus,
  IconFolder,
  IconSparkles,
  IconBrush,
  IconCode,
  IconCamera,
} from "@tabler/icons-react";

import "./../../styles/saved.css";
import Navbar from "./../../components/Navbar/Navbar";
import { getSavedPosts, savePost } from "../../services/AllPostsServices";
import { Skeleton } from "../AllPosts/Skeleton/Skeleton";
import { getInitials } from "../../utils/PostCard";
import PostCard from './../../components/PostCard/PostCard';


// Posts are loaded from the API on mount.

function fmt(n) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : n;
}


function GridCard({ post, onUnsave }) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);

  return (
    <div className="saved-card">
      {post.media && <div className="sc-img">photo attachment</div>}
      <div className="sc-body">
        <div className="sc-meta">
          <div className={`sc-av av-${post.color}`}>{post.initials}</div>
          <span className="sc-handle">@{post.handle}</span>
        </div>
        <p className="sc-text">{post.text}</p>
        <div className="sc-foot">
          <button
            className={`act sc-likes${liked ? " liked" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "inherit", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", padding: 0 }}
            onClick={() => { setLiked((v) => !v); setLikes((n) => liked ? n - 1 : n + 1); }}
          >
            <IconHeart size={14} stroke={1.5} /> {fmt(likes)}
          </button>
          <button className="sc-unsave" onClick={() => onUnsave(post.id)} aria-label="Unsave">
            <IconBookmarkOff size={15} stroke={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SavedPosts() {
  const [activeCollection, setActiveCollection] = useState("all");
  const [activeTab, setActiveTab] = useState("Posts");
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const { data: savedPostsData, isLoading } = useQuery({
    queryKey: ['savedPosts'],
    queryFn: async () => {
      const { data } = await getSavedPosts();
      let items = [];
      if (!data) items = [];
      else if (Array.isArray(data)) items = data;
      else if (Array.isArray(data.bookmarks)) items = data.bookmarks.map((b) => b.post || b);
      else if (Array.isArray(data.posts)) items = data.posts;
      else if (Array.isArray(data.data?.posts)) items = data.data.posts;
      else items = [];

      return items.map((p) => {
        const user = p.user || p.author || {};
        const name = user.name || user.fullname || p.name || "Unknown";
        const username = user.username || p.handle || (name || "").toLowerCase().replace(/\s+/g, "_");
        const photo = (user.photo || user.avatar || user.image || "").trim();
        const color = p.color || user.color || "lav";
        return {
          id: p._id || p.id,
          section: p.section || "Saved",
          user: {
            name,
            username,
            photo,
            color,
          },
          name,
          handle: username,
          initials: getInitials(name),
          color,
          time: p.time || p.createdAt || "",
          text: p.body || p.text || p.content || "",
          tag: p.tag || "",
          image: p.image || p.imageUrl || p.photo || p.mediaUrl || "",
          media: !!(p.image || p.media || p.hasMedia),
          likes: p.likes || p.likesCount || 0,
          comments: p.comments || p.commentsCount || 0,
          reposts: p.reposts || p.repostsCount || 0,
          liked: !!p.liked,
          collection: p.collection || p.bookmark?.collection || "all",
        };
      });
    },
  })
  const posts = savedPostsData || []

  async function unsave(id) {
    try {
      await savePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.log("Failed to toggle bookmark:", error);
      // keep post in list on failure
    }
  }

  const filtered = posts.filter((p) => {
    const matchCol = activeCollection === "all" || p.collection === activeCollection;
    const matchSearch = !search || p.text.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCol && matchSearch;
  });

  const sections = [...new Set(filtered.map((p) => p.section))];

  const SIDE_COLLECTIONS = [
    { id: "design", label: "Design",      icon: "gold",  iconCmp: IconBrush,    count: 12 },
    { id: "dev",    label: "Dev",          icon: "mint",  iconCmp: IconCode,     count: 9  },
    { id: "inspo",  label: "Inspo",        icon: "lav",   iconCmp: IconSparkles, count: 8  },
    { id: "photo",  label: "Photography",  icon: "coral", iconCmp: IconCamera,   count: 5  },
  ];

  return (
    <div className="saved-layout ">
    

      <main className="saved-main ">
        <div className="saved-header ">
          <div className="saved-header-top
          ">
            <div>
              <h1>Saved</h1>
              <div className="saved-count">{posts.length} posts</div>
            </div>
            <div className="saved-view-btns">
              <button
                className={view === "list" ? "active" : ""}
                onClick={() => setView("list")}
                aria-label="List view"
              >
                <i className="ti ti-layout-list" aria-hidden="true" />
              </button>
              <button
                className={view === "grid" ? "active" : ""}
                onClick={() => setView("grid")}
                aria-label="Grid view"
              >
                <i className="ti ti-layout-grid" aria-hidden="true" />
              </button>
            </div>
          </div>


          <div className="saved-tabs">
            {["Posts", "Threads", "Media"].map((tab) => (
              <div
                key={tab}
                className={`saved-tab${activeTab === tab ? " active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>

        <div className="saved-search">
          <div className="saved-search-box">
            <i className="ti ti-search" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search saved posts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search saved posts"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="saved-section">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="saved-empty">
            <div className="empty-icon">
              <i className="ti ti-bookmark" aria-hidden="true" />
            </div>
            <h3>Nothing saved here yet</h3>
            <p>Tap the bookmark icon on any post to save it — it'll show up here.</p>
          </div>
        ) : view === "list" ? (
          <div className="saved-section">
            {sections.map((section) => (
              <div key={section}>
                <div className="saved-section-label">{section}</div>
                {filtered
                  .filter((p) => p.section === section)
                  .map((post) => (
                    <PostCard key={post.id} post={post} onUnsave={unsave} />
                  ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="saved-section">
            <div className="saved-grid">
              {filtered.map((post) => (
                <GridCard key={post.id} post={post} onUnsave={unsave} />
              ))}
            </div>
          </div>
        )}
      </main>

      <aside className="saved-side">
        <div className="side-panel">
          <h3>Collections</h3>
          {SIDE_COLLECTIONS.map((col) => (
            <div
              className="col-item"
              key={col.id}
              onClick={() => setActiveCollection(col.id)}
            >
              <div className={`col-icon ${col.icon}`}>
                <col.iconCmp size={17} stroke={1.5} />
              </div>
              <div className="col-info">
                <div className="name">{col.label}</div>
                <div className="count">{col.count} posts</div>
              </div>
            </div>
          ))}
         
        </div>

        <div className="side-panel">
          <h3>Your saves</h3>
          <div className="stat-row"><span className="lbl">Total saved</span><span className="val">{posts.length}</span></div>
          <div className="stat-row"><span className="lbl">Collections</span><span className="val">4</span></div>
          <div className="stat-row"><span className="lbl">This week</span><span className="val">7</span></div>
          <div className="stat-row"><span className="lbl">Most saved tag</span><span className="val" style={{ color: "var(--mint)" }}>#design</span></div>
        </div>
      </aside>
    </div>
  );
}
