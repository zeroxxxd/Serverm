import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const timeRanges = [
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
];

export function ActivityChart() {
  const [selectedRange, setSelectedRange] = useState("7d");
  const [chartData, setChartData] = useState<number[]>([]);

  useEffect(() => {
    // Generate sample data based on selected range
    const generateData = () => {
      const dataPoints = selectedRange === "24h" ? 24 : selectedRange === "7d" ? 7 : 30;
      return Array.from({ length: dataPoints }, () => Math.floor(Math.random() * 100));
    };

    setChartData(generateData());
  }, [selectedRange]);

  const labels = selectedRange === "24h" 
    ? Array.from({ length: 24 }, (_, i) => `${i}:00`)
    : selectedRange === "7d"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : Array.from({ length: 30 }, (_, i) => `${i + 1}`);

  return (
    <Card className="discord-card border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">Activity Overview</CardTitle>
          <div className="flex items-center gap-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={selectedRange === range.value ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedRange(range.value)}
                className={
                  selectedRange === range.value
                    ? "discord-button"
                    : "bg-gray-700 text-secondary"
                }
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end justify-between gap-1">
          {chartData.map((value, index) => (
            <div
              key={index}
              className="bg-blue-500 rounded-t flex-1 transition-all hover:bg-blue-400"
              style={{ height: `${value}%` }}
              title={`${labels[index]}: ${value}%`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-4 text-xs text-secondary">
          {labels.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
