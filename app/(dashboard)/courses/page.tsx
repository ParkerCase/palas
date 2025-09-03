'use client'

import { useAuth } from '../../components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PlayCircle, CheckCircle, Clock, BookOpen, Award} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  duration: string
  modules: number
  progress: number
  status: 'not_started' | 'in_progress' | 'completed'
  thumbnail: string
  price: number
  rating: number
  students: number
}

interface Module {
  id: string
  title: string
  duration: string
  status: 'locked' | 'available' | 'completed'
  type: 'video' | 'document' | 'quiz'
}

export default function CoursesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // TESTING MODE: Skip auth redirect
    /*
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      loadCourses()
    }
    */
    loadCourses()
  }, [user, loading, router])

  const loadCourses = async () => {
    try {
      // Government Procurement 101 course data
      const mockCourses = [
        {
          id: 'course-001',
          title: 'Government Procurement 101: Complete Federal Contracting Guide',
          description: 'Master the fundamentals of government contracting with this comprehensive 6-module course. Learn about federal procurement processes, registration requirements, proposal writing, and winning strategies.',
          duration: '8 hours',
          modules: 6,
          progress: 33,
          status: 'in_progress' as const,
          thumbnail: '/course-thumbnails/gov-procurement-101.jpg',
          price: 299,
          rating: 4.9,
          students: 1247
        },
        {
          id: 'course-002',
          title: 'Advanced Contract Negotiation Strategies',
          description: 'Advanced techniques for negotiating government contracts, understanding terms and conditions, and maximizing profit margins while maintaining compliance.',
          duration: '6 hours',
          modules: 4,
          progress: 0,
          status: 'not_started' as const,
          thumbnail: '/course-thumbnails/negotiation.jpg',
          price: 399,
          rating: 4.8,
          students: 892
        },
        {
          id: 'course-003',
          title: 'Federal Grant Writing Mastery',
          description: 'Complete guide to writing winning federal grant proposals. Covers research, planning, writing, and submission strategies for maximum success.',
          duration: '10 hours',
          modules: 8,
          progress: 100,
          status: 'completed' as const,
          thumbnail: '/course-thumbnails/grant-writing.jpg',
          price: 249,
          rating: 4.7,
          students: 2156
        }
      ]
      
      setCourses(mockCourses)
      setCurrentCourse(mockCourses[0]) // Set first course as current
      loadModules(mockCourses[0].id)
    } catch (error) {
      console.error('Failed to load courses:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadModules = async (courseId: string) => {
    try {
      // Government Procurement 101 modules
      const mockModules = [
        {
          id: 'module-001',
          title: 'MODULE 1: Introduction to Government Contracting',
          duration: '45 min',
          status: 'completed' as const,
          type: 'video' as const
        },
        {
          id: 'module-002',
          title: 'MODULE 2: Business Registration and Certifications',
          duration: '60 min',
          status: 'completed' as const,
          type: 'video' as const
        },
        {
          id: 'module-003',
          title: 'MODULE 3: Understanding Federal Acquisition Regulation (FAR)',
          duration: '75 min',
          status: 'available' as const,
          type: 'video' as const
        },
        {
          id: 'module-004',
          title: 'MODULE 4: Proposal Writing and Submission',
          duration: '90 min',
          status: 'locked' as const,
          type: 'video' as const
        },
        {
          id: 'module-005',
          title: 'MODULE 5: Contract Performance and Compliance',
          duration: '60 min',
          status: 'locked' as const,
          type: 'video' as const
        },
        {
          id: 'module-006',
          title: 'MODULE 6: Advanced Strategies and Best Practices',
          duration: '70 min',
          status: 'locked' as const,
          type: 'video' as const
        }
      ]
      
      setModules(mockModules)
    } catch (error) {
      console.error('Failed to load modules:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getModuleIcon = (status: string, type: string) => {
    if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-600" />
    if (status === 'locked') return <Clock className="h-5 w-5 text-gray-400" />
    if (type === 'video') return <PlayCircle className="h-5 w-5 text-blue-600" />
    return <BookOpen className="h-5 w-5 text-blue-600" />
  }

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Learning Center</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => router.push('/opportunities')}>
                Request Opportunities
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course List */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Courses</h2>
            <div className="space-y-4">
              {courses.map((course) => (
                <Card 
                  key={course.id} 
                  className={`cursor-pointer transition-all ${
                    currentCourse?.id === course.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => {
                    setCurrentCourse(course)
                    loadModules(course.id)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">
                          {course.title}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getStatusColor(course.status)}>
                            {course.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">{course.duration}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center text-yellow-500">
                            <Award className="h-3 w-3 mr-1" />
                            <span className="text-xs">{course.rating}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {course.students} students
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Course Details */}
          <div className="lg:col-span-2">
            {currentCourse && (
              <div className="space-y-6">
                {/* Course Header */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {currentCourse.title}
                        </h2>
                        <p className="text-gray-600 mb-4">
                          {currentCourse.description}
                        </p>
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {currentCourse.duration}
                          </div>
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {currentCourse.modules} modules
                          </div>
                          <div className="flex items-center">
                            <Award className="h-4 w-4 mr-1" />
                            {currentCourse.rating} rating
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 mb-2">
                          ${currentCourse.price}
                        </div>
                        <Badge className={getStatusColor(currentCourse.status)}>
                          {currentCourse.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{currentCourse.progress}% Complete</span>
                      </div>
                      <Progress value={currentCourse.progress} className="h-2" />
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button className="flex-1">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Button>
                      <Button variant="outline">
                        Download Resources
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Modules */}
                <Card>
                  <CardHeader>
                    <CardTitle>Course Modules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {modules.map((module, index) => (
                        <div
                          key={module.id}
                          className={`flex items-center space-x-4 p-3 rounded-lg ${
                            module.status === 'locked' 
                              ? 'bg-gray-50 opacity-60' 
                              : 'bg-white border hover:shadow-sm cursor-pointer'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {getModuleIcon(module.status, module.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {module.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {module.duration} • {module.type}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            {module.status === 'completed' && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                            {module.status === 'available' && (
                              <Button size="sm">
                                Start
                              </Button>
                            )}
                            {module.status === 'locked' && (
                              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                Locked
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
