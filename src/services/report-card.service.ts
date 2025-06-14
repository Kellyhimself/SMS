import { NotificationService } from './notification.service'
import type { Database } from '@/types/supabase'
import { getDB } from '@/lib/indexeddb/client'
import { reportCardPDFService } from '@/lib/report-card-pdf'

type ReportCard = Database['public']['Tables']['report_cards']['Row']
type Exam = Database['public']['Tables']['exams']['Row']
type Student = Database['public']['Tables']['students']['Row']

interface ReportCardWithDetails extends ReportCard {
  students: Student
  exams: Exam[]
}

class ReportCardService {
  private notificationService: NotificationService

  constructor() {
    this.notificationService = NotificationService.getInstance()
  }

  async generateReportCards(
    schoolId: string,
    studentIds: string[],
    term: string,
    academicYear: string
  ): Promise<ReportCardWithDetails[]> {
    const db = await getDB()
    const reportCards: ReportCardWithDetails[] = []

    console.log('=== REPORT CARD GENERATION START ===')
    console.log('Input parameters:', {
      schoolId,
      studentIds,
      term,
      academicYear
    })

    // Get students from IndexedDB first
    const students = await Promise.all(
      studentIds.map(id => db.get('students', id))
    )

    console.log('\n=== STUDENT DATA ===')
    console.log('Found students:', students.length)
    console.log('Student details:', students.map(s => s ? {
      id: s.id,
      name: s.name,
      class: s.class,
      admission_number: s.admission_number
    } : null))

    // Filter out any null students and ensure correct type
    const validStudents = students.filter((student): student is NonNullable<typeof student> => 
      student !== null && 
      student !== undefined && 
      (student.sync_status === 'synced' || student.sync_status === 'pending')
    )

    console.log('\n=== VALID STUDENTS ===')
    console.log('Valid students count:', validStudents.length)
    console.log('Valid student details:', validStudents.map(s => ({
      id: s.id,
      name: s.name,
      class: s.class,
      admission_number: s.admission_number,
      sync_status: s.sync_status
    })))

    for (const student of validStudents) {
      if (!student) continue

      console.log(`\n=== PROCESSING STUDENT: ${student.name} ===`)
      
      // Get exams from IndexedDB using by-student index
      const allExams = await db.getAllFromIndex('exams', 'by-student', student.id)
      console.log('All exams found:', allExams.length)
      console.log('Exam details:', allExams.map(e => ({ 
        id: e.id, 
        subject: e.subject, 
        term: e.term, 
        academic_year: e.academic_year,
        score: e.score,
        remarks: e.remarks,
        teacher_remarks: e.teacher_remarks,
        principal_remarks: e.principal_remarks
      })))

      const exams = allExams.filter(exam => 
        (exam.term === term || exam.term === `Term ${term}`) && 
        exam.academic_year === academicYear &&
        exam.score !== undefined && // Only filter out undefined scores
        exam.remarks !== undefined && // Filter out undefined remarks
        exam.teacher_remarks !== undefined && // Filter out undefined teacher remarks
        exam.principal_remarks !== undefined // Filter out undefined principal remarks
      )
      
      console.log('\n=== MATCHING EXAMS ===')
      console.log(`Matching exams count for term ${term} and year ${academicYear}:`, exams.length)
      console.log('Matching exam details:', exams.map(e => ({ 
        id: e.id, 
        subject: e.subject, 
        term: e.term, 
        academic_year: e.academic_year,
        score: e.score,
        remarks: e.remarks,
        teacher_remarks: e.teacher_remarks,
        principal_remarks: e.principal_remarks
      })))
      console.log('Filtered out exams:', allExams.filter(e => 
        (e.term === term || e.term === `Term ${term}`) && 
        e.academic_year === academicYear && 
        (e.score === undefined || e.remarks === undefined || e.teacher_remarks === undefined || e.principal_remarks === undefined)
      ).map(e => ({
        id: e.id,
        subject: e.subject,
        score: e.score,
        remarks: e.remarks,
        teacher_remarks: e.teacher_remarks,
        principal_remarks: e.principal_remarks,
        reason: e.score === undefined ? 'undefined score' : 
                e.remarks === undefined ? 'undefined remarks' :
                e.teacher_remarks === undefined ? 'undefined teacher remarks' :
                'undefined principal remarks'
      })))

      // Check for duplicate exams
      const subjectExams = new Map<string, Exam>()
      exams.forEach(exam => {
        const key = `${exam.subject}-${exam.term}-${exam.academic_year}`
        if (!subjectExams.has(key)) {
          subjectExams.set(key, exam)
        } else {
          console.log('Found duplicate exam:', {
            existing: subjectExams.get(key),
            duplicate: exam
          })
        }
      })

      // Use only unique exams
      const uniqueExams = Array.from(subjectExams.values())
      console.log('\n=== UNIQUE EXAMS ===')
      console.log('Unique exams count:', uniqueExams.length)
      console.log('Unique exam details:', uniqueExams.map(e => ({
        id: e.id,
        subject: e.subject,
        term: e.term,
        academic_year: e.academic_year,
        score: e.score,
        remarks: e.remarks
      })))

      if (!uniqueExams || uniqueExams.length === 0) {
        console.log(`Skipping student ${student.name} - no valid exams found`)
        continue
      }

      const totalMarks = uniqueExams.reduce((sum, exam) => sum + (exam.score || 0), 0)
      const averageMarks = totalMarks / uniqueExams.length
      const grade = this.calculateGrade(averageMarks)
      const classPosition = await this.calculateClassPosition(
        schoolId,
        student.class,
        term,
        academicYear,
        averageMarks
      )

      console.log('\n=== CALCULATED VALUES ===')
      console.log('Total Marks:', totalMarks)
      console.log('Average Marks:', averageMarks)
      console.log('Grade:', grade)
      console.log('Class Position:', classPosition)

      const reportCard: ReportCardWithDetails = {
        id: crypto.randomUUID(),
        school_id: schoolId,
        student_id: student.id,
        term,
        academic_year: academicYear,
        total_marks: totalMarks,
        average_marks: averageMarks,
        grade,
        class_position: classPosition,
        exam_id: uniqueExams[0].id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        parent_signature: false,
        teacher_remarks: uniqueExams[0].teacher_remarks,
        principal_remarks: uniqueExams[0].principal_remarks,
        students: student,
        exams: uniqueExams
      }

      console.log('\n=== GENERATED REPORT CARD ===')
      console.log('Report card details:', {
        student_name: student.name,
        term: reportCard.term,
        academic_year: reportCard.academic_year,
        total_marks: reportCard.total_marks,
        average_marks: reportCard.average_marks,
        grade: reportCard.grade,
        class_position: reportCard.class_position,
        teacher_remarks: reportCard.teacher_remarks,
        principal_remarks: reportCard.principal_remarks,
        exam_count: reportCard.exams.length
      })

      reportCards.push(reportCard)
    }

    console.log('\n=== FINAL REPORT CARDS SUMMARY ===')
    console.log('Total report cards generated:', reportCards.length)
    console.log('Report cards summary:', reportCards.map(rc => ({
      student_name: rc.students.name,
      term: rc.term,
      academic_year: rc.academic_year,
      total_marks: rc.total_marks,
      average_marks: rc.average_marks,
      grade: rc.grade,
      class_position: rc.class_position,
      exam_count: rc.exams.length
    })))
    console.log('=== REPORT CARD GENERATION END ===\n')

    return reportCards
  }

