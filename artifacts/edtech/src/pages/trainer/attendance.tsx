import { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  useGetTrainerStats,
  useListEnrollments,
  useListAttendance,
  useMarkAttendance,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Check,
  X,
  Calendar as CalendarIcon,
  Loader2,
  Users,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";

export default function TrainerAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [sessionDate, setSessionDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [markingId, setMarkingId] = useState<number | null>(null);

  const { data: stats } = useGetTrainerStats(user?.id || 0, {
    query: { enabled: !!user?.id },
  });

  const courseIdNum = selectedCourse ? parseInt(selectedCourse, 10) : undefined;

  const { data: allEnrollments, isLoading: enrollmentsLoading } =
    useListEnrollments({
      query: { enabled: !!courseIdNum },
    });

  const enrolledStudents = (allEnrollments || []).filter(
    (e) => e.courseId === courseIdNum
  );

  const {
    data: attendanceRecords,
    isLoading: attendanceLoading,
    refetch,
  } = useListAttendance(
    { courseId: courseIdNum },
    { query: { enabled: !!courseIdNum } }
  );

  const markAttendanceMutation = useMarkAttendance();

  const recordsForDate = (attendanceRecords || []).filter((r) =>
    r.sessionDate.startsWith(sessionDate)
  );

  const getStudentStatus = (studentId: number) => {
    const record = recordsForDate.find((r) => r.studentId === studentId);
    return record?.status ?? null;
  };

  const handleMark = async (
    studentId: number,
    status: "present" | "absent"
  ) => {
    if (!courseIdNum) return;
    setMarkingId(studentId);
    try {
      await markAttendanceMutation.mutateAsync({
        data: { courseId: courseIdNum, studentId, sessionDate, status },
      });
      toast({ title: `Marked ${status}` });
      refetch();
    } catch (error: any) {
      toast({
        title: "Failed to mark attendance",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setMarkingId(null);
    }
  };

  const presentCount = recordsForDate.filter((r) => r.status === "present").length;
  const absentCount = recordsForDate.filter((r) => r.status === "absent").length;
  const notMarkedCount = enrolledStudents.length - recordsForDate.length;

  const isLoading = enrollmentsLoading || attendanceLoading;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Attendance Manager</h1>
        <p className="text-muted-foreground mt-1">
          Mark student attendance for your live sessions.
        </p>
      </div>

      <Card className="mb-6 border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Course</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {stats?.courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
                    </SelectItem>
                  ))}
                  {(!stats?.courses || stats.courses.length === 0) && (
                    <SelectItem value="none" disabled>
                      No courses available
                    </SelectItem>
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

      {!selectedCourse ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl bg-muted/20">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Select a course to view and mark attendance.</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {enrolledStudents.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="border-border/50 shadow-sm bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-500 flex-shrink-0" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                    <div className="text-xs text-muted-foreground">Present</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                  <div>
                    <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                    <div className="text-xs text-muted-foreground">Absent</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-sm">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <MinusCircle className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-2xl font-bold">{notMarkedCount}</div>
                    <div className="text-xs text-muted-foreground">Not Marked</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>
                {format(new Date(sessionDate + "T00:00:00"), "MMMM d, yyyy")}
              </CardTitle>
              <CardDescription>
                {enrolledStudents.length} students enrolled
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrolledStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No students are enrolled in this course yet.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Mark Attendance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrolledStudents.map((enrollment) => {
                        const status = getStudentStatus(enrollment.studentId);
                        const isMarking = markingId === enrollment.studentId;
                        return (
                          <TableRow key={enrollment.studentId}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {enrollment.studentName.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{enrollment.studentName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {enrollment.progressPercentage}% progress
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {status === "present" ? (
                                <Badge className="bg-green-500 hover:bg-green-600">
                                  <Check className="h-3 w-3 mr-1" /> Present
                                </Badge>
                              ) : status === "absent" ? (
                                <Badge variant="destructive">
                                  <X className="h-3 w-3 mr-1" /> Absent
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Not Marked</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant={status === "present" ? "default" : "outline"}
                                  className={
                                    status !== "present"
                                      ? "border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                                      : "bg-green-500 hover:bg-green-600"
                                  }
                                  disabled={isMarking}
                                  onClick={() => handleMark(enrollment.studentId, "present")}
                                >
                                  {isMarking ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Check className="h-3 w-3 mr-1" />
                                  )}
                                  Present
                                </Button>
                                <Button
                                  size="sm"
                                  variant={status === "absent" ? "destructive" : "outline"}
                                  className={
                                    status !== "absent"
                                      ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                      : ""
                                  }
                                  disabled={isMarking}
                                  onClick={() => handleMark(enrollment.studentId, "absent")}
                                >
                                  {isMarking ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <X className="h-3 w-3 mr-1" />
                                  )}
                                  Absent
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
