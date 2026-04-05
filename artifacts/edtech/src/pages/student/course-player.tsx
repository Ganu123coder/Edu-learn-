import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetStudentStats, useUpdateProgress, useGetCourse } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, PlayCircle, CheckCircle, FileText, ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CoursePlayer() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const id = parseInt(enrollmentId || "0", 10);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // We need the enrollment details
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetStudentStats(user?.id || 0, {
    query: { enabled: !!user?.id }
  });

  const enrollment = stats?.enrollments.find(e => e.id === id);
  const courseId = enrollment?.courseId;

  // We need the course details for the lessons
  const { data: course, isLoading: courseLoading } = useGetCourse(courseId || 0, {
    query: { enabled: !!courseId, queryKey: ["/api/courses", courseId] }
  });

  const updateProgressMutation = useUpdateProgress();

  useEffect(() => {
    // Set first uncompleted lesson or just first lesson as active
    if (course?.lessons?.length && activeLessonId === null && enrollment) {
      const uncompletedLesson = course.lessons.find(l => !enrollment.completedLessons.includes(l.id));
      if (uncompletedLesson) {
        setActiveLessonId(uncompletedLesson.id);
      } else {
        setActiveLessonId(course.lessons[0].id);
      }
    }
  }, [course, enrollment, activeLessonId]);

  if (statsLoading || courseLoading) {
    return <div className="p-8"><Skeleton className="h-screen w-full" /></div>;
  }

  if (!enrollment || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-bold">Enrollment not found</h2>
        <Button className="mt-4" onClick={() => setLocation("/student/courses")}>Back to Courses</Button>
      </div>
    );
  }

  const activeLesson = course.lessons?.find(l => l.id === activeLessonId);
  const isCompleted = activeLesson ? enrollment.completedLessons.includes(activeLesson.id) : false;

  const handleMarkComplete = async () => {
    if (!activeLesson) return;
    
    try {
      await updateProgressMutation.mutateAsync({
        data: {
          lessonId: activeLesson.id,
          completed: !isCompleted
        }
      });
      
      toast({
        title: !isCompleted ? "Lesson completed!" : "Lesson marked as incomplete",
      });
      refetchStats();
      
      // Auto-advance if marking complete
      if (!isCompleted) {
        const currentIndex = course.lessons?.findIndex(l => l.id === activeLesson.id) || 0;
        if (course.lessons && currentIndex < course.lessons.length - 1) {
          setActiveLessonId(course.lessons[currentIndex + 1].id);
        }
      }
    } catch (error) {
      toast({
        title: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0 z-10">
        <div className="flex items-center gap-4 truncate">
          <Link href="/student/courses">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="font-semibold truncate pr-4">{course.title}</h1>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-2 text-sm font-medium">
            <Progress value={enrollment.progressPercentage} className="w-24 h-2" />
            <span className="w-10 text-right">{enrollment.progressPercentage}%</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Video Area */}
        <main className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          sidebarOpen && "md:mr-80 lg:mr-96"
        )}>
          <div className="bg-black aspect-video w-full flex-shrink-0 flex items-center justify-center relative">
            {activeLesson?.videoUrl ? (
              <video 
                controls 
                className="w-full h-full outline-none"
                poster={course.thumbnail || undefined}
                src={activeLesson.videoUrl} // In reality this might be an iframe for youtube/vimeo
              />
            ) : (
              <div className="text-white text-center">
                <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-medium">Video Player Placeholder</p>
                <p className="text-white/60 text-sm mt-2">In a real app, video content would play here.</p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 lg:p-10 max-w-4xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold mb-2">{activeLesson?.title || "Select a lesson"}</h2>
                {activeLesson?.moduleTitle && (
                  <p className="text-muted-foreground font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> {activeLesson.moduleTitle}
                  </p>
                )}
              </div>
              
              {activeLesson && (
                <Button 
                  size="lg"
                  onClick={handleMarkComplete}
                  disabled={updateProgressMutation.isPending}
                  className={cn("shrink-0", isCompleted ? "bg-green-600 hover:bg-green-700 text-white" : "")}
                >
                  {isCompleted ? (
                    <><CheckCircle className="mr-2 h-5 w-5" /> Completed</>
                  ) : (
                    "Mark as Complete"
                  )}
                </Button>
              )}
            </div>

            {activeLesson?.pdfUrl && (
              <div className="p-4 border rounded-xl bg-card flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/10 p-2 rounded text-red-500">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">Lesson Resources</p>
                    <p className="text-sm text-muted-foreground">Download PDF materials</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Download</Button>
              </div>
            )}
            
            {/* Fake content for demo */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h3>Lesson Overview</h3>
              <p>This is a placeholder for the rich text content that would accompany the lesson video. It might include key takeaways, code snippets, or additional reading material.</p>
              <p>To continue, watch the video above and click "Mark as Complete" when you're done.</p>
            </div>
          </div>
        </main>

        {/* Sidebar Curriculum */}
        <aside className={cn(
          "absolute right-0 top-0 bottom-0 w-80 lg:w-96 bg-card border-l z-20 flex flex-col transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "translate-x-full md:hidden"
        )}>
          <div className="p-4 border-b bg-muted/30 font-medium flex items-center justify-between">
            Course Content
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-6 w-6 md:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {course.lessons?.sort((a, b) => a.orderIndex - b.orderIndex).map((lesson, idx) => {
                const isDone = enrollment.completedLessons.includes(lesson.id);
                const isActive = activeLessonId === lesson.id;
                
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLessonId(lesson.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors",
                      isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="mt-0.5">
                      {isDone ? (
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] shrink-0",
                          isActive ? "border-primary" : "border-muted-foreground/30 text-muted-foreground"
                        )}>
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium leading-tight", isActive ? "text-primary" : "text-foreground")}>
                        {lesson.title}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground mt-1.5 gap-2">
                        {lesson.videoUrl && <span className="flex items-center"><PlayCircle className="h-3 w-3 mr-1" /> Video</span>}
                        {lesson.duration && <span>{lesson.duration}m</span>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
