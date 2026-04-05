import { useGetTrainerStats } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, Star, TrendingUp, Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function TrainerDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetTrainerStats(user?.id || 0, {
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
          <h1 className="text-3xl font-bold tracking-tight">Trainer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-4">
          <Link href="/trainer/courses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Courses</CardTitle>
            <Link href="/trainer/courses">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.courses.slice(0, 5).map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded overflow-hidden flex-shrink-0">
                      {course.thumbnail && <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />}
                    </div>
                    <div>
                      <p className="font-medium line-clamp-1">{course.title}</p>
                      <p className="text-xs text-muted-foreground">{course.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm font-medium">
                      <Users className="h-3 w-3 mr-1 text-muted-foreground" />
                      {course.enrolledCount}
                    </div>
                  </div>
                </div>
              ))}
              {stats.courses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  You haven't created any courses yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentEnrollments.slice(0, 5).map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-xl">
                  <div>
                    <p className="font-medium text-sm line-clamp-1">{enrollment.courseTitle}</p>
                    <p className="text-xs text-muted-foreground">Student ID: {enrollment.studentId}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {stats.recentEnrollments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No recent enrollments.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
