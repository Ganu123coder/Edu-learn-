import { useGetTrainerStats, useDeleteCourse } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, ListVideo, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TrainerCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: stats, isLoading, refetch } = useGetTrainerStats(user?.id || 0, {
    query: { enabled: !!user?.id }
  });
  const deleteCourseMutation = useDeleteCourse();

  const handleDelete = async (id: number) => {
    try {
      await deleteCourseMutation.mutateAsync({ id });
      toast({ title: "Course deleted successfully" });
      refetch();
    } catch (error: any) {
      toast({
        title: "Failed to delete course",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground">Manage your published and draft courses.</p>
        </div>
        <Link href="/trainer/courses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Course List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrollments</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-32 inline-block" /></TableCell>
                    </TableRow>
                  ))
                ) : stats?.courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      You haven't created any courses yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats?.courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt={course.title} className="h-10 w-16 object-cover rounded" />
                          ) : (
                            <div className="h-10 w-16 bg-muted rounded flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="font-medium line-clamp-1">{course.title}</div>
                        </div>
                      </TableCell>
                      <TableCell>${course.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {course.isPublished ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span>{course.enrolledCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {course.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-500 fill-current" />
                            <span>{course.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No ratings</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/trainer/courses/${course.id}/lessons`}>
                            <Button variant="outline" size="sm" title="Manage Lessons">
                              <ListVideo className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/trainer/courses/${course.id}/edit`}>
                            <Button variant="outline" size="sm" title="Edit Course">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" title="Delete Course">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the course and all its lessons.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(course.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { BookOpen } from "lucide-react";
