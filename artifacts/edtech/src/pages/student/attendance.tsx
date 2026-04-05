import { useAuth } from "@/lib/auth";
import { useListAttendance, useListEnrollments } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  XCircle,
  CalendarCheck,
  BookOpen,
  TrendingUp,
} from "lucide-react";

export default function StudentAttendance() {
  const { user } = useAuth();

  const { data: attendanceRecords, isLoading: attendanceLoading } =
    useListAttendance(undefined, {
      query: { enabled: !!user?.id },
    });

  const { data: enrollments, isLoading: enrollmentsLoading } =
    useListEnrollments({
      query: { enabled: !!user?.id },
    });

  const isLoading = attendanceLoading || enrollmentsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const records = attendanceRecords || [];
  const myEnrollments = enrollments || [];

  const totalSessions = records.length;
  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const overallPercentage =
    totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  const byCourseName: Record<
    string,
    { courseId: number; present: number; absent: number; sessions: typeof records }
  > = {};

  for (const record of records) {
    if (!byCourseName[record.courseTitle]) {
      byCourseName[record.courseTitle] = {
        courseId: record.courseId,
        present: 0,
        absent: 0,
        sessions: [],
      };
    }
    if (record.status === "present") byCourseName[record.courseTitle].present++;
    else byCourseName[record.courseTitle].absent++;
    byCourseName[record.courseTitle].sessions.push(record);
  }

  const courseStats = Object.entries(byCourseName).map(([title, data]) => ({
    title,
    ...data,
    total: data.present + data.absent,
    percentage:
      data.present + data.absent > 0
        ? Math.round((data.present / (data.present + data.absent)) * 100)
        : 0,
  }));

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
  );

  const getPercentageColor = (pct: number) => {
    if (pct >= 75) return "text-green-600";
    if (pct >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 75) return "bg-green-500";
    if (pct >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground mt-1">
          Track your session attendance across all enrolled courses.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getPercentageColor(overallPercentage)}`}>
              {overallPercentage}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">{totalSessions} sessions total</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-green-50 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Present</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{presentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">out of {totalSessions}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-red-50 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{absentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalSessions > 0
                ? `${Math.round((absentCount / totalSessions) * 100)}% absence rate`
                : "no sessions yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {courseStats.length > 0 && (
        <Card className="border-border/50 shadow-sm mb-8">
          <CardHeader>
            <CardTitle>Per-Course Breakdown</CardTitle>
            <CardDescription>Attendance percentage for each course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {courseStats.map((course) => (
                <div key={course.courseId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-sm">{course.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {course.present}/{course.total} sessions
                      </span>
                      <span className={`font-bold ${getPercentageColor(course.percentage)}`}>
                        {course.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(course.percentage)}`}
                      style={{ width: `${course.percentage}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                      {course.present} present
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                      {course.absent} absent
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Session History
          </CardTitle>
          <CardDescription>All recorded attendance sessions, most recent first</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium mb-1">No attendance records yet</p>
              <p className="text-sm">
                Your trainers will mark attendance for each session.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Session Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.courseTitle}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(record.sessionDate + "T00:00:00"), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {record.status === "present" ? (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Present
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" /> Absent
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {myEnrollments.length > 0 && records.length === 0 && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          You are enrolled in {myEnrollments.length} course
          {myEnrollments.length !== 1 ? "s" : ""}. Attendance will appear here once
          your trainer marks a session.
        </p>
      )}
    </div>
  );
}
