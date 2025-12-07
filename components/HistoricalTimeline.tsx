/**
 * Historical Timeline Component
 * Shows key milestones and moments in the comparison history
 * FREE - No API costs, pure algorithmic detection
 */

import { Calendar, TrendingUp, Trophy, Zap } from "lucide-react";

type Milestone = {
  date: string;
  event: string;
  termLeader: string;
  relativeInterest: {
    [key: string]: number;
  };
  significance: "high" | "medium" | "low";
  type: "peak" | "crossover" | "spike" | "sustained";
};

type HistoricalTimelineProps = {
  termA: string;
  termB: string;
  series: Array<{ date: string; [key: string]: any }>;
};

/**
 * Detect historical milestones from series data
 */
function detectMilestones(
  termA: string,
  termB: string,
  series: Array<{ date: string; [key: string]: any }>
): Milestone[] {
  if (!series || series.length < 30) return []; // Need enough historical data

  const milestones: Milestone[] = [];

  // 1. Find all-time peaks for each term
  let termA_peak = { value: 0, index: 0 };
  let termB_peak = { value: 0, index: 0 };

  series.forEach((point, index) => {
    const valA = Number(point[termA]) || 0;
    const valB = Number(point[termB]) || 0;

    if (valA > termA_peak.value) {
      termA_peak = { value: valA, index };
    }
    if (valB > termB_peak.value) {
      termB_peak = { value: valB, index };
    }
  });

  // Add peak milestones
  if (termA_peak.value > 0) {
    milestones.push({
      date: series[termA_peak.index].date,
      event: `${prettyTerm(termA)} reaches all-time peak interest`,
      termLeader: termA,
      relativeInterest: {
        [termA]: termA_peak.value,
        [termB]: Number(series[termA_peak.index][termB]) || 0,
      },
      significance: "high",
      type: "peak",
    });
  }

  if (termB_peak.value > 0) {
    milestones.push({
      date: series[termB_peak.index].date,
      event: `${prettyTerm(termB)} reaches all-time peak interest`,
      termLeader: termB,
      relativeInterest: {
        [termA]: Number(series[termB_peak.index][termA]) || 0,
        [termB]: termB_peak.value,
      },
      significance: "high",
      type: "peak",
    });
  }

  // 2. Find crossover moments (when leader changes)
  let previousLeader = "";
  series.forEach((point, index) => {
    if (index === 0) {
      previousLeader =
        (Number(point[termA]) || 0) > (Number(point[termB]) || 0) ? termA : termB;
      return;
    }

    const currentLeader =
      (Number(point[termA]) || 0) > (Number(point[termB]) || 0) ? termA : termB;

    if (currentLeader !== previousLeader && index > 5) {
      // Avoid early noise
      milestones.push({
        date: point.date,
        event: `${prettyTerm(currentLeader)} overtakes ${prettyTerm(previousLeader)}`,
        termLeader: currentLeader,
        relativeInterest: {
          [termA]: Number(point[termA]) || 0,
          [termB]: Number(point[termB]) || 0,
        },
        significance: "medium",
        type: "crossover",
      });
    }

    previousLeader = currentLeader;
  });

  // 3. Find major spikes (>200% increase in 7 days)
  for (let i = 7; i < series.length; i++) {
    const current = series[i];
    const weekAgo = series[i - 7];

    const valA_current = Number(current[termA]) || 0;
    const valB_current = Number(current[termB]) || 0;
    const valA_prev = Number(weekAgo[termA]) || 0;
    const valB_prev = Number(weekAgo[termB]) || 0;

    // Check term A spike
    if (valA_prev > 0) {
      const percentChange = ((valA_current - valA_prev) / valA_prev) * 100;
      if (percentChange > 200) {
        milestones.push({
          date: current.date,
          event: `${prettyTerm(termA)} surges ${Math.round(percentChange)}% in one week`,
          termLeader: termA,
          relativeInterest: {
            [termA]: valA_current,
            [termB]: valB_current,
          },
          significance: percentChange > 300 ? "high" : "medium",
          type: "spike",
        });
      }
    }

    // Check term B spike
    if (valB_prev > 0) {
      const percentChange = ((valB_current - valB_prev) / valB_prev) * 100;
      if (percentChange > 200) {
        milestones.push({
          date: current.date,
          event: `${prettyTerm(termB)} surges ${Math.round(percentChange)}% in one week`,
          termLeader: termB,
          relativeInterest: {
            [termA]: valA_current,
            [termB]: valB_current,
          },
          significance: percentChange > 300 ? "high" : "medium",
          type: "spike",
        });
      }
    }
  }

  // 4. Find sustained dominance periods (>60 days of continuous leadership)
  let sustainedLeader = "";
  let sustainedStart = 0;

  series.forEach((point, index) => {
    const currentLeader =
      (Number(point[termA]) || 0) > (Number(point[termB]) || 0) ? termA : termB;

    if (currentLeader !== sustainedLeader) {
      // Check if previous sustained period was significant
      if (sustainedLeader && index - sustainedStart > 60) {
        milestones.push({
          date: series[sustainedStart].date,
          event: `${prettyTerm(sustainedLeader)} begins ${Math.floor(
            (index - sustainedStart) / 30
          )}-month dominance streak`,
          termLeader: sustainedLeader,
          relativeInterest: {
            [termA]: Number(series[sustainedStart][termA]) || 0,
            [termB]: Number(series[sustainedStart][termB]) || 0,
          },
          significance: index - sustainedStart > 120 ? "high" : "medium",
          type: "sustained",
        });
      }

      sustainedLeader = currentLeader;
      sustainedStart = index;
    }
  });

  // Sort by date (most recent first) and deduplicate by keeping most significant
  const sorted = milestones
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((milestone, index, self) => {
      // Remove duplicates on same date
      return (
        index ===
        self.findIndex((m) => {
          const sameDate =
            new Date(m.date).toDateString() === new Date(milestone.date).toDateString();
          return sameDate && m.type === milestone.type;
        })
      );
    });

  // Return top 5 most significant milestones
  return sorted.slice(0, 5);
}

