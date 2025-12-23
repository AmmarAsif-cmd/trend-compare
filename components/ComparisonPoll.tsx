'use client';

import { useState, useEffect } from 'react';
import { Users, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';

type Props = {
  termA: string;
  termB: string;
  actualWinner: string;
  actualWinnerScore: number;
  actualLoserScore: number;
  onVote?: (choice: string) => void;
};

export default function ComparisonPoll({ 
  termA, 
  termB, 
  actualWinner, 
  actualWinnerScore, 
  actualLoserScore,
  onVote 
}: Props) {
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Check if user has already voted (stored in localStorage)
  useEffect(() => {
    const pollKey = `poll_${termA}_${termB}`;
    const saved = localStorage.getItem(pollKey);
    if (saved) {
      setUserChoice(saved);
      setHasVoted(true);
      setShowResults(true);
    }
  }, [termA, termB]);

  const formatTerm = (term: string) => {
    return term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleVote = (choice: string) => {
    if (hasVoted) return;
    
    setUserChoice(choice);
    setHasVoted(true);
    
    // Save to localStorage
    const pollKey = `poll_${termA}_${termB}`;
    localStorage.setItem(pollKey, choice);
    
    // Callback if provided
    if (onVote) {
      onVote(choice);
    }
    
    // Show results after a brief delay
    setTimeout(() => {
      setShowResults(true);
    }, 500);
  };

  const isCorrect = userChoice?.toLowerCase() === actualWinner.toLowerCase();
  const isTermAWinner = actualWinner.toLowerCase() === termA.toLowerCase();
  const margin = Math.abs(actualWinnerScore - actualLoserScore);

  // Generate random mock stats (different each time the page loads)
  // Use a combination of terms and current timestamp to ensure variety
  const mockStats = (() => {
    // Create a seed from terms and current time (changes on each page load)
    const termSeed = (termA + termB).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const timeSeed = Math.floor(Date.now() / 1000) % 10000; // Changes every second, cycles every ~2.7 hours
    
    // Generate random percentages that add up to 100%
    const random1 = (termSeed * 17 + timeSeed) % 100;
    const random2 = (termSeed * 23 + timeSeed * 7) % 100;
    
    // Ensure numbers are between 35-65% range for realism
    const termAPercent = 35 + (random1 % 30); // 35-65%
    const termBPercent = 100 - termAPercent;
    
    // Total votes between 500-2500
    const baseTotal = 500 + ((termSeed + timeSeed) % 2000);
    
    const termAVotes = Math.round((baseTotal * termAPercent) / 100);
    const termBVotes = baseTotal - termAVotes;
    
    return {
      totalVotes: baseTotal,
      termAVotes,
      termBVotes,
    };
  })();

  if (showResults && hasVoted) {
    return (
      <div className="bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 rounded-xl sm:rounded-2xl border-2 border-purple-200 shadow-lg p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-2 rounded-lg ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : (
              <XCircle className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {isCorrect ? 'You predicted correctly! 🎉' : 'Your prediction was close!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              You chose {userChoice === termA ? formatTerm(termA) : formatTerm(termB)}, but{' '}
              {formatTerm(actualWinner)} is actually winning by {margin.toFixed(0)} points.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Community Predictions</span>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Users className="w-4 h-4" />
              <span>{mockStats.totalVotes} votes</span>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm text-slate-700">{formatTerm(termA)}</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">
                  {((mockStats.termAVotes / mockStats.totalVotes) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    isTermAWinner ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                  style={{ width: `${(mockStats.termAVotes / mockStats.totalVotes) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm text-slate-700">{formatTerm(termB)}</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">
                  {((mockStats.termBVotes / mockStats.totalVotes) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    !isTermAWinner ? 'bg-purple-500' : 'bg-slate-300'
                  }`}
                  style={{ width: `${(mockStats.termBVotes / mockStats.totalVotes) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 rounded-xl sm:rounded-2xl border-2 border-purple-200 shadow-lg p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Before you see the results...
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Which do you think is more popular?
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button
          onClick={() => handleVote(termA)}
          disabled={hasVoted}
          className={`group relative overflow-hidden p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all duration-300 ${
            hasVoted
              ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
              : userChoice === termA
              ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
              : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md hover:scale-102'
          }`}
        >
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
              {formatTerm(termA)}
            </div>
            {userChoice === termA && (
              <div className="mt-2 flex items-center justify-center gap-1 text-sm text-blue-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Your choice</span>
              </div>
            )}
          </div>
        </button>

        <button
          onClick={() => handleVote(termB)}
          disabled={hasVoted}
          className={`group relative overflow-hidden p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all duration-300 ${
            hasVoted
              ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
              : userChoice === termB
              ? 'border-purple-500 bg-purple-50 shadow-md scale-105'
              : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-md hover:scale-102'
          }`}
        >
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
              {formatTerm(termB)}
            </div>
            {userChoice === termB && (
              <div className="mt-2 flex items-center justify-center gap-1 text-sm text-purple-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Your choice</span>
              </div>
            )}
          </div>
        </button>
      </div>

      {hasVoted && !showResults && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-slate-600">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span>Revealing results...</span>
          </div>
        </div>
      )}
    </div>
  );
}


