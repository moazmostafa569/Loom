import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { getSinglePost } from '../../services/AllPostsServices'
import PostCard from '../../components/PostCard/PostCard'
import './../../styles/PostCard.css'

export default function SinglePost() {
  const { id } = useParams()
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['singlePost', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Post ID is missing.')
      }
      const response = await getSinglePost(id)
      return response?.data?.post || response?.data || response
    },
    enabled: Boolean(id),
  })
  const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load post.'

  return (
    <div className="single-post-page w-2/3 !m-auto min-h-screen flex justify-center items-center">
      {isLoading ? (
        <div className="loading-state">Loading post…</div>
      ) : error ? (
        <div className="error-state">{errorMessage}</div>
      ) : post ? (
        <PostCard post={post} />
      ) : (
        <div className="empty-state">Post not found.</div>
      )}
    </div>
  )
}