function prettyTerm(t: string): string {
  return t
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getIcon(type: string) {
  switch (type) {
    case "peak":
      return <Trophy className="w-5 h-5" />;
    case "crossover":
      return <TrendingUp className="w-5 h-5" />;
    case "spike":
      return <Zap className="w-5 h-5" />;
    case "sustained":
      return <Calendar className="w-5 h-5" />;
    default:
      return <Calendar className="w-5 h-5" />;
  }
}

export default function HistoricalTimeline({
  termA,
  termB,
  series,
}: HistoricalTimelineProps) {
  const milestones = detectMilestones(termA, termB, series);

  if (milestones.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          Historical Timeline
        </h3>
        <p className="text-slate-600 text-sm">
          Key moments in the {prettyTerm(termA)} vs {prettyTerm(termB)} comparison
        </p>
      </div>

      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <div
            key={index}
            className={`relative pl-8 pb-6 ${
              index !== milestones.length - 1 ? "border-l-2 border-slate-200" : ""
            }`}
          >
            {/* Icon */}
            <div
              className={`absolute left-0 -ml-3 w-6 h-6 rounded-full flex items-center justify-center ${
                milestone.significance === "high"
                  ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                  : milestone.significance === "medium"
                  ? "bg-gradient-to-br from-blue-400 to-blue-500 text-white"
                  : "bg-slate-300 text-slate-600"
              }`}
            >
              <div className="w-3 h-3">{getIcon(milestone.type)}</div>
            </div>

            {/* Content */}
            <div className="ml-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h4 className="font-bold text-slate-900 text-base leading-tight">
                  {milestone.event}
                </h4>
                {milestone.significance === "high" && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                    Major Event
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-500 mb-2">{formatDate(milestone.date)}</p>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">
                    {prettyTerm(termA)}:
                  </span>
                  <span className="font-bold text-blue-600">
                    {milestone.relativeInterest[termA]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">
                    {prettyTerm(termB)}:
                  </span>
                  <span className="font-bold text-purple-600">
                    {milestone.relativeInterest[termB]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500 italic">
          💡 These milestones are automatically detected from search trend patterns and
          represent significant moments in the comparison history.
        </p>
      </div>
    </div>
  );
}
