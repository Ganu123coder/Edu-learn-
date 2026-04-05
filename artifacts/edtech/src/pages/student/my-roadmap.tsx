import { useGetMyPlan } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, Target, Calendar, Clock, BookOpen, ChevronRight, Map } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MyRoadmap() {
  const { data: plan, isLoading } = useGetMyPlan();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-24 w-full" />
        <div className="flex gap-8">
          <Skeleton className="h-[600px] w-2/3" />
          <Skeleton className="h-[400px] w-1/3" />
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-lg text-center space-y-6">
        <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Map className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">No Roadmap Found</h1>
        <p className="text-muted-foreground text-lg">
          You haven't generated an AI learning plan yet. Tell us your career goals and we'll create a custom path for you.
        </p>
        <Link href="/ai-planner">
          <Button size="lg" className="mt-4">Generate Plan Now</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-10">
        <Badge variant="outline" className="mb-4 border-primary text-primary bg-primary/5">
          AI-Generated Curriculum
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Your Path to: <span className="text-primary">{plan.careerGoal}</span></h1>
        
        <div className="flex flex-wrap gap-4 text-sm font-medium text-muted-foreground bg-muted/30 p-4 rounded-xl inline-flex">
          <div className="flex items-center gap-1.5">
            <Target className="h-4 w-4" /> Level: <span className="capitalize text-foreground">{plan.skillLevel}</span>
          </div>
          <div className="w-px h-4 bg-border"></div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> Duration: <span className="text-foreground">{plan.duration} Weeks</span>
          </div>
          <div className="w-px h-4 bg-border"></div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Pace: <span className="text-foreground">{plan.hoursPerDay} hrs/day</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Timeline Main Area */}
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-2xl font-bold">Weekly Roadmap</h2>
          
          <div className="relative border-l-2 border-primary/20 ml-4 space-y-10 pb-4">
            {plan.roadmap.map((week, idx) => (
              <div key={idx} className="relative pl-8">
                {/* Timeline dot */}
                <div className={cn(
                  "absolute -left-[11px] top-1 h-5 w-5 rounded-full border-2 bg-background flex items-center justify-center",
                  week.isCompleted ? "border-green-500 bg-green-500 text-white" : "border-primary"
                )}>
                  {week.isCompleted && <CheckCircle2 className="h-3 w-3" />}
                </div>
                
                <Card className={cn(
                  "border-border/50 shadow-sm transition-all hover:shadow-md",
                  !week.isCompleted && idx === 0 ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="secondary" className="mb-2">Week {week.week}</Badge>
                        <CardTitle className="text-xl">{week.weekLabel}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {week.topics.map((topic, i) => (
                        <li key={i} className="flex items-start gap-2">
                          {week.isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                          )}
                          <span className={week.isCompleted ? "text-muted-foreground line-through" : ""}>
                            {topic}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    {week.recommendedCourse && (
                      <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <div className="text-sm font-medium">
                            <span className="text-muted-foreground block text-xs">Recommended Course:</span>
                            {week.recommendedCourse}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8">
                          View <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <Card className="border-border/50 shadow-sm sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Major Milestones</CardTitle>
              <CardDescription>Key achievements along your journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {plan.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex gap-4">
                    <div className="mt-1">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        milestone.isCompleted ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                      )}>
                        <Target className="h-4 w-4" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm leading-tight">{milestone.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{milestone.description}</p>
                      <Badge variant="outline" className="mt-2 text-[10px] uppercase">By Week {milestone.targetWeek}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <Button className="w-full" variant="outline">
                  Update Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
