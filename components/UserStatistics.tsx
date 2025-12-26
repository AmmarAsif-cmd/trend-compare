/**
 * User Statistics Component
 * Shows value metrics and achievements to demonstrate platform value
 */

import { Trophy, Target, Clock, Sparkles, TrendingUp, Award, Zap, Calendar } from 'lucide-react';
import type { UserStatistics, Achievement } from '@/lib/user-statistics';

interface Props {
  stats: UserStatistics;
  achievements: Achievement[];
}

export function UserStatisticsPanel({ stats, achievements }: Props) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const earnedAchievements = achievements.filter(a => a.earned);
  const inProgressAchievements = achievements.filter(a => !a.earned && a.progress);

  return (
    <div className="space-y-6">
      {/* Value Metrics */}
      <section className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-indigo-200 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Your Impact</h2>
            <p className="text-sm text-slate-600">Value you've gained from TrendArc</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-indigo-200/50 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <p className="text-xs font-medium text-slate-600">Time Saved</p>
            </div>
            <p className="text-3xl font-bold text-indigo-600">{formatTime(stats.timeSavedMinutes)}</p>
            <p className="text-xs text-slate-500 mt-1">≈ {Math.floor(stats.timeSavedMinutes / 60)} hours of research</p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-purple-200/50 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <p className="text-xs font-medium text-slate-600">AI Insights</p>
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.insightsGenerated}</p>
            <p className="text-xs text-slate-500 mt-1">Generated for you</p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-pink-200/50 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-pink-600" />
              <p className="text-xs font-medium text-slate-600">Comparisons</p>
            </div>
            <p className="text-3xl font-bold text-pink-600">{stats.totalComparisons}</p>
            <p className="text-xs text-slate-500 mt-1">Total analyzed</p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-orange-200/50 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-orange-600" />
              <p className="text-xs font-medium text-slate-600">Categories</p>
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats.uniqueCategories}</p>
            <p className="text-xs text-slate-500 mt-1">Topics explored</p>
          </div>
        </div>

        {/* Current Streak */}
        {stats.currentStreak > 0 && (
          <div className="mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🔥</div>
                <div>
                  <p className="text-sm font-medium opacity-90">Current Streak</p>
                  <p className="text-2xl font-bold">{stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}</p>
                </div>
              </div>
              {stats.longestStreak > stats.currentStreak && (
                <div className="text-right">
                  <p className="text-xs opacity-75">Best: {stats.longestStreak} days</p>
                  <p className="text-xs opacity-75">{stats.longestStreak - stats.currentStreak} away!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Achievements */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Achievements</h2>
            <p className="text-sm text-slate-600">{earnedAchievements.length} of {achievements.length} unlocked</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {/* Earned achievements first */}
          {earnedAchievements.map(achievement => (
            <div
              key={achievement.id}
              className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 mb-1">{achievement.title}</h3>
                  <p className="text-xs text-slate-600">{achievement.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Award className="w-3 h-3 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">Unlocked!</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* In-progress achievements */}
          {inProgressAchievements.slice(0, 4).map(achievement => (
            <div
              key={achievement.id}
              className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 shadow-sm opacity-75"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0 grayscale">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-700 mb-1">{achievement.title}</h3>
                  <p className="text-xs text-slate-500">{achievement.description}</p>
                  {achievement.progress !== undefined && achievement.target && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>{achievement.progress}/{achievement.target}</span>
                        <span>{Math.floor((achievement.progress / achievement.target) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {inProgressAchievements.length === 0 && earnedAchievements.length === achievements.length && (
          <div className="text-center py-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-lg font-bold text-slate-900 mb-1">All Achievements Unlocked!</p>
            <p className="text-sm text-slate-600">You're a TrendArc legend!</p>
          </div>
        )}
      </section>

      {/* Activity Timeline */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Activity</h2>
            <p className="text-sm text-slate-600">Your TrendArc journey</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-700">Member since</span>
            <span className="text-sm font-bold text-slate-900">
              {stats.joinDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-700">Days active</span>
            <span className="text-sm font-bold text-slate-900">{stats.daysActive}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-700">Last activity</span>
            <span className="text-sm font-bold text-slate-900">
              {stats.lastActiveDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
