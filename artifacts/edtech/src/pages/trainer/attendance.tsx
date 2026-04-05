import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useGetTrainerStats, useListAttendance, useMarkAttendance } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Calendar as CalendarIcon, Loader2 } from "lucide-react";

export default function TrainerAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [sessionDate, setSessionDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const { data: stats } = useGetTrainerStats(user?.id || 0, {
    query: { enabled: !!user?.id }
  });

  const courseIdNum = selectedCourse ? parseInt(selectedCourse, 10) : undefined;

  const { data: attendanceRecords, isLoading: attendanceLoading, refetch } = useListAttendance(
    { courseId: courseIdNum },
    { query: { enabled: !!courseIdNum } }
  );

  const markAttendanceMutation = useMarkAttendance();

  const handleMark = async (studentId: number, status: "present" | "absent") => {
    if (!courseIdNum) return;
    
    try {
      await markAttendanceMutation.mutateAsync({
        data: {
          courseId: courseIdNum,
          studentId,
          sessionDate,
          status,
        }
      });
      toast({ title: `Marked as ${status}` });
      refetch();
    } catch (error: any) {
      toast({
        title: "Failed to mark attendance",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Filter records for the selected date
  const recordsForDate = attendanceRecords?.filter(r => r.sessionDate.startsWith(sessionDate)) || [];
  
  // We don't have a direct endpoint to get enrolled students for a specific course yet
  // We'll approximate this by looking at unique students in attendance records, or ideally 
  // the platform would have an endpoint for this. For this demo, let's just show records.
  // In a real app, we'd list enrolled students and left-join with attendance records.

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Manage Attendance</h1>
        <p className="text-muted-foreground">Track student attendance for your live sessions.</p>
      </div>

      <Card className="mb-8 border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Course</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {stats?.courses.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>{course.title}</SelectItem>
                  ))}
                  {stats?.courses.length === 0 && (
                    <SelectItem value="none" disabled>No courses available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Session Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date" 
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCourse ? (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Attendance Records for {format(new Date(sessionDate), "MMMM d, yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recordsForDate.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                          No attendance records found for this date. 
                          {/* Note: Ideally we'd list students and allow marking here */}
                        </TableCell>
                      </TableRow>
                    ) : (
                      recordsForDate.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.studentName}</TableCell>
                          <TableCell>
                            <Badge variant={record.status === "present" ? "default" : "destructive"} 
                                   className={record.status === "present" ? "bg-green-500 hover:bg-green-600" : ""}>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
                                onClick={() => handleMark(record.studentId, "present")}
                              >
                                <Check className="h-4 w-4 mr-1" /> Present
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                                onClick={() => handleMark(record.studentId, "absent")}
                              >
                                <X className="h-4 w-4 mr-1" /> Absent
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Select a course to view and manage attendance.
        </div>
      )}
    </div>
  );
}
