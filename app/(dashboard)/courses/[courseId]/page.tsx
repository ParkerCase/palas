// Replace /app/(dashboard)/courses/[courseId]/page.tsx

"use client";
import { notFound, useParams, useRouter } from 'next/navigation';
import { Book, CheckCircle, Play, ArrowLeft } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

interface Course {
  id: string;
  title: string;
  description: string;
  estimated_duration_minutes: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  content_data: unknown;
  order_index: number;
  is_required: boolean;
  estimated_duration_minutes: number;
  completed: boolean;
}

interface UserProgress {
  progress_percentage: number;
  completed_at: string | null;
  current_module_id: string | null;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError || !courseData) {
        notFound();
        return;
      }

      setCourse(courseData);

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (modulesError) {
        throw modulesError;
      }

      // Fetch user progress for modules
      const { data: moduleProgress, error: progressError } = await supabase
        .from('user_module_progress')
        .select('module_id, completed_at')
        .eq('user_id', user?.id)
        .eq('course_id', courseId);

      if (progressError) {
        throw progressError;
      }

      const completedModules = new Set(
        moduleProgress?.filter(p => p.completed_at).map(p => p.module_id) || []
      );

      const modulesWithProgress = modulesData?.map(module => ({
        ...module,
        completed: completedModules.has(module.id)
      })) || [];

      setModules(modulesWithProgress);

      // Fetch overall course progress
      const { data: courseProgress, error: courseProgressError } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user?.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (courseProgressError) {
        throw courseProgressError;
      }

      setUserProgress(courseProgress);

    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "Error",
        description: "Failed to load course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markModuleComplete = async (moduleId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark module as complete
      const { error: moduleError } = await supabase
        .from('user_module_progress')
        .upsert({
          user_id: user?.id,
          course_id: courseId,
          module_id: moduleId,
          completed_at: new Date().toISOString()
        });

      if (moduleError) throw moduleError;

      // Update overall course progress
      const completedCount = modules.filter(m => m.completed || m.id === moduleId).length;
      const progressPercentage = Math.round((completedCount / modules.length) * 100);

      const { error: courseError } = await supabase
        .from('user_course_progress')
        .upsert({
          user_id: user?.id,
          course_id: courseId,
          progress_percentage: progressPercentage,
          completed_at: progressPercentage === 100 ? new Date().toISOString() : null
        });

      if (courseError) throw courseError;

      // Refresh data
      fetchCourseData();

      toast({
        title: "Success",
        description: "Module completed!",
      });

    } catch (error) {
      console.error('Error marking module complete:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto py-10">Loading...</div>;
  }

  if (!course) {
    return notFound();
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Book className="h-10 w-10 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          {userProgress && (
            <p className="text-sm text-gray-600">
              Progress: {userProgress.progress_percentage}%
              {userProgress.completed_at && ' - Completed!'}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Course Modules</h2>
        <ol className="space-y-4">
          {modules.map((module, idx) => {
            const isCompleted = module.completed;
            const isAccessible = idx === 0 || modules[idx - 1]?.completed;
            
            return (
              <li
                key={module.id}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-all ${
                  isAccessible ? 'bg-blue-50 hover:bg-blue-100' : 'bg-gray-50 opacity-60'
                }`}
              >
                <span className="font-bold text-blue-600">{idx + 1}</span>
                <div className="flex-1">
                  <span className="text-gray-900 font-medium">{module.title}</span>
                  {module.description && (
                    <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                  )}
                  {module.estimated_duration_minutes && (
                    <p className="text-xs text-gray-500 mt-1">
                      Estimated time: {module.estimated_duration_minutes} minutes
                    </p>
                  )}
                </div>
                
                {isCompleted ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : isAccessible ? (
                  <button
                    className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center gap-1"
                    onClick={() => markModuleComplete(module.id)}
                  >
                    <Play className="h-3 w-3" />
                    Start
                  </button>
                ) : (
                  <div className="text-gray-400 text-sm">Locked</div>
                )}
              </li>
            );
          })}
        </ol>

        {userProgress?.completed_at && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">Course Completed!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Congratulations! You've completed all modules in this course.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}