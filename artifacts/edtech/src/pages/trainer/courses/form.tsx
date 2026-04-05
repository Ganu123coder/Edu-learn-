import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  useCreateCourse, 
  useUpdateCourse, 
  useGetCourse, 
  useListCategories 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const courseFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
  thumbnail: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price must be positive"),
  isPublished: z.boolean().default(false),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

export default function CourseForm() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const courseId = id ? parseInt(id, 10) : 0;
  const { toast } = useToast();

  const { data: categories } = useListCategories();
  const { data: course, isLoading: courseLoading } = useGetCourse(courseId, {
    query: { enabled: isEditing }
  });

  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      thumbnail: "",
      price: 0,
      isPublished: false,
    },
  });

  useEffect(() => {
    if (isEditing && course) {
      form.reset({
        title: course.title,
        description: course.description,
        category: course.category,
        thumbnail: course.thumbnail || "",
        price: course.price,
        isPublished: course.isPublished,
      });
    }
  }, [isEditing, course, form]);

  const onSubmit = async (data: CourseFormValues) => {
    try {
      if (isEditing) {
        await updateCourseMutation.mutateAsync({
          id: courseId,
          data: {
            ...data,
            thumbnail: data.thumbnail || undefined,
          }
        });
        toast({ title: "Course updated successfully" });
      } else {
        const res = await createCourseMutation.mutateAsync({
          data: {
            ...data,
            thumbnail: data.thumbnail || undefined,
          }
        });
        toast({ title: "Course created successfully" });
        setLocation(`/trainer/courses/${res.id}/lessons`);
        return;
      }
      setLocation("/trainer/courses");
    } catch (error: any) {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} course`,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isEditing && courseLoading) {
    return <div className="container mx-auto p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isPending = createCourseMutation.isPending || updateCourseMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/trainer/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? "Edit Course" : "Create New Course"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update your course details below." : "Fill in the details to start a new course."}
          </p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Advanced React Patterns" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what students will learn..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormDescription>Provide a URL for the course cover image.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Publish Course</FormLabel>
                      <FormDescription>
                        Make this course visible to students. You can leave it off while adding lessons.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Link href="/trainer/courses">
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Save Changes" : "Create & Add Lessons"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
