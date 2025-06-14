'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentService } from '@/services/student.service';
import { reportCardService } from '@/services/report-card.service';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';

export default function ReportCardsPage() {
  const { school } = useAuth();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sendSMS, setSendSMS] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', school?.id],
    queryFn: () => studentService.getStudents(school?.id || ''),
    enabled: !!school?.id
  });

  // Get unique classes from students
  const classes = Array.from(new Set(students.map(student => student.class))).sort();

  // Filter students based on search query and selected class
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.admission_number && student.admission_number.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesClass = selectedClass === 'all' || student.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Handle select all for filtered students
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = [...new Set([...selectedStudents, ...filteredStudents.map(s => s.id)])];
      setSelectedStudents(newSelected);
    } else {
      const filteredIds = new Set(filteredStudents.map(s => s.id));
      setSelectedStudents(selectedStudents.filter(id => !filteredIds.has(id)));
    }
  };

  // Check if all filtered students are selected
  const areAllFilteredSelected = filteredStudents.length > 0 &&
    filteredStudents.every(student => selectedStudents.includes(student.id));

  const handleGenerateAndSend = async () => {
    if (!selectedStudents.length) {
      toast.error('Please select at least one student');
      return;
    }

    if (!selectedTerm || !selectedYear) {
      toast.error('Please select term and academic year');
      return;
    }

    if (!school?.id) {
      toast.error('School information not found');
      return;
    }

    setIsGenerating(true);
    try {
      // First generate the report cards
      const reportCards = await reportCardService.generateReportCards(
        school.id,
        selectedStudents,
        selectedTerm,
        selectedYear
      );

      // Then generate the PDF
      const pdfBlob = await reportCardService.generateBulkReportCardsPDF(
        school.id,
        reportCards
      );

      // Create a download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-cards-${selectedTerm}-${selectedYear}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Send notifications if requested
      if (sendSMS || sendEmail) {
        const notificationType = sendSMS && sendEmail ? 'both' : sendSMS ? 'sms' : 'email';
        await reportCardService.sendReportCards(reportCards, notificationType);
      }

      toast.success('Report cards generated successfully');
    } catch (error) {
      console.error('Failed to generate and send report cards:', error);
      toast.error('Failed to generate report cards');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!school?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Please select a school first</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Report Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="term">Term</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Term 1</SelectItem>
                    <SelectItem value="2">Term 2</SelectItem>
                    <SelectItem value="3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="year">Academic Year</Label>
                <Input
                  id="year"
                  type="number"
                  min="2000"
                  max={new Date().getFullYear() + 1}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  placeholder="Enter academic year"
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class">Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="search">Search Students</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or admission number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="select-all"
                  checked={areAllFilteredSelected}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="cursor-pointer">
                  Select All ({filteredStudents.length})
                </Label>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No students found
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={student.id}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudents([...selectedStudents, student.id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter((id) => id !== student.id));
                          }
                        }}
                      />
                      <Label htmlFor={student.id} className="cursor-pointer">
                        {student.name} ({student.admission_number || 'No Admission Number'})
                        <span className="text-xs text-muted-foreground ml-2">
                          {student.class}
                        </span>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms"
                  checked={sendSMS}
                  onCheckedChange={(checked) => setSendSMS(checked as boolean)}
                />
                <Label htmlFor="sms">Send SMS notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                />
                <Label htmlFor="email">Send email notifications</Label>
              </div>
            </div>

            <Button
              onClick={handleGenerateAndSend}
              disabled={isGenerating || !selectedStudents.length || !selectedTerm || !selectedYear}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                `Generate Report Cards (${selectedStudents.length})`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 