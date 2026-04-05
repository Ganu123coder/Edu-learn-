import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGenerateLearningPlan } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Target, Clock, Zap } from "lucide-react";
import { motion } from "framer-motion";

const aiPlanSchema = z.object({
  careerGoal: z.string().min(5, "Please be more specific about your goal"),
  skillLevel: z.enum(["beginner", "intermediate", "advanced"]),
  hoursPerDay: z.coerce.number().min(1).max(12),
  duration: z.coerce.number().min(1).max(52), // weeks
  preferredTechnologies: z.string().optional(),
  learningStyle: z.enum(["videos", "projects", "theory", "mixed"]).optional(),
});

type AIPlanFormValues = z.infer<typeof aiPlanSchema>;

export default function AIPlanner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePlanMutation = useGenerateLearningPlan();

  const form = useForm<AIPlanFormValues>({
    resolver: zodResolver(aiPlanSchema),
    defaultValues: {
      careerGoal: "",
      skillLevel: "beginner",
      hoursPerDay: 2,
      duration: 12,
      preferredTechnologies: "",
      learningStyle: "mixed",
    },
  });

  const onSubmit = async (data: AIPlanFormValues) => {
    setIsGenerating(true);
    try {
      // Format technologies string to array if provided
      const formattedData = {
        ...data,
        preferredTechnologies: data.preferredTechnologies 
          ? data.preferredTechnologies.split(',').map(t => t.trim()) 
          : undefined
      };
      
      await generatePlanMutation.mutateAsync({ data: formattedData });
      
      toast({
        title: "Roadmap Generated!",
        description: "Your personalized learning plan is ready.",
      });
      setLocation("/my-roadmap");
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "We couldn't generate your plan at this time.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] space-y-8">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full scale-150"></div>
          <Sparkles className="h-16 w-16 text-accent relative z-10" />
        </motion.div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">AI is crafting your perfect roadmap</h2>
          <p className="text-muted-foreground animate-pulse">Analyzing career paths and skill requirements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-10 space-y-4">
        <div className="inline-flex items-center rounded-full border bg-accent/10 px-3 py-1 text-sm font-medium text-accent mx-auto">
          <Sparkles className="mr-2 h-4 w-4" />
          EduLearn AI Engine
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Design Your Future</h1>
        <p className="text-xl text-muted-foreground max-w-xl mx-auto">
          Tell us where you want to go. Our AI will analyze industry demands and build a custom week-by-week curriculum to get you there.
        </p>
      </div>

      <Card className="border-border/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -z-10"></div>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Target className="mr-2 h-5 w-5 text-primary" />
            Learning Parameters
          </CardTitle>
          <CardDescription>
            The more specific you are, the better the roadmap will be.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="careerGoal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">What is your ultimate career goal?</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Become a Senior Frontend Engineer at a top tech company" 
                          className="h-12 text-base"
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
                    name="skillLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Skill Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner (Start from scratch)</SelectItem>
                            <SelectItem value="intermediate">Intermediate (Know the basics)</SelectItem>
                            <SelectItem value="advanced">Advanced (Leveling up)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="learningStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Learning Style</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mixed">Mixed (Recommended)</SelectItem>
                            <SelectItem value="projects">Project-based</SelectItem>
                            <SelectItem value="videos">Video-heavy</SelectItem>
                            <SelectItem value="theory">Theory & Reading</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-muted/30 border">
                  <div className="col-span-full mb-[-1rem] flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm text-muted-foreground">Time Commitment</span>
                  </div>
                  <FormField
                    control={form.control}
                    name="hoursPerDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours per day</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target duration (weeks)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="52" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="preferredTechnologies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specific technologies to include (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., React, TypeScript, Node.js (comma separated)" {...field} />
                      </FormControl>
                      <FormDescription>Leave blank to let AI decide the best tech stack.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-14 text-lg bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Zap className="mr-2 h-5 w-5" />
                Generate My Roadmap
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
