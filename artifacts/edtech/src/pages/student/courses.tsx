import { useAuth } from "@/lib/auth";
import { useGetStudentStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayCircle, Award, BookOpen } from "lucide-react";

export default function StudentCourses() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetStudentStats(user?.id || 0, {
    query: { enabled: !!user?.id }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Learning</h1>
        <p className="text-muted-foreground">Pick up where you left off.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
          ))}
        </div>
      ) : stats?.enrollments.length === 0 ? (
        <div className="text-center py-20 border rounded-2xl bg-muted/20">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-30" />
          <h2 className="text-2xl font-bold mb-2">Ready to start learning?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You haven't enrolled in any courses yet. Browse our catalog to find the perfect course for your career goals.
          </p>
          <Link href="/courses">
            <Button size="lg">Explore Courses</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats?.enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="overflow-hidden border-border/50 hover:shadow-md transition-shadow group flex flex-col">
              <div className="aspect-video bg-muted relative">
                {enrollment.courseThumbnail ? (
                  <img src={enrollment.courseThumbnail} alt={enrollment.courseTitle} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    <BookOpen className="h-10 w-10 text-primary/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <Link href={`/student/course/${enrollment.id}`}>
                    <Button variant="secondary" size="lg" className="rounded-full shadow-xl">
                      <PlayCircle className="mr-2 h-5 w-5" />
                      {enrollment.progressPercentage > 0 ? "Resume" : "Start Course"}
                    </Button>
                  </Link>
                </div>
              </div>
              
              <CardContent className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
                  {enrollment.courseTitle}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {enrollment.trainerName}
                </p>
                
                <div className="mt-auto pt-4 space-y-3">
                  <div className="flex justify-between items-end text-sm">
                    <span className="font-medium">{enrollment.progressPercentage}% Complete</span>
                    {enrollment.completionStatus === 'completed' && (
                      <span className="flex items-center text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        Completed
                      </span>
                    )}
                  </div>
                  <Progress 
                    value={enrollment.progressPercentage} 
                    className={`h-2 ${enrollment.completionStatus === 'completed' ? '[&>div]:bg-green-500' : ''}`} 
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
