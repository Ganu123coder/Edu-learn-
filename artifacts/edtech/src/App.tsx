import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Courses from "@/pages/courses/index";
import CourseDetail from "@/pages/courses/detail";
import Dashboard from "@/pages/dashboard/index";
import AdminUsers from "@/pages/admin/users";
import AdminCategories from "@/pages/admin/categories";
import TrainerCourses from "@/pages/trainer/courses/index";
import TrainerCourseForm from "@/pages/trainer/courses/form";
import TrainerCourseLessons from "@/pages/trainer/courses/lessons";
import TrainerAttendance from "@/pages/trainer/attendance";
import StudentCourses from "@/pages/student/courses";
import StudentCoursePlayer from "@/pages/student/course-player";
import StudentAIPlanner from "@/pages/student/ai-planner";
import StudentMyRoadmap from "@/pages/student/my-roadmap";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType<any>, roles?: string[] }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    if (roles && !roles.includes(user.role)) {
      setLocation("/dashboard");
    }
  }, [user, roles, setLocation]);

  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;

  return <Component />;
}

function AppRoutes() {
  const [location] = useLocation();
  const isCoursePlayer = location.startsWith('/student/course/');

  // Don't render layout wrapper for course player to allow full screen
  if (isCoursePlayer) {
    return (
      <Switch>
        <Route path="/student/course/:enrollmentId">
          {() => <ProtectedRoute component={StudentCoursePlayer} roles={["student"]} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/courses" component={Courses} />
        <Route path="/courses/:id" component={CourseDetail} />

        {/* Private Routes */}
        <Route path="/dashboard">
          {() => <ProtectedRoute component={Dashboard} />}
        </Route>

        <Route path="/admin/users">
          {() => <ProtectedRoute component={AdminUsers} roles={["admin"]} />}
        </Route>
        <Route path="/admin/categories">
          {() => <ProtectedRoute component={AdminCategories} roles={["admin"]} />}
        </Route>

        <Route path="/trainer/courses">
          {() => <ProtectedRoute component={TrainerCourses} roles={["trainer"]} />}
        </Route>
        <Route path="/trainer/courses/new">
          {() => <ProtectedRoute component={TrainerCourseForm} roles={["trainer"]} />}
        </Route>
        <Route path="/trainer/courses/:id/edit">
          {() => <ProtectedRoute component={TrainerCourseForm} roles={["trainer"]} />}
        </Route>
        <Route path="/trainer/courses/:id/lessons">
          {() => <ProtectedRoute component={TrainerCourseLessons} roles={["trainer"]} />}
        </Route>
        <Route path="/trainer/attendance">
          {() => <ProtectedRoute component={TrainerAttendance} roles={["trainer"]} />}
        </Route>

        <Route path="/student/courses">
          {() => <ProtectedRoute component={StudentCourses} roles={["student"]} />}
        </Route>
        <Route path="/ai-planner">
          {() => <ProtectedRoute component={StudentAIPlanner} roles={["student"]} />}
        </Route>
        <Route path="/my-roadmap">
          {() => <ProtectedRoute component={StudentMyRoadmap} roles={["student"]} />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