  async generateBulkReportCardsPDF(
    schoolId: string,
    reportCards: ReportCardWithDetails[]
  ): Promise<Blob> {
    if (!reportCards || reportCards.length === 0) {
      throw new Error('No report cards to generate PDFs for')
    }

    console.log('Generating PDFs for', reportCards.length, 'report cards')

    // Get school details from auth_state in IndexedDB
    const db = await getDB()
    const authState = await db.get('auth_state', 'current')
    
    if (!authState) throw new Error('School not found')
    if (!authState.school) throw new Error('School details incomplete')

    // Generate PDFs and zip them
    return reportCardPDFService.generateBulkReportCards(
      reportCards,
      authState.school.name,
      'School Address' // Default address since it's not stored in auth state
    )
  }

  async generateSingleReportCardPDF(
    schoolId: string,
    reportCard: ReportCardWithDetails
  ): Promise<Blob> {
    // Get school details from auth_state in IndexedDB
    const db = await getDB()
    const authState = await db.get('auth_state', 'current')
    
    if (!authState) throw new Error('School not found')
    if (!authState.school) throw new Error('School details incomplete')

    // Generate PDF
    return reportCardPDFService.generateSingleReportCardBlob(
      reportCard,
      authState.school.name,
      'School Address' // Default address since it's not stored in auth state
    )
  }

