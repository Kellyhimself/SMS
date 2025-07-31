import Link from 'next/link'
import { ArrowRight, School, Users, Receipt, BookOpen, Bell, Building2, Pill, Leaf, Phone, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="px-4 py-12 sm-mobile:px-6 md-mobile:px-8 desktop:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm-mobile:text-4xl md-mobile:text-5xl desktop:text-6xl">
              Streamline Your School Management
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 sm-mobile:text-xl md-mobile:text-2xl">
              A comprehensive solution for managing fees, students, and communications
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/login">
                <Button size="lg" className="bg-[#1E88E5] hover:bg-[#1976D2]">
                  School Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/parent-login">
                <Button variant="outline" size="lg" className="border-[#1E88E5] text-[#1E88E5] hover:bg-[#1E88E5] hover:text-white">
                  <Phone className="mr-2 h-4 w-4" />
                  Parent Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Parent Portal Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-12 sm-mobile:py-16 md-mobile:py-20">
        <div className="mx-auto max-w-7xl px-4 sm-mobile:px-6 md-mobile:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 sm-mobile:text-3xl md-mobile:text-4xl">
              Parent Portal Access
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Stay connected with your child's education
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 rounded-full bg-blue-100 p-2">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">SMS Authentication</h3>
                  <p className="text-gray-600">Secure login with your registered phone number</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 rounded-full bg-green-100 p-2">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Secure Access</h3>
                  <p className="text-gray-600">View your child's progress, fees, and attendance</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 rounded-full bg-purple-100 p-2">
                  <Bell className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Real-time Updates</h3>
                  <p className="text-gray-600">Receive notifications about important school events</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Access</h3>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Access your child's information anytime, anywhere with our secure parent portal.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">View attendance records</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Check fee status and payments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Download report cards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Receive school communications</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Link href="/parent-login">
                    <Button className="w-full bg-[#1E88E5] hover:bg-[#1976D2]">
                      <Phone className="mr-2 h-4 w-4" />
                      Access Parent Portal
                    </Button>
                  </Link>
                  <Link href="/parent-portal">
                    <Button variant="outline" className="w-full">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm-mobile:py-16 md-mobile:py-20">
        <div className="mx-auto max-w-7xl px-4 sm-mobile:px-6 md-mobile:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm-mobile:text-3xl md-mobile:text-4xl">
              Key Features
            </h2>
          </div>
          <div className="mt-12 space-y-4">
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Student Management"
              description="Efficiently manage student records, admissions, and academic progress"
            />
            <FeatureCard
              icon={<Receipt className="h-6 w-6" />}
              title="Fee Management"
              description="Streamline fee collection, generate receipts, and track payments"
            />
            <FeatureCard
              icon={<Bell className="h-6 w-6" />}
              title="Communication"
              description="Send notifications to parents via SMS and email"
            />
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Exam Management"
              description="Track exam results and generate report cards"
            />
          </div>
        </div>
      </section>

      {/* Other Projects Section */}
      <section className="bg-gray-50 py-12 sm-mobile:py-16 md-mobile:py-20">
        <div className="mx-auto max-w-7xl px-4 sm-mobile:px-6 md-mobile:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm-mobile:text-3xl md-mobile:text-4xl">
              Our Other Solutions
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Discover our range of business management solutions
            </p>
          </div>
          <div className="mt-12 space-y-4">
            <ProjectCard
              icon={<Pill className="h-6 w-6" />}
              title="Clinic Management"
              description="Complete pharmacy inventory and clinic management system"
              link="https://clinic.veylor360.com"
            />
            <ProjectCard
              icon={<Leaf className="h-6 w-6" />}
              title="Agrovet Management"
              description="Streamline your agrovet sales and inventory"
              link="https://agrovet.veylor360.com"
            />
            <ProjectCard
              icon={<Building2 className="h-6 w-6" />}
              title="Veylor360"
              description="Visit our main website for more solutions"
              link="https://veylor360.com"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm-mobile:px-6 md-mobile:px-8">
          <div className="text-center">
            <p className="text-sm">
              © {new Date().getFullYear()} Veylor360. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-lg transition-all hover:shadow-xl sm-mobile:p-5 md-mobile:p-6">
      <div className="flex-shrink-0 rounded-full bg-blue-50 p-3 text-[#1E88E5]">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 sm-mobile:text-xl md-mobile:text-2xl">{title}</h3>
        <p className="mt-1 text-sm text-gray-600 sm-mobile:text-base md-mobile:text-lg">{description}</p>
      </div>
    </div>
  )
}

function ProjectCard({ icon, title, description, link }: { icon: React.ReactNode; title: string; description: string; link: string }) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-lg bg-white p-4 shadow-lg transition-all hover:shadow-xl sm-mobile:p-5 md-mobile:p-6"
    >
      <div className="flex-shrink-0 rounded-full bg-green-50 p-3 text-[#2ECC71] group-hover:text-[#27AE60]">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 sm-mobile:text-xl md-mobile:text-2xl">{title}</h3>
        <p className="mt-1 text-sm text-gray-600 sm-mobile:text-base md-mobile:text-lg">{description}</p>
      </div>
    </a>
  )
}
