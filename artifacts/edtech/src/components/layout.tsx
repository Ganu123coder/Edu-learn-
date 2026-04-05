import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, LogOut, LayoutDashboard, Settings, User as UserIcon } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold tracking-tight text-primary">EduLearn</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/courses" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Explore Courses
              </Link>
              {user?.role === "student" && (
                <Link href="/ai-planner" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  AI Planner
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profilePhoto || ""} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs font-semibold uppercase text-primary mt-1">
                        {user.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer w-full flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "student" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/student/courses" className="cursor-pointer w-full flex items-center">
                          <BookOpen className="mr-2 h-4 w-4" />
                          <span>My Courses</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.role === "trainer" && (
                    <DropdownMenuItem asChild>
                      <Link href="/trainer/courses" className="cursor-pointer w-full flex items-center">
                        <BookOpen className="mr-2 h-4 w-4" />
                        <span>Manage Courses</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/users" className="cursor-pointer w-full flex items-center">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Manage Users</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="hidden sm:inline-flex">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t bg-muted/40 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold tracking-tight">EduLearn</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Transforming careers through expert-led, AI-guided learning experiences.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/courses" className="hover:text-foreground">Browse Courses</Link></li>
              <li><Link href="/ai-planner" className="hover:text-foreground">AI Learning Planner</Link></li>
              <li><Link href="/register" className="hover:text-foreground">Become a Trainer</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
              <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
