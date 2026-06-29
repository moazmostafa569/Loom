import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  IconSearch, IconLayoutList, IconUser, IconHash,
  IconPhoto, IconBookmark, IconCheck, IconClock, IconX
} from "@tabler/icons-react"
import { getFollowSuggestions, putFollowOrUnfollow } from "../../services/AllPostsServices"
import { useNavigate } from "react-router-dom"
import "../../styles/search.css"

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
  { tag: "#studiolife", name: "Behind the scenes", count: "12.4k posts", accent: "coral" },
  { tag: "#ceramics", name: "Weekend makers", count: "9.8k posts", accent: "mint" },
  { tag: "#productdesign", name: "Onboarding takes", count: "5.7k posts", accent: "gold" },
  { tag: "#slowliving", name: "Morning routines", count: "3.2k posts", accent: "lav" },
]

const PEOPLE = [
  { initials: "JM", avClass: "search-person-av--coral", name: "Jules Marchetti", handle: "@jules_m", bio: "Studio photographer · lighting nerd", verified: true, following: false },
  { initials: "RO", avClass: "search-person-av--mint", name: "Rohan Oduya", handle: "@rohan", bio: "Product thinker · design systems", verified: false, following: true },
  { initials: "TK", avClass: "search-person-av--gold", name: "Tariq Khan", handle: "@tariq.k", bio: "Learning pottery one bad mug at a time", verified: false, following: false },
  { initials: "PV", avClass: "search-person-av--lav", name: "Priya Venkat", handle: "@priya_v", bio: "Shipping small things with big pride", verified: true, following: false },
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
    <div className="search-page md:">
      <div className="search-inner">

        <section className="flex flex-col gap-4">
          <div className="search-bar">
            <IconSearch size={18} className="search-bar__icon" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search people, threads, topics…"
              className="search-bar__input"
            />
          </div>

          <div className="search-filters">
            {FILTERS.map(f => (
              <button
                key={f.label}
                type="button"
                onClick={() => handleFilterClick(f.label)}
                className={`search-filter-btn${activeFilter === f.label ? " active" : ""}`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        </section>

        {showTrending && (
          <section className="flex flex-col gap-4">
            <p className="search-section-label">Trending on Loom</p>
            <div className="search-trends">
              {TRENDS.map(t => (
                <div key={t.tag} className="search-trend-card">
                  <div className={`search-trend-card__accent search-trend-card__accent--${t.accent}`} />
                  <p className="search-trend-card__tag">{t.tag}</p>
                  <p className="search-trend-card__name">{t.name}</p>
                  <p className="search-trend-card__count">{t.count}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {showPeopleSection && (
          <section className="flex flex-col gap-4">
            <p className="search-section-label">People you might know</p>
            <div className="search-people-list">
              {peopleToShow.map(p => {
                const isLocal = Boolean(p.initials);
                const handleKey = p.handle || p.username || p._id || p.name;

                if (isLocal) {
                  return (
                    <div key={handleKey} className="search-person-row">
                      <div className={`search-person-av ${p.avClass}`}>
                        {p.initials}
                      </div>
                      <div className="search-person-info">
                        <div className="search-person-name">
                          {p.name}
                          {p.verified && (
                            <span className="search-person-verified">
                              <IconCheck size={9} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <p className="search-person-handle">{p.handle}</p>
                        <p className="search-person-bio">{p.bio}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(null, p.handle)}
                        className={`search-follow-btn${followMap[p.handle] ? " following" : ""}`}
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
                  <div key={p._id || handleKey} className="search-person-row">
                    <div
                      className="search-person-av search-person-av--default cursor-pointer"
                      onClick={() => getUserProfile(p._id)}
                    >
                      {showImage ? (
                        <img src={photo} alt={name} />
                      ) : (
                        initials
                      )}
                    </div>
                    <div onClick={() => getUserProfile(p._id)} className="search-person-info">
                      <div className="search-person-name">{name}</div>
                      <p className="search-person-handle">{`@${p.username || p.handle || (p.name || '').toLowerCase().split(/\s+/)[0]}`}</p>
                      <p className="search-person-bio">{p.bio || ''}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(p._id, handleKey)}
                      className={`search-follow-btn${followMap[handleKey] ? " following" : ""}`}
                    >
                      {followMap[handleKey] ? "Following" : "Follow"}
                    </button>
                  </div>
                );
              })}
            </div>

            <section className="flex flex-col gap-4 pb-6">
              <p className="search-section-label">Recent searches</p>
              <div className="search-recent-list">
                {recent.map(r => (
                  <div key={r} className="search-recent-item">
                    <IconClock size={16} className="search-recent-item__icon" />
                    <span className="search-recent-item__text">{r}</span>
                    <button
                      type="button"
                      onClick={() => setRecent(prev => prev.filter(x => x !== r))}
                      className="search-recent-item__remove"
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
