import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";

// Lazy loaded role-based dashboards
import AdminDashboard from "./admin";
import TrainerDashboard from "./trainer";
import StudentDashboard from "./student";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "trainer":
      return <TrainerDashboard />;
    case "student":
      return <StudentDashboard />;
    default:
      return <div>Invalid Role</div>;
  }
}
