'use client'

import { SimulationPost, SimulationAgent, SimulationComment } from '@/types/simulation'
import { Heart, MessageCircle, TrendingUp, MessageSquare } from 'lucide-react'
import { useState } from 'react'

interface SocialFeedProps {
  posts: SimulationPost[]
  agents: SimulationAgent[]
}

export default function SocialFeed({ posts, agents }: SocialFeedProps) {
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  
  const sortedPosts = [...posts].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const getAgentById = (agentId: string) => agents.find(a => a.id === agentId)

  return (
    <div className="space-y-3 sm:space-y-4 max-h-[500px] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
      {sortedPosts.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-gray-500">
          <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
          <p className="text-sm sm:text-base">No posts yet. Starting simulation...</p>
        </div>
      ) : (
        sortedPosts.map((post, index) => {
          const author = getAgentById(post.agentId)
          const isExpanded = expandedPost === post.id
          const sentimentColor = post.sentiment > 0.3 ? 'text-green-600 bg-green-50' : post.sentiment < -0.3 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50'
          const sentimentLabel = post.sentiment > 0.3 ? 'Positive' : post.sentiment < -0.3 ? 'Negative' : 'Neutral'
          
          return (
            <div key={post.id} className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow" style={{ animationDelay: `${index * 50}ms` }}>
              {/* Post Header */}
              <div className="p-3 sm:p-4 pb-2">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm shrink-0">
                    {author?.name.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">{author?.name || 'Unknown'}</span>
                      <span className="text-gray-500 text-xs truncate">@{author?.role.toLowerCase().replace(/\s+/g, '_')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${sentimentColor}`}>{sentimentLabel}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Round {post.round}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="capitalize">{post.platform}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-3 sm:px-4 py-1.5 sm:py-2">
                <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Engagement Stats */}
              <div className="px-3 sm:px-4 py-2 flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 border-t border-gray-100">
                <button className="flex items-center gap-1 sm:gap-1.5 hover:text-red-500 transition-colors">
                  <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${post.likes.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{post.likes.length}</span>
                </button>
                <button onClick={() => setExpandedPost(isExpanded ? null : post.id)} className="flex items-center gap-1 sm:gap-1.5 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{post.comments.length}</span>
                </button>
                <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Engagement:</span>
                  <span>{post.engagement.toFixed(1)}</span>
                </div>
              </div>

              {/* Comments Section */}
              {isExpanded && post.comments.length > 0 && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-100 bg-gray-50/50">
                  <div className="pt-2 sm:pt-3 space-y-2 sm:space-y-3">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {getAgentById(comment.agentId)?.name.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 bg-white rounded-md sm:rounded-lg p-2 sm:p-3 shadow-sm">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                            <span className="font-medium text-xs sm:text-sm text-gray-900 truncate">{getAgentById(comment.agentId)?.name || 'Unknown'}</span>
                            <span className="text-xs text-gray-500 truncate">{getAgentById(comment.agentId)?.role}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-700">{comment.content}</p>
                          <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs text-gray-500">
                            <button className="flex items-center gap-0.5 sm:gap-1 hover:text-red-500">
                              <Heart className="w-3 h-3" />
                              <span>{comment.likes.length}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
