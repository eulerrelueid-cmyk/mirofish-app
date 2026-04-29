'use client'

import { useState } from 'react'
import { Heart, MessageCircle, MessageSquare, Sparkles, TrendingUp } from 'lucide-react'

import { SimulationAgent, SimulationPost } from '@/types/simulation'

interface SocialFeedProps {
  posts: SimulationPost[]
  agents: SimulationAgent[]
}

export default function SocialFeed({ posts, agents }: SocialFeedProps) {
  const [expandedPost, setExpandedPost] = useState<string | null>(null)

  const sortedPosts = [...posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]))

  return (
    <section className="glass-panel rounded-[32px] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="section-label">Live feed</div>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Watch how messages spread, who engages, and which platforms absorb the most attention.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
          {sortedPosts.length} posts
        </div>
      </div>

      <div className="max-h-[720px] space-y-4 overflow-y-auto pr-1 sm:pr-2">
        {sortedPosts.length === 0 ? (
          <div className="rounded-[26px] border border-white/10 bg-black/20 px-6 py-14 text-center text-slate-500">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-40" />
            <p className="text-base text-slate-300">No posts yet.</p>
            <p className="mt-1 text-sm">The feed will populate once the simulation starts generating visible discussion.</p>
          </div>
        ) : (
          sortedPosts.map((post, index) => {
            const author = agentsById.get(post.agentId)
            const isExpanded = expandedPost === post.id
            const sentimentColor =
              post.sentiment > 0.3
                ? 'border-miro-accent/30 bg-miro-accent/10 text-miro-accent'
                : post.sentiment < -0.3
                  ? 'border-miro-amber/30 bg-miro-amber/10 text-miro-amber'
                  : 'border-white/10 bg-white/5 text-slate-300'
            const sentimentLabel = post.sentiment > 0.3 ? 'Positive' : post.sentiment < -0.3 ? 'Negative' : 'Neutral'

            return (
              <article
                key={post.id}
                className="soft-panel mesh-card rounded-[30px] p-4 sm:p-5"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-miro-teal via-miro-accent to-miro-glow text-sm font-semibold text-slate-950">
                    {author?.name.charAt(0) || '?'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-base font-semibold text-white">{author?.name || 'Unknown'}</span>
                          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                            @{author?.role.toLowerCase().replace(/\s+/g, '_')}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className={`rounded-full border px-2.5 py-1 ${sentimentColor}`}>{sentimentLabel}</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Round {post.round}</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 capitalize">
                            {post.platform}
                          </span>
                        </div>
                      </div>

                      <div className="hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400 sm:inline-flex">
                        Engagement trail
                      </div>
                    </div>

                    <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-100 sm:text-[15px]">{post.content}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4 text-sm text-slate-400">
                      <button className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition-colors hover:border-miro-amber/30 hover:text-miro-amber">
                        <Heart className={`h-4 w-4 ${post.likes.length > 0 ? 'fill-miro-amber text-miro-amber' : ''}`} />
                        {post.likes.length}
                      </button>
                      <button
                        onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition-colors hover:border-miro-accent/30 hover:text-miro-accent"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {post.comments.length}
                      </button>
                      <div className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                        <TrendingUp className="h-4 w-4 text-miro-teal" />
                        Engagement {post.engagement.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 rounded-[24px] border border-white/10 bg-black/25 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                      <Sparkles className="h-4 w-4 text-miro-accent" />
                      Replies
                    </div>
                    {post.comments.length === 0 ? (
                      <p className="text-sm text-slate-500">No replies yet for this post.</p>
                    ) : (
                      <div className="space-y-3">
                        {post.comments.map((comment) => {
                          const commenter = agentsById.get(comment.agentId)

                          return (
                            <div key={comment.id} className="rounded-[20px] border border-white/10 bg-white/5 p-3">
                              <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 text-xs font-semibold text-white">
                                  {commenter?.name.charAt(0) || '?'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="truncate text-sm font-medium text-white">
                                      {commenter?.name || 'Unknown'}
                                    </span>
                                    <span className="text-xs text-slate-500">{commenter?.role}</span>
                                  </div>
                                  <p className="mt-1 text-sm leading-6 text-slate-300">{comment.content}</p>
                                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                    <Heart className="h-3.5 w-3.5" />
                                    {comment.likes.length} likes
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
