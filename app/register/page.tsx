'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'

export default function Register() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNo: '',
    password: '',
    confirmPassword: '',
    college: '',
    customCollege: '',
    degree: '',
    course: '',
    customCourse: '',
    year: ''
  })

  const [availableCourses, setAvailableCourses] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const colleges = [
    'Indian Institute of Technology (IIT) Delhi',
    'Indian Institute of Technology (IIT) Bombay',
    'Indian Institute of Technology (IIT) Madras',
    'Indian Institute of Technology (IIT) Kanpur',
    'Indian Institute of Technology (IIT) Kharagpur',
    'Indian Institute of Technology (IIT) Roorkee',
    'Indian Institute of Technology (IIT) Guwahati',
    'Indian Institute of Technology (IIT) Hyderabad',
    'National Institute of Technology (NIT) Trichy',
    'National Institute of Technology (NIT) Warangal',
    'National Institute of Technology (NIT) Surathkal',
    'National Institute of Technology (NIT) Calicut',
    'Birla Institute of Technology and Science (BITS) Pilani',
    'Delhi Technological University (DTU)',
    'Netaji Subhas University of Technology (NSUT)',
    'Jadavpur University',
    'Anna University',
    'Vellore Institute of Technology (VIT)',
    'SRM Institute of Science and Technology',
    'Manipal Institute of Technology',
    'PES University',
    'RV College of Engineering',
    'BMS College of Engineering',
    'Ramaiah Institute of Technology',
    'JSS Science and Technology University',
    'Amrita Vishwa Vidyapeetham',
    'Thapar Institute of Engineering and Technology',
    'Lovely Professional University (LPU)',
    'Chandigarh University',
    'Other'
  ]

  const degrees = [
    'B.Tech (Bachelor of Technology)',
    'B.E (Bachelor of Engineering)', 
    'BCA (Bachelor of Computer Applications)',
    'B.Sc (Bachelor of Science)',
    'M.Tech (Master of Technology)',
    'M.E (Master of Engineering)',
    'MCA (Master of Computer Applications)',
    'M.Sc (Master of Science)',
    'MBA (Master of Business Administration)',
    'PhD (Doctor of Philosophy)',
    'Other'
  ]

  const coursesByDegree = {
    'B.Tech (Bachelor of Technology)': [
      'Computer Science Engineering',
      'Information Technology',
      'Electronics and Communication Engineering',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Chemical Engineering',
      'Biotechnology Engineering',
      'Aerospace Engineering',
      'Automobile Engineering',
      'Industrial Engineering',
      'Environmental Engineering'
    ],
    'B.E (Bachelor of Engineering)': [
      'Computer Science Engineering',
      'Information Science Engineering',
      'Electronics and Communication Engineering',
      'Electrical and Electronics Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Chemical Engineering',
      'Instrumentation Engineering'
    ],
    'BCA (Bachelor of Computer Applications)': [
      'Computer Applications',
      'Software Development',
      'Web Development',
      'Mobile App Development'
    ],
    'B.Sc (Bachelor of Science)': [
      'Computer Science',
      'Information Technology',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Statistics',
      'Data Science'
    ],
    'M.Tech (Master of Technology)': [
      'Computer Science Engineering',
      'Software Engineering',
      'Data Science',
      'Artificial Intelligence',
      'Machine Learning',
      'Cybersecurity',
      'VLSI Design',
      'Embedded Systems'
    ],
    'M.E (Master of Engineering)': [
      'Computer Science Engineering',
      'Software Engineering',
      'Electronics Engineering',
      'Communication Engineering'
    ],
    'MCA (Master of Computer Applications)': [
      'Computer Applications',
      'Software Development',
      'System Administration',
      'Database Management'
    ],
    'M.Sc (Master of Science)': [
      'Computer Science',
      'Information Technology',
      'Data Science',
      'Mathematics',
      'Statistics'
    ],
    'MBA (Master of Business Administration)': [
      'Technology Management',
      'Operations Management',
      'Human Resources',
      'Marketing',
      'Finance'
    ],
    'PhD (Doctor of Philosophy)': [
      'Computer Science',
      'Information Technology',
      'Engineering',
      'Mathematics',
      'Management'
    ]
  }

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Passed Out']

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })

    // Update available courses when degree changes
    if (name === 'degree') {
      const courses = coursesByDegree[value as keyof typeof coursesByDegree] || []
      setAvailableCourses(courses)
      setFormData(prev => ({ ...prev, course: '', customCourse: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!')
      setIsLoading(false)
      return
    }

    try {
      // Import API function
      const { authAPI } = await import('../lib/api')
      
      // Prepare registration data
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        rollNo: formData.rollNo,
        college: formData.college === 'Other' ? formData.customCollege : formData.college,
        degree: formData.degree,
        course: formData.course === 'Other' ? formData.customCourse : formData.course,
        year: formData.year
      }

      const response = await authAPI.register(registrationData)

      if (response.success) {
        alert('Registration successful! Welcome to the platform!')
        router.push('/dashboard')
      } else {
        alert(response.message || 'Registration failed. Please try again.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Registration failed. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="sticker-card p-8">
            <h1 className="text-3xl font-bold text-center text-black mb-8">
              Join the Community
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="sticker-input"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="sticker-input"
                  placeholder="your.email@gmail.com or college email"
                />
                <p className="text-xs text-gray-500 mt-1">Any valid email address is accepted</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  College/University *
                </label>
                <select
                  name="college"
                  required
                  value={formData.college}
                  onChange={handleChange}
                  className="sticker-input"
                >
                  <option value="">Select your college</option>
                  {colleges.map((college) => (
                    <option key={college} value={college}>
                      {college}
                    </option>
                  ))}
                </select>
              </div>

              {formData.college === 'Other' && (
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    College Name *
                  </label>
                  <input
                    type="text"
                    name="customCollege"
                    required
                    value={formData.customCollege}
                    onChange={handleChange}
                    className="sticker-input"
                    placeholder="Enter your college name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Roll Number
                </label>
                <input
                  type="text"
                  name="rollNo"
                  value={formData.rollNo}
                  onChange={handleChange}
                  className="sticker-input"
                  placeholder="Enter your roll number (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Degree *
                </label>
                <select
                  name="degree"
                  required
                  value={formData.degree}
                  onChange={handleChange}
                  className="sticker-input"
                >
                  <option value="">Select your degree</option>
                  {degrees.map((degree) => (
                    <option key={degree} value={degree}>
                      {degree}
                    </option>
                  ))}
                </select>
              </div>

              {formData.degree && (
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Course/Branch *
                  </label>
                  <select
                    name="course"
                    required
                    value={formData.course}
                    onChange={handleChange}
                    className="sticker-input"
                  >
                    <option value="">Select your course</option>
                    {availableCourses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              {formData.course === 'Other' && (
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    name="customCourse"
                    required
                    value={formData.customCourse}
                    onChange={handleChange}
                    className="sticker-input"
                    placeholder="Enter your course name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Current Year *
                </label>
                <select
                  name="year"
                  required
                  value={formData.year}
                  onChange={handleChange}
                  className="sticker-input"
                >
                  <option value="">Select your current year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="sticker-input"
                  placeholder="Create a strong password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="sticker-input"
                  placeholder="Confirm your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sticker-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Register'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-ocean-600 font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}