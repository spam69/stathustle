import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
  };
  className?: string;
  onClick?: () => void;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  onClick,
}: StatsCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all", 
        onClick && "hover:shadow-md cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-medium">
            {title}
          </CardTitle>
          {description && (
            <CardDescription>
              {description}
            </CardDescription>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-primary-50 text-primary-900 dark:bg-primary-900/20 dark:text-primary-50 rounded-md">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {trend && (
          <div className={cn(
            "text-sm flex items-center mt-1",
            trend.direction === "up" && "text-green-500",
            trend.direction === "down" && "text-red-500",
            trend.direction === "neutral" && "text-muted-foreground"
          )}>
            {trend.direction === "up" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 mr-1"
              >
                <path
                  fillRule="evenodd"
                  d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {trend.direction === "down" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 mr-1"
              >
                <path
                  fillRule="evenodd"
                  d="M1.22 5.222a.75.75 0 011.06 0L7 9.942l3.768-3.769a.75.75 0 011.113.058 20.908 20.908 0 013.813 7.254l1.574-2.727a.75.75 0 011.3.75l-2.475 4.286a.75.75 0 01-.998.333l-4.286-2.475a.75.75 0 01.75-1.3l2.71 1.565a19.422 19.422 0 00-3.013-6.024L7.53 11.533a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {trend.direction === "neutral" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 mr-1"
              >
                <path
                  fillRule="evenodd"
                  d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 