import React from 'react';

export function Skeleton() {
  return (
    <div className="post-skeleton">
      <div className="post-skeleton-rail">
        <div className="post-skeleton-avatar" />
        <div className="post-skeleton-line-vert" />
      </div>
      <div className="post-skeleton-body">
        <div className="post-skeleton-header">
          <div className="post-skeleton-name" />
          <div className="post-skeleton-handle" />
          <div className="post-skeleton-time" />
        </div>
        <div className="post-skeleton-text short" />
        <div className="post-skeleton-text long" />
        <div className="post-skeleton-media" />
        <div className="post-skeleton-actions">
          <div className="post-skeleton-action" />
          <div className="post-skeleton-action" />
          <div className="post-skeleton-action" />
          <div className="post-skeleton-action" />
        </div>
      </div>
    </div>
  );
}