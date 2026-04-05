import { useGetPlatformStats, useListCourses, useListCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, BookOpen, Users, Award, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetPlatformStats();
  const { data: courses, isLoading: coursesLoading } = useListCourses({ category: undefined, search: undefined });
  const { data: categories, isLoading: categoriesLoading } = useListCategories();

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80"></div>
        <div className="container relative z-10 mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <motion.div 
            className="flex-1 text-center md:text-left space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-sm font-medium backdrop-blur-sm">
              <Sparkles className="mr-2 h-4 w-4 text-accent" />
              <span className="text-primary-foreground/90">AI-Guided Learning Paths</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Master the skills that <span className="text-accent">matter most</span>.
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
              Join thousands of professionals transforming their careers with expert-led courses and personalized AI roadmaps.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-4">
              <Link href="/courses">
                <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
                  Explore Courses
                </Button>
              </Link>
              <Link href="/ai-planner">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Generate AI Plan
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div 
            className="flex-1 hidden lg:block"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-primary-foreground/20">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
                alt="Students learning" 
                className="w-full h-auto object-cover aspect-video"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-8">
                <div className="bg-background/95 backdrop-blur rounded-xl p-4 shadow-lg border border-border flex items-center gap-4 w-full">
                  <div className="bg-accent/20 p-3 rounded-lg text-accent">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Platform Activity</p>
                    <p className="text-lg font-bold text-foreground">
                      {statsLoading ? "..." : `${stats?.totalEnrollments.toLocaleString()}+ Enrollments`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <Users className="h-8 w-8 text-primary mb-2 opacity-80" />
              <h3 className="text-3xl font-bold tracking-tight">
                {statsLoading ? <Skeleton className="h-9 w-24" /> : stats?.totalStudents.toLocaleString()}
              </h3>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Active Learners</p>
            </div>
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <BookOpen className="h-8 w-8 text-primary mb-2 opacity-80" />
              <h3 className="text-3xl font-bold tracking-tight">
                {statsLoading ? <Skeleton className="h-9 w-24" /> : stats?.totalCourses.toLocaleString()}
              </h3>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Premium Courses</p>
            </div>
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <Award className="h-8 w-8 text-primary mb-2 opacity-80" />
              <h3 className="text-3xl font-bold tracking-tight">
                {statsLoading ? <Skeleton className="h-9 w-24" /> : stats?.totalTrainers.toLocaleString()}
              </h3>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Expert Trainers</p>
            </div>
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <TrendingUp className="h-8 w-8 text-primary mb-2 opacity-80" />
              <h3 className="text-3xl font-bold tracking-tight">
                {statsLoading ? <Skeleton className="h-9 w-24" /> : stats?.totalEnrollments.toLocaleString()}
              </h3>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Enrollments</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Explore Top Categories</h2>
              <p className="text-muted-foreground">Find the perfect course for your career goals.</p>
            </div>
            <Link href="/courses">
              <Button variant="ghost" className="hidden sm:flex group">
                Browse all <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoriesLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))
            ) : (
              categories?.slice(0, 8).map((cat) => (
                <Link key={cat.id} href={`/courses?category=${cat.slug}`}>
                  <div className="group border rounded-xl p-6 hover:border-primary hover:shadow-md transition-all cursor-pointer bg-card flex flex-col justify-center items-center text-center h-full">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{cat.courseCount} courses</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Featured Courses</h2>
              <p className="text-muted-foreground">Highly rated courses by our top trainers.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {coursesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[380px] w-full rounded-xl" />
              ))
            ) : (
              // Show top 4 highest rated courses or recent
              courses?.sort((a, b) => b.rating - a.rating).slice(0, 4).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))
            )}
          </div>
          
          <div className="mt-10 text-center sm:hidden">
            <Link href="/courses">
              <Button variant="outline" className="w-full">
                Browse all courses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Planner Promo */}
      <section className="py-20 border-t">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-3xl overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 p-32 bg-accent/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 p-32 bg-blue-500/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
            
            <div className="grid md:grid-cols-2 items-center gap-8 p-8 md:p-16 relative z-10">
              <div className="space-y-6 text-primary-foreground">
                <div className="inline-flex items-center rounded-full bg-primary-foreground/10 px-3 py-1 text-sm font-medium backdrop-blur-sm border border-primary-foreground/20">
                  <Sparkles className="mr-2 h-4 w-4 text-accent" />
                  <span>EduLearn AI</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Not sure where to start? Let AI build your roadmap.</h2>
                <p className="text-primary-foreground/80 text-lg">
                  Tell us your career goal, skill level, and available time. Our AI will generate a personalized week-by-week learning plan tailored to your needs.
                </p>
                <div className="pt-4">
                  <Link href="/ai-planner">
                    <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-8">
                      Try AI Planner <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex justify-center">
                <div className="relative w-full max-w-sm aspect-[3/4] bg-background rounded-2xl p-6 shadow-2xl rotate-3 transform transition-transform hover:rotate-0 duration-500 border border-border">
                  <div className="space-y-4">
                    <div className="h-4 w-1/3 bg-muted rounded"></div>
                    <div className="h-8 w-3/4 bg-primary/10 rounded"></div>
                    <div className="space-y-2 pt-4">
                      <div className="flex gap-3 items-start">
                        <div className="h-6 w-6 rounded-full bg-accent/20 flex-shrink-0"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-full bg-muted rounded"></div>
                          <div className="h-4 w-5/6 bg-muted rounded"></div>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start pt-4">
                        <div className="h-6 w-6 rounded-full bg-accent/20 flex-shrink-0"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-full bg-muted rounded"></div>
                          <div className="h-4 w-4/6 bg-muted rounded"></div>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start pt-4">
                        <div className="h-6 w-6 rounded-full bg-muted flex-shrink-0"></div>
                        <div className="space-y-2 flex-1 opacity-50">
                          <div className="h-4 w-full bg-muted rounded"></div>
                          <div className="h-4 w-3/4 bg-muted rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
