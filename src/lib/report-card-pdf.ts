import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import JSZip from 'jszip'
import type { Database } from '@/types/supabase'

type ReportCard = Database['public']['Tables']['report_cards']['Row']
type Student = Database['public']['Tables']['students']['Row']
type Exam = Database['public']['Tables']['exams']['Row']

interface ReportCardWithDetails extends ReportCard {
  students: Student
  exams: Exam[]
}

export class ReportCardPDFService {
  private generateSingleReportCard(
    reportCard: ReportCardWithDetails,
    schoolName: string,
    schoolAddress: string
  ): jsPDF {
    console.log('\n=== GENERATING PDF FOR STUDENT ===')
    console.log('Student:', reportCard.students.name)
    console.log('School:', schoolName)
    console.log('Term:', reportCard.term)
    console.log('Academic Year:', reportCard.academic_year)
    console.log('Exams:', reportCard.exams.map(e => ({
      subject: e.subject,
      score: e.score,
      remarks: e.remarks,
      teacher_remarks: e.teacher_remarks,
      principal_remarks: e.principal_remarks
    })))
    console.log('Summary:', {
      total_marks: reportCard.total_marks,
      average_marks: reportCard.average_marks,
      grade: reportCard.grade,
      class_position: reportCard.class_position,
      teacher_remarks: reportCard.teacher_remarks,
      principal_remarks: reportCard.principal_remarks
    })

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // School Header
    doc.setFontSize(20)
    doc.text(schoolName, pageWidth / 2, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(schoolAddress, pageWidth / 2, 30, { align: 'center' })
    
    // Title
    doc.setFontSize(16)
    doc.text('STUDENT REPORT CARD', pageWidth / 2, 45, { align: 'center' })
    
    // Student Details
    doc.setFontSize(12)
    const student = reportCard.students
    doc.text(`Name: ${student.name}`, 20, 60)
    doc.text(`Class: ${student.class}`, 20, 70)
    doc.text(`Term: ${reportCard.term}`, 20, 80)
    doc.text(`Academic Year: ${reportCard.academic_year}`, 20, 90)
    
    // Exam Results Table
    autoTable(doc, {
      startY: 100,
      head: [['Subject', 'Score', 'Out of', 'Position', 'Remarks']],
      body: reportCard.exams.map(exam => [
        exam.subject,
        exam.score?.toString() || 'N/A',
        exam.total_marks?.toString() || 'N/A',
        exam.position?.toString() || 'N/A',
        exam.remarks || 'N/A'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    })
    
    // Summary
    const summaryY = (doc as any).lastAutoTable.finalY + 20
    doc.text('SUMMARY', 20, summaryY)
    doc.text(`Total Marks: ${reportCard.total_marks}`, 20, summaryY + 10)
    doc.text(`Average Marks: ${reportCard.average_marks.toFixed(2)}`, 20, summaryY + 20)
    doc.text(`Grade: ${reportCard.grade}`, 20, summaryY + 30)
    doc.text(`Class Position: ${reportCard.class_position} out of ${reportCard.exams.length}`, 20, summaryY + 40)
    
    // Remarks
    if (reportCard.teacher_remarks || reportCard.principal_remarks) {
      const remarksY = summaryY + 60
      doc.text('REMARKS', 20, remarksY)
      if (reportCard.teacher_remarks) {
        doc.text(`Teacher's Remarks: ${reportCard.teacher_remarks}`, 20, remarksY + 10)
      }
      if (reportCard.principal_remarks) {
        doc.text(`Principal's Remarks: ${reportCard.principal_remarks}`, 20, remarksY + 20)
      }
    }
    
    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20
    doc.text('Parent/Guardian Signature: _________________', 20, footerY)
    doc.text('Date: _________________', pageWidth - 60, footerY)
    
    console.log('PDF generation completed for student:', student.name)
    return doc
  }
  
  async generateBulkReportCards(
    reportCards: ReportCardWithDetails[],
    schoolName: string,
    schoolAddress: string
  ): Promise<Blob> {
    console.log('\n=== STARTING BULK PDF GENERATION ===')
    console.log('Total report cards to process:', reportCards.length)
    console.log('School:', schoolName)
    
    const zip = new JSZip()
    
    // Generate individual PDFs
    for (const reportCard of reportCards) {
      console.log(`\nProcessing PDF for student: ${reportCard.students.name}`)
      const doc = this.generateSingleReportCard(reportCard, schoolName, schoolAddress)
      const pdfBlob = doc.output('blob')
      const fileName = `report-card-${reportCard.students.name}-${reportCard.term}-${reportCard.academic_year}.pdf`
      zip.file(fileName, pdfBlob)
      console.log(`Added PDF to zip: ${fileName}`)
    }
    
    // Generate and return zip file
    console.log('\nGenerating final zip file...')
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    console.log('Zip file generation completed')
    return zipBlob
  }
  
  async generateSingleReportCardBlob(
    reportCard: ReportCardWithDetails,
    schoolName: string,
    schoolAddress: string
  ): Promise<Blob> {
    const doc = this.generateSingleReportCard(reportCard, schoolName, schoolAddress)
    return doc.output('blob')
  }
}

export const reportCardPDFService = new ReportCardPDFService() 