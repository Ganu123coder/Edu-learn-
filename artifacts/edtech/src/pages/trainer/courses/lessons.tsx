import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetCourse, useCreateLesson } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ArrowLeft, GripVertical, FileVideo, FileText, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const lessonSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  pdfUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  duration: z.coerce.number().min(0).optional(),
  moduleTitle: z.string().optional(),
});

type LessonFormValues = z.infer<typeof lessonSchema>;

export default function CourseLessons() {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id || "0", 10);
  const { toast } = useToast();

  const { data: course, isLoading, refetch } = useGetCourse(courseId, {
    query: { enabled: !!courseId, queryKey: ["/api/courses", courseId] }
  });

  const createLessonMutation = useCreateLesson();

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      videoUrl: "",
      pdfUrl: "",
      duration: 0,
      moduleTitle: "",
    },
  });

  const onSubmit = async (data: LessonFormValues) => {
    try {
      await createLessonMutation.mutateAsync({
        id: courseId,
        data: {
          title: data.title,
          videoUrl: data.videoUrl || undefined,
          pdfUrl: data.pdfUrl || undefined,
          duration: data.duration,
          moduleTitle: data.moduleTitle || undefined,
          orderIndex: course?.lessons?.length ?? 0,
        },
      });
      toast({ title: "Lesson added successfully" });
      form.reset();
      refetch();
    } catch (error: any) {
      toast({
        title: "Failed to add lesson",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-8 space-y-8"><Skeleton className="h-10 w-64" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/trainer/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Lessons</h1>
          <p className="text-muted-foreground">Course: {course?.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="border-border/50 shadow-sm sticky top-24">
            <CardHeader>
              <CardTitle>Add New Lesson</CardTitle>
              <CardDescription>Add content to your course curriculum.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lesson Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Introduction to React" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="moduleTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module/Section (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Getting Started" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pdfUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PDF/Resource URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createLessonMutation.isPending}>
                    {createLessonMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Lesson
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Curriculum</CardTitle>
              <CardDescription>
                {course?.lessons?.length || 0} lessons total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {course?.lessons && course.lessons.length > 0 ? (
                <div className="space-y-3">
                  {course.lessons.sort((a, b) => a.orderIndex - b.orderIndex).map((lesson, idx) => (
                    <div key={lesson.id} className="flex items-center gap-4 p-4 border rounded-xl bg-card hover:bg-muted/20 transition-colors">
                      <div className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">{idx + 1}. {lesson.title}</h4>
                        </div>
                        {lesson.moduleTitle && (
                          <p className="text-sm text-muted-foreground mt-1">Module: {lesson.moduleTitle}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          {lesson.duration > 0 && (
                            <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {lesson.duration}m</span>
                          )}
                          {lesson.videoUrl && (
                            <span className="flex items-center text-primary/80"><FileVideo className="h-3 w-3 mr-1" /> Video attached</span>
                          )}
                          {lesson.pdfUrl && (
                            <span className="flex items-center text-orange-500/80"><FileText className="h-3 w-3 mr-1" /> PDF attached</span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">Remove</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  <FileVideo className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No lessons added yet.</p>
                  <p className="text-sm mt-1">Use the form to add your first lesson.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
