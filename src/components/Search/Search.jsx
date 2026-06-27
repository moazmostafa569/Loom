import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  IconSearch, IconLayoutList, IconUser, IconHash,
  IconPhoto, IconBookmark, IconCheck, IconClock, IconX
} from "@tabler/icons-react"
import { getFollowSuggestions, putFollowOrUnfollow } from "../../services/AllPostsServices"
import { useNavigate } from "react-router-dom";

const DEFAULT_AVATAR_URL = 'https://pub-3cba56bacf9f4965bbb0989e07dada12.r2.dev/linkedPosts/default-profile.png';

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
}

const FILTERS = [
  { label: "All", icon: <IconLayoutList size={15} /> },
  { label: "People", icon: <IconUser size={15} /> },
  { label: "Topics", icon: <IconHash size={15} /> },
  { label: "Saved", icon: <IconBookmark size={15} /> },
]

const TRENDS = [
  { tag: "#studiolife", name: "Behind the scenes", count: "12.4k posts", accent: "bg-[#ff6b5b]" },
  { tag: "#ceramics", name: "Weekend makers", count: "9.8k posts", accent: "bg-[#8fe3c0]" },
  { tag: "#productdesign", name: "Onboarding takes", count: "5.7k posts", accent: "bg-[#f4c95d]" },
  { tag: "#slowliving", name: "Morning routines", count: "3.2k posts", accent: "bg-[#b9a8f0]" },
]

const PEOPLE = [
  { initials: "JM", bg: "bg-[#ff6b5b]", text: "text-[#2a0f0a]", name: "Jules Marchetti", handle: "@jules_m", bio: "Studio photographer · lighting nerd", verified: true, following: false },
  { initials: "RO", bg: "bg-[#8fe3c0]", text: "text-[#0d2b20]", name: "Rohan Oduya", handle: "@rohan", bio: "Product thinker · design systems", verified: false, following: true },
  { initials: "TK", bg: "bg-[#f4c95d]", text: "text-[#3a2a04]", name: "Tariq Khan", handle: "@tariq.k", bio: "Learning pottery one bad mug at a time", verified: false, following: false },
  { initials: "PV", bg: "bg-[#b9a8f0]", text: "text-[#1f1734]", name: "Priya Venkat", handle: "@priya_v", bio: "Shipping small things with big pride", verified: true, following: false },
]

const RECENT = ["#ceramics", "mirasolano", "#studiolife", "product design onboarding"]

