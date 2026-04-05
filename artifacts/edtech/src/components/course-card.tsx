import { Link } from "wouter";
import { Course } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, BookOpen } from "lucide-react";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="h-full overflow-hidden hover:shadow-md transition-all duration-300 group cursor-pointer border-border/50 hover:border-primary/20 flex flex-col">
        <div className="aspect-video relative overflow-hidden bg-muted">
          {course.thumbnail ? (
            <img 
              src={course.thumbnail} 
              alt={course.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
              <BookOpen className="h-12 w-12 opacity-20" />
            </div>
          )}
          <Badge className="absolute top-2 left-2 bg-background/90 text-foreground backdrop-blur hover:bg-background/90 font-medium border-none shadow-sm">
            {course.category}
          </Badge>
        </div>
        
        <CardContent className="p-5 flex flex-col flex-1">
          <h3 className="font-semibold text-lg line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
            {course.description}
          </p>
          
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <span className="font-medium text-foreground">{course.trainerName}</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center text-amber-500">
              <Star className="h-4 w-4 fill-current mr-1" />
              <span>{course.rating.toFixed(1)}</span>
              <span className="text-muted-foreground ml-1 font-normal">({course.ratingCount})</span>
            </div>
            <div className="flex items-center text-muted-foreground font-normal">
              <Users className="h-4 w-4 mr-1" />
              <span>{course.enrolledCount.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-5 pt-0 border-t border-border/50 mt-auto flex items-center justify-between">
          <div className="font-bold text-lg">
            ${course.price.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground flex items-center">
            <BookOpen className="h-3 w-3 mr-1" />
            {course.lessonCount} lessons
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