  async sendReportCards(
    reportCards: ReportCardWithDetails[],
    notificationType: 'sms' | 'email' | 'both'
  ): Promise<void> {
    // Only send notifications if online
    if (!navigator.onLine) {
      console.warn('Cannot send notifications while offline')
      return
    }

    // Set school ID on notification service
    if (reportCards.length > 0) {
      this.notificationService.setSchoolId(reportCards[0].school_id)
    }

    for (const reportCard of reportCards) {
      const student = reportCard.students
      if (!student) continue

      const message = this.generateReportCardMessage(reportCard, student)
      const smsMessage = this.generateSMSMessage(reportCard, student)

      try {
        if (notificationType === 'sms' || notificationType === 'both') {
          if (student.parent_phone) {
            await this.notificationService.sendSMS(student.parent_phone, smsMessage)
          }
        }

        if (notificationType === 'email' || notificationType === 'both') {
          if (student.parent_email) {
            await this.notificationService.sendEmail(student.parent_email, 'Report Card', message)
          }
        }
      } catch (error) {
        console.error('Failed to send notification:', error)
      }
    }
  }

  private async calculateClassPosition(
    schoolId: string,
    className: string,
    term: string,
    academicYear: string,
    studentAverage: number
  ): Promise<number> {
    const db = await getDB()
    
    // Get all students from the school
    const allStudents = await db.getAllFromIndex('students', 'by-school', schoolId)
    
    // Filter students by class
    const classStudents = allStudents.filter(student => student.class === className)
    
    // Get all exams for these students
    const allExams = await Promise.all(
      classStudents.map(student => 
        db.getAllFromIndex('exams', 'by-student', student.id)
      )
    )

    // Calculate averages for each student
    const studentAverages = allExams.map(exams => {
      const termExams = exams.filter(exam => 
        (exam.term === term || exam.term === `Term ${term}`) && 
        exam.academic_year === academicYear &&
        exam.score > 0 // Only include exams with actual scores
      )
      if (!termExams || termExams.length === 0) return 0
      const totalMarks = termExams.reduce((sum, exam) => sum + (exam.score || 0), 0)
      return totalMarks / termExams.length
    }).filter(avg => avg > 0)

    // Sort averages in descending order
    const sortedAverages = [...studentAverages].sort((a, b) => b - a)

    // Find position
    const position = sortedAverages.findIndex(avg => avg === studentAverage) + 1
    return position || 1
  }

  private calculateGrade(averageMarks: number): string {
    if (averageMarks >= 80) return 'A'
    if (averageMarks >= 70) return 'B'
    if (averageMarks >= 60) return 'C'
    if (averageMarks >= 50) return 'D'
    return 'E'
  }

  private generateReportCardMessage(reportCard: ReportCardWithDetails, student: Student): string {
    const message = `
Dear Parent/Guardian,

REPORT CARD FOR ${student.name}
Term: ${reportCard.term}
Academic Year: ${reportCard.academic_year}

Total Marks: ${reportCard.total_marks}
Average Marks: ${reportCard.average_marks.toFixed(2)}
Grade: ${reportCard.grade}
Class Position: ${reportCard.class_position}

Teacher's Remarks: ${reportCard.teacher_remarks || 'N/A'}
Principal's Remarks: ${reportCard.principal_remarks || 'N/A'}

Please sign and return this report card to acknowledge receipt.

Thank you,
School Administration
    `.trim()

    return message
  }

  private generateSMSMessage(reportCard: ReportCardWithDetails, student: Student): string {
    return `Report Card for ${student.name}: Term ${reportCard.term}, Avg: ${reportCard.average_marks.toFixed(2)}, Grade: ${reportCard.grade}, Position: ${reportCard.class_position}. Full report sent to your email.`
  }
}

export const reportCardService = new ReportCardService()

// Client-side function to generate and send report cards
export async function generateAndSendReportCards(
  schoolId: string,
  studentIds: string[],
  term: string,
  academicYear: string,
  notificationType: 'sms' | 'email' | 'both'
) {
  try {
    // Generate report cards
    const reportCards = await reportCardService.generateReportCards(
      schoolId,
      studentIds,
      term,
      academicYear
    )

    // Generate PDFs
    const pdfBlob = await reportCardService.generateBulkReportCardsPDF(schoolId, reportCards)

    // Send notifications if online
    if (navigator.onLine) {
      await reportCardService.sendReportCards(reportCards, notificationType)
    }

    return { 
      success: true,
      pdfBlob // Return the PDF blob for download
    }
  } catch (error) {
    console.error('Failed to generate and send report cards:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 