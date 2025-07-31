import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Phone, 
  Shield, 
  Bell, 
  Users, 
  Receipt, 
  BookOpen, 
  Download, 
  ArrowRight,
  CheckCircle,
  Smartphone,
  Globe,
  Lock
} from 'lucide-react'

export default function ParentPortalPage() {
  const features = [
    {
      icon: <Phone className="h-6 w-6" />,
      title: "SMS Authentication",
      description: "Secure login using your registered phone number with OTP verification",
      color: "text-blue-600 bg-blue-50"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure Access",
      description: "Your child's information is protected with industry-standard security",
      color: "text-green-600 bg-green-50"
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Real-time Updates",
      description: "Receive instant notifications about attendance, fees, and school events",
      color: "text-purple-600 bg-purple-50"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Attendance Tracking",
      description: "Monitor your child's daily attendance and view attendance reports",
      color: "text-orange-600 bg-orange-50"
    },
    {
      icon: <Receipt className="h-6 w-6" />,
      title: "Fee Management",
      description: "View fee statements, payment history, and outstanding balances",
      color: "text-red-600 bg-red-50"
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Academic Progress",
      description: "Access exam results, report cards, and academic performance",
      color: "text-indigo-600 bg-indigo-50"
    }
  ]

  const benefits = [
    "Stay informed about your child's education",
    "Access information 24/7 from anywhere",
    "Reduce paper-based communication",
    "Track fee payments and balances",
    "Download official documents",
    "Receive important school notifications"
  ]

  const accessMethods = [
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: "Mobile Access",
      description: "Access from your smartphone or tablet"
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: "Web Browser",
      description: "Use any modern web browser on desktop or laptop"
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: "Secure Login",
      description: "SMS-based authentication for maximum security"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Parent Portal</h1>
              <p className="text-gray-600 mt-2">Stay connected with your child's education</p>
            </div>
            <div className="flex gap-3">
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
              <Link href="/parent-login">
                <Button className="bg-[#1E88E5] hover:bg-[#1976D2]">
                  <Phone className="mr-2 h-4 w-4" />
                  Access Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to the Parent Portal
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access your child's academic information, attendance records, fee statements, and more 
            through our secure and user-friendly parent portal.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Portal Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`inline-flex p-3 rounded-full ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Why Use the Parent Portal?
              </h3>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-4">
                Getting Started
              </h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                    1
                  </div>
                  <span className="text-gray-700">Click "Access Portal" button</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                    2
                  </div>
                  <span className="text-gray-700">Enter your registered phone number</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                    3
                  </div>
                  <span className="text-gray-700">Enter the OTP sent to your phone</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                    4
                  </div>
                  <span className="text-gray-700">Access your child's information</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Access Methods */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            How to Access
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {accessMethods.map((method, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="inline-flex p-3 rounded-full bg-blue-50 text-blue-600 mb-4">
                    {method.icon}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {method.title}
                  </h4>
                  <p className="text-gray-600">{method.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Security Information */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Data Protection</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• All data is encrypted in transit and at rest</li>
                    <li>• Your phone number is used only for authentication</li>
                    <li>• No personal data is shared with third parties</li>
                    <li>• Session timeouts for security</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Access Control</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• SMS-based two-factor authentication</li>
                    <li>• OTP expires after 10 minutes</li>
                    <li>• Automatic logout after 24 hours</li>
                    <li>• Secure HTTPS connections only</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-[#1E88E5] to-[#1976D2] text-white border-0">
            <CardContent className="pt-8 pb-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Access Your Child's Information?
              </h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Join hundreds of parents who are already using our portal to stay connected 
                with their children's education journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/parent-login">
                  <Button size="lg" className="bg-white text-[#1E88E5] hover:bg-gray-50">
                    <Phone className="mr-2 h-5 w-5" />
                    Access Parent Portal
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-[#1E88E5]">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 