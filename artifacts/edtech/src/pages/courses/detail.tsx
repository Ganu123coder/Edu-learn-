import { useParams, useLocation } from "wouter";
import { useGetCourse, useEnroll } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, Users, BookOpen, Clock, PlayCircle, FileText, Lock, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id, 10);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: course, isLoading } = useGetCourse(courseId, { 
    query: { enabled: !!courseId, queryKey: ["/api/courses", courseId] } 
  });
  
  const enrollMutation = useEnroll();

  const handleEnroll = async () => {
    if (!user) {
      setLocation("/login");
      return;
    }
    
    if (user.role !== "student") {
      toast({
        title: "Students Only",
        description: "Only student accounts can enroll in courses.",
        variant: "destructive"
      });
      return;
    }

    try {
      await enrollMutation.mutateAsync({ data: { courseId } });
      toast({
        title: "Successfully enrolled!",
        description: `You are now enrolled in ${course?.title}.`,
      });
      setLocation("/student/courses");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Enrollment failed",
        description: error.message || "Could not enroll in this course.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Course not found</h2>
        <p className="text-muted-foreground mb-6">The course you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => setLocation("/courses")}>Back to Courses</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Course Header Banner */}
      <div className="bg-primary text-primary-foreground py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center gap-3 text-sm font-medium text-primary-foreground/80">
              <span>{course.category}</span>
              <ChevronRight className="h-4 w-4" />
              <span>{course.title}</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{course.title}</h1>
            <p className="text-lg text-primary-foreground/80 leading-relaxed max-w-3xl">
              {course.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium pt-4">
              <div className="flex items-center text-amber-400">
                <Star className="h-5 w-5 fill-current mr-1.5" />
                <span className="text-lg">{course.rating.toFixed(1)}</span>
                <span className="text-primary-foreground/60 ml-1">({course.ratingCount} ratings)</span>
              </div>
              <div className="flex items-center text-primary-foreground/80">
                <Users className="h-5 w-5 mr-1.5" />
                <span>{course.enrolledCount.toLocaleString()} enrolled</span>
              </div>
              <div className="flex items-center text-primary-foreground/80">
                <BookOpen className="h-5 w-5 mr-1.5" />
                <span>{course.lessonCount} lessons</span>
              </div>
            </div>
            
            <div className="text-primary-foreground/80 pt-2">
              Created by <span className="font-semibold text-primary-foreground underline decoration-primary-foreground/30 underline-offset-4">{course.trainerName}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* What you'll learn */}
            <section className="border rounded-2xl p-8 bg-card shadow-sm">
              <h2 className="text-2xl font-bold mb-6">About this course</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p>{course.description}</p>
              </div>
            </section>

            {/* Curriculum */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
              <div className="border rounded-2xl overflow-hidden bg-card shadow-sm">
                <div className="bg-muted/50 p-4 border-b flex justify-between items-center text-sm font-medium">
                  <span>{course.lessons?.length || 0} Lessons</span>
                  {/* Total duration calculation would go here if available */}
                </div>
                <div className="divide-y">
                  {course.lessons?.length ? (
                    course.lessons.map((lesson, index) => (
                      <div key={lesson.id} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                        <div className="text-muted-foreground w-6 text-right font-medium shrink-0 pt-0.5">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {lesson.videoUrl ? (
                              <PlayCircle className="h-4 w-4 text-primary" />
                            ) : (
                              <FileText className="h-4 w-4 text-primary" />
                            )}
                            <h4 className="font-medium">{lesson.title}</h4>
                          </div>
                          {lesson.moduleTitle && (
                            <p className="text-xs text-muted-foreground">Module: {lesson.moduleTitle}</p>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground gap-2 shrink-0">
                          {lesson.duration && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {lesson.duration}m
                            </span>
                          )}
                          <Lock className="h-3 w-3" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      Curriculum content is being updated.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Reviews */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Student Reviews</h2>
              <div className="space-y-6">
                {course.ratings && course.ratings.length > 0 ? (
                  course.ratings.map((review) => (
                    <div key={review.id} className="border-b pb-6 last:border-0">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {review.studentName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{review.studentName}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex text-amber-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-muted-foreground opacity-30'}`} />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(review.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.review && (
                        <p className="text-sm text-foreground/90">{review.review}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground italic">
                    No reviews yet. Be the first to review after taking the course!
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-lg border-primary/10 overflow-hidden">
                {course.thumbnail ? (
                  <div className="aspect-video w-full bg-muted">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-primary/5 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-primary/20" />
                  </div>
                )}
                <CardContent className="p-6 space-y-6">
                  <div className="text-3xl font-bold">${course.price.toFixed(2)}</div>
                  
                  <Button 
                    size="lg" 
                    className="w-full font-semibold text-lg"
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                  </Button>
                  
                  <div className="text-center text-xs text-muted-foreground">
                    30-Day Money-Back Guarantee
                  </div>

                  <Separator />

                  <div className="space-y-4 text-sm">
                    <h4 className="font-semibold text-base">This course includes:</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-muted-foreground">
                        <PlayCircle className="h-5 w-5 text-primary" />
                        <span>On-demand video content</span>
                      </li>
                      <li className="flex items-center gap-3 text-muted-foreground">
                        <FileText className="h-5 w-5 text-primary" />
                        <span>Downloadable resources</span>
                      </li>
                      <li className="flex items-center gap-3 text-muted-foreground">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <span>{course.lessonCount} comprehensive lessons</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
