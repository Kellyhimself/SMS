import { jsPDF } from 'jspdf';
import { Fee } from '@/types/fee';
import { getDB } from './indexeddb/client';
import { supabase } from './supabase/client';

interface ReceiptData {
  fee: Fee;
  transactionId: string;
  amount: number;
  schoolName: string;
  schoolAddress?: string;
}

export async function generateReceiptPDF(data: ReceiptData): Promise<Blob> {
  const doc = new jsPDF();
  
  // Add school logo if available
  // TODO: Add school logo support
  
  // School header
  doc.setFontSize(16);
  doc.text(data.schoolName, 105, 15, { align: 'center' });
  
  if (data.schoolAddress) {
    doc.setFontSize(10);
    doc.text(data.schoolAddress, 105, 22, { align: 'center' });
  }
  
  // Receipt title
  doc.setFontSize(14);
  doc.text('Payment Receipt', 105, 30, { align: 'center' });
  
  // Receipt number and date
  doc.setFontSize(9);
  doc.text(`Receipt No: ${data.transactionId}`, 20, 38);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 43);
  
  // Student details
  doc.setFontSize(10);
  doc.text('Student Details:', 20, 50);
  doc.setFontSize(9);
  doc.text(`Name: ${data.fee.student_name}`, 20, 57);
  doc.text(`Admission Number: ${data.fee.student_admission_number}`, 20, 62);
  
  // Payment details
  doc.setFontSize(10);
  doc.text('Payment Details:', 20, 70);
  doc.setFontSize(9);
  doc.text(`Fee Type: ${data.fee.fee_type || 'School Fees'}`, 20, 77);
  doc.text(`Description: ${data.fee.description || 'N/A'}`, 20, 82);
  doc.text(`Payment Method: ${data.fee.payment_method}`, 20, 87);
  
  // Amount
  doc.setFontSize(12);
  doc.text(`Amount Paid: KES ${data.amount.toLocaleString()}`, 105, 100, { align: 'center' });
  
  // Footer
  doc.setFontSize(8);
  doc.text('This is a computer-generated receipt and does not require a signature.', 105, 120, { align: 'center' });
  
  return doc.output('blob');
}

export async function generateReceipt(
  feeId: string, 
  transactionId: string, 
  amount: number,
  schoolContext: { name: string; address?: string }
): Promise<{ receiptBlob: Blob; receiptData: ReceiptData }> {
  let fee: Fee;
  
  if (!navigator.onLine) {
    // Get data from IndexedDB
    const db = await getDB();
    const feeData = await db.get('fees', feeId);
    if (!feeData) throw new Error('Fee not found');
    fee = feeData as Fee;
  } else {
    // Get data from Supabase
    const { data: feeData, error: feeError } = await supabase
      .from('fees')
      .select('*')
      .eq('id', feeId)
      .single();
      
    if (feeError) throw feeError;
    if (!feeData) throw new Error('Fee not found');
    
    fee = feeData as Fee;
  }
  
  const receiptData = {
    fee,
    transactionId,
    amount,
    schoolName: schoolContext.name,
    schoolAddress: schoolContext.address
  };
  
  const pdfBlob = await generateReceiptPDF(receiptData);
  
  return {
    receiptBlob: pdfBlob,
    receiptData
  };
}
