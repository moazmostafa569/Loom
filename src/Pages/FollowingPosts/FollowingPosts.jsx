import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import './../../styles/AllPosts.Module.css'
import { IconSearch, IconRepeat, IconBookmarkOff, IconBookmark, IconPhotoPlus, IconMessageCircle, IconGif, IconMoodSmile, IconMapPin, IconHeart, IconX } from '@tabler/icons-react';
import { GifPicker } from 'gif-picker-react';
import { Giphy } from 'gif-picker-react/providers/giphy';
import { createPost, getAllFollowingPosts, getFollowSuggestions, putFollowOrUnfollow } from '../../services/AllPostsServices';
import PostCard from '../../components/PostCard/PostCard'
import { Skeleton } from '../AllPosts/Skeleton/Skeleton'
import { AuthContext } from '../../context/Authcontext';
import { getAvatarPhoto } from '../../utils/PostCard';

const DEFAULT_AVATAR_URL = 'https://pub-3cba56bacf9f4965bbb0989e07dada12.r2.dev/linkedPosts/default-profile.png';

function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return parts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
}

export default function FollowingPosts() {


    const [isPosting, setIsPosting] = useState(false)
    const [comment, setComment] = useState('')
    const navigate = useNavigate()
    const [displayPhoto, setDisplayPhoto] = useState(null)
    const [sendPhoto, setSendPhoto] = useState(null)
    const [openImageSrc, setOpenImageSrc] = useState('')
    const openImage = (src) => setOpenImageSrc(src || '');
    const closeImage = () => setOpenImageSrc('');
    const [postContent, setPostContent] = useState('')
    const [showGifPicker, setShowGifPicker] = useState(false)
    const [selectedGifUrl, setSelectedGifUrl] = useState('')
    const [followState, setFollowState] = useState({})
    const inputPhoto = useRef(null)
    const gifPickerRef = useRef(null)
    const giphyApiKey = import.meta.env.VITE_GIPHY_API_KEY || ''
    const gifProvider = useMemo(() => (giphyApiKey ? Giphy(giphyApiKey) : null), [giphyApiKey])
    let { email, myImage, myName } = useContext(AuthContext)
    const avatarSrc = getAvatarPhoto(myImage)
    const avatarName = myName?.trim() || email || 'User'
    const initials = getInitials(avatarName)

    const { data: followingPostsData, isLoading } = useQuery({
        queryKey: ['followingPosts'],
        queryFn: async () => {
            const response = await getAllFollowingPosts()
            return response?.data?.posts || []
        },
    })
    const posts = followingPostsData || []


    function searchBtn() {
        navigate('/search')
    }
    function FollowingBtn() {
        navigate('/following')
    }

    function ForYouBtn() {
        navigate('/')
    }

    function handleUploadPhoto() {
        if (inputPhoto.current) {
            inputPhoto.current.click()
        }
    }

    function handleSelectedImg(event) {
        const file = event?.target?.files?.[0]
        if (!file) return

        setSendPhoto(file)
        setDisplayPhoto(URL.createObjectURL(file))
        setSelectedGifUrl('')
    }

    function cancelPhoto() {
        setDisplayPhoto(null)
        setSendPhoto(null)
    }

    const handleGifs = () => {
        setShowGifPicker((prev) => {
            return !prev
        })
    }

    const handleGifSelect = (gif) => {
        const gifUrl = gif?.imageUrl || gif?.preview?.imageUrl || ''
        if (!gifUrl) return

        setSelectedGifUrl(gifUrl)
        setShowGifPicker(false)
        setSendPhoto(null)
        setDisplayPhoto(null)
    }

    function cancelGif() {
        setSelectedGifUrl('')
    }

    function getSuggestionKey(suggestion) {
        return suggestion._id || suggestion.id || suggestion.username || suggestion.handle || suggestion.name || '';
    }

    function isSuggestionFollowing(suggestion) {
        return suggestion?.isFollowing ?? suggestion?.followed ?? suggestion?.isFollowed ?? false;
    }

    async function handleFetchingPost() {
        if (!postContent.trim() && !sendPhoto && !selectedGifUrl) return

        try {
            setIsPosting(true)
            const formData = new FormData();
            let body = postContent.trim();
            if (selectedGifUrl) {
                body = body ? `${body}\n${selectedGifUrl}` : selectedGifUrl;
            }
            formData.append('body', body);
            if (sendPhoto) {
                formData.append('image', sendPhoto);
            }
            await createPost(formData);
            setPostContent('')
            setDisplayPhoto(null)
            setSendPhoto(null)
            setSelectedGifUrl('')

        } catch (error) {
            console.log(error);

        } finally {
            setIsPosting(false);
        }
    }


    const { data: followSuggestionsData } = useQuery({
        queryKey: ['followingSuggestions'],
        queryFn: async () => {
            const { data } = await getFollowSuggestions();
            return Array.isArray(data?.suggestions) ? data.suggestions : [];
        },
    })
    const followSuggestions = followSuggestionsData || []

    useEffect(() => {
        setFollowState((prev) => ({
            ...prev,
            ...Object.fromEntries(followSuggestions.map((suggestion) => [getSuggestionKey(suggestion), isSuggestionFollowing(suggestion)])),
        }));
    }, [followSuggestions])

    async function handleToggleFollow(userId, key = userId) {
        if (!userId) return;

        try {
            const response = await putFollowOrUnfollow(userId);
            const nextIsFollowing = typeof response?.isFollowing === 'boolean'
                ? response.isFollowing
                : typeof response?.following === 'boolean'
                    ? response.following
                    : undefined;

            setFollowState((prev) => ({
                ...prev,
                [key]: nextIsFollowing ?? !prev[key],
            }));
        } catch (error) {
            console.log('Follow toggle failed:', error);
        }
    }


    return <>
        <div className='lg:flex lg:justify-center lg:items-start'>
            <div className="feed">
                <div className="feed-header">
                    <div className="feed-header-top">
                        <h1>Home</h1>
                        <div onClick={searchBtn} className="nitem lg:hidden! flex! justify-end items-center cursor-pointer h-12 w-12 rounded-[14px]"><IconSearch size={20} /></div>
                    </div>
                    <div className="tabs">
                        <div className="tab" onClick={ForYouBtn}>
                            For you
                        </div>
                        <div className="tab active" onClick={FollowingBtn}>
                            Following
                        </div>
                    </div>
                </div>
                <div className="compose-card relative">
                    <div className="avatar av-lav rounded-xl!">
                        {avatarSrc ? (
                            <img
                                src={avatarSrc}
                                alt={avatarName}
                                className="h-10 w-10 rounded-xl object-cover!"
                            />
                        ) : (
                            <div className="avatar-fallback h-10 w-10 rounded-xl text-sm font-semibold flex items-center justify-center">
                                {initials}
                            </div>
                        )}
                    </div>
                    <div className="input ">
                        <input onChange={(e) => setPostContent(e.target.value)} type="text" placeholder="What's pulling at your thread today?" value={postContent} />
                        {showGifPicker && (
                            <div className="gif-picker-wrapper absolute z-50 top-30 left-0 w-90 rounded-3xl bg-white shadow-2xl" ref={gifPickerRef}>
                                {gifProvider ? (
                                    <GifPicker
                                        provider={gifProvider}
                                        onGifClick={handleGifSelect}
                                        width={340}
                                        height={420}
                                        autoFocusSearch={true}
                                    />
                                ) : (
                                    <div className="p-4 text-sm text-gray-700">
                                        اضف VITE_GIPHY_API_KEY في ملف .env لتفعيل GIF picker
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="compose-foot">
                            <div className="compose-icons">
                                <div>
                                    <IconPhotoPlus className="cursor-pointer" onClick={handleUploadPhoto} stroke={2} />
                                    <input onChange={handleSelectedImg} type="file" ref={inputPhoto} className="hidden" />
                                </div>
                                <IconGif className="cursor-pointer" onClick={handleGifs} stroke={2} />
                                <IconMoodSmile stroke={2} />
                            </div>
                            <button onClick={handleFetchingPost} disabled={isPosting} className="post-btn">
                                {isPosting ? (
                                    <div className="post-btn-loading">
                                        <div className="post-btn-spinner" />
                                        <span>Posting...</span>
                                    </div>
                                ) : (
                                    'Post'
                                )}
                            </button>
                        </div>
                        {(displayPhoto || selectedGifUrl) && <div className="post-media relative">
                            <img
                                className="clickable-image w-full h-auto rounded-lg object-cover"
                                src={displayPhoto || selectedGifUrl}
                                onClick={() => openImage(displayPhoto || selectedGifUrl)}
                                alt={displayPhoto ? 'Post image' : 'Selected GIF'}
                            />
                            <IconX onClick={displayPhoto ? cancelPhoto : cancelGif} className="cursor-pointer absolute top-2 right-2 z-50" stroke={2} />
                        </div>}
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
                    </div>
                </div>
                <div className="thread">
                    {isLoading ? (
                        [1, 2, 3].map((placeholder) => <Skeleton key={placeholder} />)
                    ) : posts.length ? (
                        posts.map((post) => <PostCard key={post.id} post={post} />)
                    ) : (
                        <div className="empty-state">No posts available</div>
                    )}
                </div>
            </div>
            <div className="side gap-7 flex justify-center items-end ">
                <div className="search-box w-2xs"><IconSearch stroke={2} /> <input className='w-full h-max border-transparent' type="text" placeholder="Search Loom" /></div>
                <div className="panel w-2xs">
                    <h3>Trending threads</h3>
                    <div className="trend"><div className="name"><span className="tag-hl">#studiolife</span>Behind the scenes</div><div className="count">12.4k posts</div></div>
                    <div className="trend"><div className="name"><span className="tag-hl">#beginnerwins</span>Small progress, big pride</div><div className="count">8.1k posts</div></div>
                    <div className="trend"><div className="name"><span className="tag-hl">#productdesign</span>Onboarding takes</div><div className="count">5.7k posts</div></div>
                    <div className="trend"><div className="name"><span className="tag-hl">#weekendmakers</span>What did you build?</div><div className="count">3.2k posts</div></div>
                </div>
                <div className="panel w-2xs">
                    <h3>Who to follow</h3>
                    {Array.isArray(followSuggestions) && followSuggestions.length > 0 ? followSuggestions.map((suggestion) => {
                        const photo = (suggestion.photo || suggestion.avatar || suggestion.image || '').trim();
                        const showImage = photo && photo !== DEFAULT_AVATAR_URL;
                        const initials = getInitials(suggestion.name || suggestion.fullname);
                        return (
                            <div className="suggest" key={suggestion._id}>
                                <div className="avatar av-coral">
                                    {showImage ? (
                                        <img src={photo} alt={suggestion.name} className="w-full h-full object-cover " />
                                    ) : (
                                        initials
                                    )}
                                </div>
                                <div className="info"><div className="name">{suggestion.name}</div><div className="handle">{`@${suggestion.username}`}</div></div>
                                <button
                                    type="button"
                                    onClick={() => handleToggleFollow(suggestion._id || suggestion.id, getSuggestionKey(suggestion))}
                                    className={`follow-btn ${followState[getSuggestionKey(suggestion)] ? 'active' : ''}`}
                                >
                                    {followState[getSuggestionKey(suggestion)] ? 'Following' : 'Follow'}
                                </button>
                            </div>
                        );
                    }) : null}
                </div>
                <div className="foot-links ">
                    <a href="#">About</a><a href="#">Help</a><a href="#">Privacy</a><a href="#">Terms</a><br />© 2026 Loom
                </div>
            </div>
        </div>
    </>
}