export default function Search() {
  const [query, setQuery] = useState("")
  const [activeFilter, setFilter] = useState("All")
  const [followMap, setFollowMap] = useState(
    Object.fromEntries(PEOPLE.map(p => [p.handle, p.following]))
  )
  const [followSuggestions, setFollowSuggestions] = useState([])
  const peopleToShow = Array.isArray(followSuggestions) && followSuggestions.length > 0 ? followSuggestions : PEOPLE;
  const [recent, setRecent] = useState(RECENT)
  const navigate = useNavigate()
  const showTrending = activeFilter === "All" || activeFilter === "Topics"
  const showPeopleSection = activeFilter === "All" || activeFilter === "People"

  function handleFilterClick(filter) {
    if (filter === 'Saved') {
      navigate('/saved_posts')
      return
    }
    setFilter(filter)
  }

  function getSuggestionKey(suggestion) {
    return suggestion._id || suggestion.id || suggestion.username || suggestion.handle || suggestion.name || '';
  }

  function isSuggestionFollowing(suggestion) {
    return suggestion?.isFollowing ?? suggestion?.followed ?? suggestion?.isFollowed ?? false;
  }

  const { data: followSuggestionsData } = useQuery({
    queryKey: ['followingSuggestions'],
    queryFn: async () => {
      const { data } = await getFollowSuggestions();
      return Array.isArray(data?.suggestions) ? data.suggestions : [];
    },
  })

  useEffect(() => {
    const suggestions = followSuggestionsData || [];
    setFollowSuggestions(suggestions);
    setFollowMap((prev) => ({
      ...prev,
      ...Object.fromEntries(suggestions.map((suggestion) => [getSuggestionKey(suggestion), isSuggestionFollowing(suggestion)])),
    }));
  }, [followSuggestionsData])

  async function handleToggleFollow(userId, key) {
    if (!key) return;

    if (!userId) {
      setFollowMap((prev) => ({ ...prev, [key]: !prev[key] }));
      return;
    }

    try {
      await putFollowOrUnfollow(userId);
      setFollowMap((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    } catch (error) {
      console.log('Follow toggle failed:', error);
    }
  }


  function getUserProfile(userId) {
    if (!userId) return;
    navigate(`/user_profile/${userId}`);
  }

  return (
    <div className="min-h-screen bg-[#15131c] text-[#f5f3f0] font-sans  px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl flex flex-col !m-auto">

        {/* Search bar */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3 bg-[#1e1b28] border-[1.5px] border-[#8fe3c0] rounded-full px-5 h-[52px]">
            <IconSearch size={18} className="text-[#8fe3c0] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search people, threads, topics…"
              className="flex-1 bg-transparent outline-none text-[15px] text-[#f5f3f0] placeholder:text-[#5e5a6e]"
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-2.5 sm:gap-3 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.label}
                onClick={() => handleFilterClick(f.label)}
                className={`flex items-center gap-2 border cursor-pointer rounded-full !px-4 py-2 text-[13px] transition-colors ${activeFilter === f.label
                  ? "bg-[rgba(143,227,192,.14)] border-[#8fe3c0] text-[#8fe3c0]"
                  : "border-white/10 text-[#9b97a8] hover:text-white hover:border-white/20"
                  }`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        </section>

        {showTrending && (
          <section className="flex flex-col gap-4">
            <p className="font-mono text-[11px] tracking-widest uppercase text-[#5e5a6e]">
              Trending on Loom
            </p>
            <div className="grid !grid-cols-2 !sm:grid-cols-2 !gap-4 !sm:gap-5">
              {TRENDS.map(t => (
                <div
                  key={t.tag}
                  className="relative bg-[#1e1b28] border border-white/[.08] rounded-2xl !p-5 overflow-hidden cursor-pointer hover:border-white/20 transition-colors"
                >
                  <div className={`absolute top-0 right-0 w-14 h-14 rounded-bl-[60px] rounded-tr-2xl opacity-20 ${t.accent}`} />
                  <p className="font-mono text-[12px] text-[#8fe3c0] mb-2">{t.tag}</p>
                  <p className="text-[14px] font-semibold mb-1.5">{t.name}</p>
                  <p className="font-mono text-[12px] text-[#5e5a6e]">{t.count}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {showPeopleSection && (
          <section className="flex flex-col !gap-4">
            <p className="font-mono text-[11px] tracking-widest uppercase text-[#5e5a6e]">
              People you might know
            </p>
            <div className="flex flex-col !gap-3">
              {peopleToShow.map(p => {
                const isLocal = Boolean(p.initials);
                const handleKey = p.handle || p.username || p._id || p.name;

                if (isLocal) {
                  return (
                    <div
                      key={handleKey}
                      className="flex items-center !gap-4 !px-4 !py-4 rounded-2xl border border-transparent hover:bg-[#1e1b28] hover:border-white/[.06] transition-colors "
                    >
                      <div className={`w-12 h-12 rounded-[12px] ${p.bg} ${p.text} flex items-center justify-center font-bold text-[14px] shrink-0`}>
                        {p.initials}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col !gap-0.5">
                        <div className="flex items-center !gap-1.5 text-[14px] font-semibold">
                          {p.name}
                          {p.verified && (
                            <span className="inline-flex w-[15px] h-[15px] rounded-full bg-[#8fe3c0] items-center justify-center">
                              <IconCheck size={9} className="text-[#0d2b20]" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[12px] text-[#5e5a6e]">{p.handle}</p>
                        <p className="text-[12.5px] text-[#9b97a8] truncate">{p.bio}</p>
                      </div>
                      <button
                        onClick={() => handleToggleFollow(null, p.handle)}
                        className={`shrink-0 border rounded-full !px-4 cursor-pointer !py-2 text-[12.5px] transition-colors ${followMap[p.handle]
                          ? "bg-[rgba(143,227,192,.14)] border-[#8fe3c0] text-[#8fe3c0]"
                          : "border-white/10 text-[#f5f3f0] hover:border-white/30"
                          }`}
                      >
                        {followMap[p.handle] ? "Following" : "Follow"}
                      </button>
                    </div>
                  );
                }

                const photo = (p.photo || p.avatar || p.image || '').trim();
                const showImage = photo && photo !== DEFAULT_AVATAR_URL;
                const name = p.name || p.fullname || p.username || '';
                const initials = getInitials(name);

                return (
                  <div
                    key={p._id || handleKey}
                    className="flex items-center !gap-4 !px-4 !py-4 rounded-2xl border border-transparent hover:bg-[#1e1b28] hover:border-white/[.06] transition-colors "
                  >
                    <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center font-bold text-[14px] shrink-0 bg-[#2a2730] overflow-hidden cursor-pointer`}>
                      {showImage ? (
                        <img src={photo} alt={name} className="w-full h-full object-cover rounded-[12px]" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div onClick={() => getUserProfile(p._id)}
                      className="flex-1 min-w-0 flex flex-col !gap-0.5 cursor-pointer">
                      <div className="flex items-center !gap-1.5 text-[14px] font-semibold">
                        {name}
                      </div>
                      <p className="font-mono text-[12px] text-[#5e5a6e]">{`@${p.username || p.handle || (p.name || '').toLowerCase().split(/\s+/)[0]}`}</p>
                      <p className="text-[12.5px] text-[#9b97a8] truncate">{p.bio || ''}</p>
                    </div>
                    <button
                      onClick={() => handleToggleFollow(p._id, handleKey)}
                      className={`shrink-0 border rounded-full !px-4 cursor-pointer !py-2 text-[12.5px] transition-colors ${followMap[handleKey]
                        ? "bg-[rgba(143,227,192,.14)] border-[#8fe3c0] text-[#8fe3c0]"
                        : "border-white/10 text-[#f5f3f0] hover:border-white/30"
                        }`}
                    >
                      {followMap[handleKey] ? "Following" : "Follow"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Recent searches */}
            <section className="flex flex-col  gap-4 pb-6">
              <p className="font-mono text-[11px] tracking-widest uppercase text-[#5e5a6e]">
                Recent searches
              </p>
              <div className="flex flex-col gap-2.5">
                {recent.map(r => (
                  <div
                    key={r}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#1e1b28] text-[13.5px] text-[#9b97a8] cursor-pointer"
                  >
                    <IconClock size={16} className="text-[#5e5a6e] shrink-0" />
                    <span className="flex-1">{r}</span>
                    <button
                      type="button"
                      onClick={() => setRecent(prev => prev.filter(x => x !== r))}
                      className="text-[#5e5a6e] hover:text-[#ff6b5b] transition-colors p-1"
                      aria-label={`Remove ${r} from recent searches`}
                    >
                      <IconX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </section>
        )}
      </div>
    </div>
  )
}
