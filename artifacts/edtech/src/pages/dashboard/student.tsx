import { useGetStudentStats } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, GraduationCap, Clock, Award, PlayCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetStudentStats(user?.id || 0, {
    query: { enabled: !!user?.id }
  });

  if (isLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  if (!stats) return null;

  return (
    <div className="container mx-auto p-4 py-8 max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-4">
          <Link href="/courses">
            <Button variant="outline">Browse Courses</Button>
          </Link>
          <Link href="/ai-planner">
            <Button>AI Planner</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.enrolledCourses}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedCourses}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Learned</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHoursLearned}h</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Award className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak} days</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Continue Learning</CardTitle>
              <Link href="/student/courses">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.enrollments.filter(e => e.completionStatus === 'in_progress').slice(0, 3).map((enrollment) => (
                  <div key={enrollment.id} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="w-full sm:w-48 aspect-video bg-muted rounded overflow-hidden flex-shrink-0 relative group">
                      {enrollment.courseThumbnail ? (
                        <img src={enrollment.courseThumbnail} alt={enrollment.courseTitle} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary/5">
                          <BookOpen className="h-8 w-8 text-primary/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <PlayCircle className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h3 className="font-semibold text-lg line-clamp-1">{enrollment.courseTitle}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{enrollment.trainerName}</p>
                      
                      <div className="mt-auto space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Progress</span>
                          <span>{enrollment.progressPercentage}%</span>
                        </div>
                        <Progress value={enrollment.progressPercentage} className="h-2" />
                        <div className="flex justify-end pt-2">
                          <Link href={`/student/course/${enrollment.id}`}>
                            <Button size="sm">Resume Course</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {stats.enrollments.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/20">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="mb-4">You aren't enrolled in any courses yet.</p>
                    <Link href="/courses">
                      <Button>Explore Courses</Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 p-16 bg-accent/30 blur-[50px] rounded-full mix-blend-screen"></div>
            <CardHeader>
              <CardTitle>AI Learning Planner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <p className="text-primary-foreground/80 text-sm">
                Get a personalized week-by-week learning roadmap based on your career goals and skill level.
              </p>
              <Link href="/ai-planner" className="block">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Generate My Plan
                </Button>
              </Link>
              <Link href="/my-roadmap" className="block text-center mt-2">
                <Button variant="link" className="text-primary-foreground hover:text-white">
                  View Saved Plan
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Completed Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.enrollments.filter(e => e.completionStatus === 'completed').slice(0, 3).map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Award className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{enrollment.courseTitle}</p>
                      <p className="text-xs text-muted-foreground">100% Completed</p>
                    </div>
                  </div>
                ))}
                {stats.enrollments.filter(e => e.completionStatus === 'completed').length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    Keep learning to complete your first course!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
