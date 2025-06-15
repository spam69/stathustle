import { ReactNode } from "react";
import { StatsCard } from "./stats-card";
import { 
  Trophy, 
  Users, 
  Calendar, 
  TrendingUp, 
  BarChart, 
  Activity, 
  Zap,
  Award
} from "lucide-react";

interface StatItem {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
  };
  onClick?: () => void;
}

interface StatsDashboardProps {
  sportFilter?: string;
  stats: StatItem[];
  className?: string;
}

export function StatsDashboard({ sportFilter, stats, className }: StatsDashboardProps) {
  // Default fantasy sports stats if none provided
  const defaultStats: StatItem[] = [
    {
      title: "Fantasy Points",
      value: "1,245",
      icon: <Zap className="h-5 w-5" />,
      trend: {
        direction: "up",
        value: "12% from last week"
      }
    },
    {
      title: "League Ranking",
      value: "3 / 12",
      icon: <Trophy className="h-5 w-5" />,
      trend: {
        direction: "up",
        value: "Up 2 positions"
      }
    },
    {
      title: "Win-Loss Record",
      value: "7-2",
      icon: <Award className="h-5 w-5" />,
      trend: {
        direction: "neutral",
        value: "Won last match"
      }
    },
    {
      title: "Upcoming Games",
      value: "2",
      icon: <Calendar className="h-5 w-5" />,
      description: "Next: Sat, 8:30 PM"
    }
  ];

  // Different stats based on sport
  const footballStats: StatItem[] = [
    {
      title: "Total TDs",
      value: "14",
      icon: <Zap className="h-5 w-5" />,
      trend: {
        direction: "up",
        value: "+3 last week"
      }
    },
    {
      title: "QB Rating",
      value: "112.5",
      icon: <Activity className="h-5 w-5" />,
      trend: {
        direction: "up",
        value: "+5.2 pts"
      }
    },
    {
      title: "Rush Yards",
      value: "786",
      icon: <TrendingUp className="h-5 w-5" />,
      trend: {
        direction: "up",
        value: "+124 yds"
      }
    },
    {
      title: "Receiving",
      value: "652",
      icon: <BarChart className="h-5 w-5" />,
      trend: {
        direction: "up",
        value: "+87 yds"
      }
    }
  ];

  const basketballStats: StatItem[] = [
    {
      title: "PPG",
      value: "24.8",
      icon: <BarChart className="h-5 w-5" />,
      trend: {
        direction: "up",
        value: "+2.3 pts"
      }
    },
    {
      title: "Rebounds",
      value: "186",
      icon: <Activity className="h-5 w-5" />,
      trend: {
        direction: "up",
        value: "+12 last week"
      }
    },
    {
      title: "Assists",
      value: "112",
      icon: <Users className="h-5 w-5" />,
      trend: {
        direction: "up",
        value: "+8 last game"
      }
    },
    {
      title: "FG%",
      value: "48.2%",
      icon: <TrendingUp className="h-5 w-5" />,
      trend: {
        direction: "down",
        value: "-2.1%"
      }
    }
  ];

  const baseballStats: StatItem[] = [
    {
      title: "Batting Avg",
      value: ".315",
      icon: <BarChart className="h-5 w-5" />,
      trend: {
        direction: "up",
        value: "+.012"
      }
    },
    {
      title: "Home Runs",
      value: "12",
      icon: <Activity className="h-5 w-5" />,
      trend: {
        direction: "up",
        value: "+3 last week"
      }
    },
    {
      title: "RBIs",
      value: "48",
      icon: <TrendingUp className="h-5 w-5" />,
      trend: {
        direction: "up",
        value: "+7"
      }
    },
    {
      title: "ERA",
      value: "3.25",
      icon: <Zap className="h-5 w-5" />,
      trend: {
        direction: "down",
        value: "-0.21"
      }
    }
  ];

  // Choose stats based on sport filter
  const statsToDisplay = stats.length > 0 ? stats : 
    sportFilter === "football" ? footballStats :
    sportFilter === "basketball" ? basketballStats :
    sportFilter === "baseball" ? baseballStats :
    defaultStats;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {statsToDisplay.map((stat, index) => (
        <StatsCard
          key={`stat-${index}`}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          icon={stat.icon}
          trend={stat.trend}
          onClick={stat.onClick}
        />
      ))}
    </div>
  );
} 