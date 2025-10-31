import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Generate PDF for bulk student credentials
export const generateBulkStudentsPDF = (credentials, organizationName) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFillColor(74, 144, 226);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Add logo/title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CareerNest', 105, 15, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Student Credentials Report', 105, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Organization: ${organizationName}`, 105, 33, { align: 'center' });
  
  // Add date
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  const date = new Date().toLocaleString();
  doc.text(`Generated: ${date}`, 105, 45, { align: 'center' });
  
  // Add important notice
  doc.setTextColor(220, 53, 69);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('⚠️ CONFIDENTIAL - Keep this document secure', 105, 55, { align: 'center' });
  
  // Prepare table data
  const tableData = credentials.map((cred, index) => [
    index + 1,
    cred.name,
    cred.email,
    cred.rollNumber,
    cred.password,
    cred.course || 'N/A',
    cred.year || 'N/A'
  ]);
  
  // Add table
  doc.autoTable({
    startY: 65,
    head: [['#', 'Name', 'Email', 'Roll No.', 'Password', 'Course', 'Year']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [74, 144, 226],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [44, 62, 80]
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 45 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30, fontStyle: 'bold', textColor: [220, 53, 69] },
      5: { cellWidth: 30 },
      6: { cellWidth: 20, halign: 'center' }
    },
    margin: { top: 65, left: 10, right: 10 },
    didDrawPage: (data) => {
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
  });
  
  // Add footer instructions
  const finalY = doc.lastAutoTable.finalY || 65;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  
  const instructions = [
    '',
    '📋 Instructions:',
    '1. Share these credentials with respective students securely',
    '2. Students should login at: Your Career Nest URL',
    '3. Students can change their password after first login',
    '4. Keep this document confidential and secure',
    '',
    '🔐 Password Format: {RollNumber}@CN',
    '   Example: If Roll Number is CS001, Password is CS001@CN'
  ];
  
  let yPos = finalY + 15;
  instructions.forEach((line, index) => {
    if (index === 1) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(74, 144, 226);
    } else if (index === 7) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(74, 144, 226);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
    }
    doc.text(line, 15, yPos);
    yPos += 5;
  });
  
  // Save the PDF
  const fileName = `Students_Credentials_${new Date().getTime()}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

// Generate PDF for individual student
export const generateIndividualStudentPDF = (studentData, organizationName) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFillColor(74, 144, 226);
  doc.rect(0, 0, 210, 50, 'F');
  
  // Add logo/title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('CareerNest', 105, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Student Login Credentials', 105, 35, { align: 'center' });
  
  // Add decorative border
  doc.setDrawColor(74, 144, 226);
  doc.setLineWidth(1);
  doc.rect(15, 60, 180, 120);
  
  // Student details card
  doc.setFillColor(248, 249, 250);
  doc.rect(20, 65, 170, 110, 'F');
  
  // Add content
  doc.setTextColor(44, 62, 80);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Information', 105, 80, { align: 'center' });
  
  // Details
  let yPos = 95;
  const details = [
    { label: '👤 Name:', value: studentData.name },
    { label: '📧 Email:', value: studentData.email },
    { label: '🎓 Roll Number:', value: studentData.rollNumber },
    { label: '📚 Course:', value: studentData.course || 'N/A' },
    { label: '📅 Year:', value: studentData.year || 'N/A' },
    { label: '🏢 Organization:', value: organizationName }
  ];
  
  doc.setFontSize(11);
  details.forEach(detail => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(74, 144, 226);
    doc.text(detail.label, 30, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(44, 62, 80);
    doc.text(detail.value, 80, yPos);
    
    yPos += 12;
  });
  
  // Login credentials section
  yPos += 10;
  doc.setFillColor(255, 243, 205);
  doc.rect(20, yPos - 10, 170, 40, 'F');
  doc.setDrawColor(255, 193, 7);
  doc.setLineWidth(2);
  doc.rect(20, yPos - 10, 170, 40);
  
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 53, 69);
  doc.text('🔐 Login Credentials', 105, yPos, { align: 'center' });
  
  yPos += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('Email:', 30, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.email, 80, yPos);
  
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Password:', 30, yPos);
  doc.setTextColor(220, 53, 69);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(studentData.password, 80, yPos);
  
  // Instructions
  yPos += 25;
  doc.setFillColor(232, 245, 255);
  doc.rect(20, yPos, 170, 60, 'F');
  
  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(74, 144, 226);
  doc.text('📝 How to Login:', 30, yPos);
  
  const instructions = [
    '1. Visit the Career Nest website',
    '2. Click on "Get Started" or "Login"',
    '3. Select "Student" role',
    '4. Enter your email and password above',
    '5. You can change your password after first login'
  ];
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  instructions.forEach(instruction => {
    doc.text(instruction, 30, yPos);
    yPos += 7;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    105,
    280,
    { align: 'center' }
  );
  doc.text(
    '⚠️ Keep this document secure and confidential',
    105,
    285,
    { align: 'center' }
  );
  
  // Save the PDF
  const fileName = `${studentData.name.replace(/\s+/g, '_')}_Credentials.pdf`;
  doc.save(fileName);
  
  return fileName;
};

// Generate PDF for student profile (view all details with password)
export const generateStudentProfilePDF = (student, organizationName) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFillColor(74, 144, 226);
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CareerNest', 105, 18, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Student Profile & Credentials', 105, 30, { align: 'center' });
  
  // Profile card
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(15, 55, 180, 160, 3, 3, 'F');
  doc.setDrawColor(74, 144, 226);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 55, 180, 160, 3, 3);
  
  // Profile header
  doc.setFillColor(74, 144, 226);
  doc.roundedRect(15, 55, 180, 15, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Personal Information', 105, 64, { align: 'center' });
  
  // Details
  let yPos = 80;
  const profileData = [
    { label: '👤 Full Name:', value: student.name || 'N/A' },
    { label: '📧 Email Address:', value: student.email || 'N/A' },
    { label: '🆔 Username:', value: student.username || student.email?.split('@')[0] || 'N/A' },
    { label: '🎓 Roll Number:', value: student.rollNumber || student.roll_number || 'N/A' },
    { label: '📚 Course:', value: student.course || 'Not specified' },
    { label: '📅 Academic Year:', value: student.year || 'Not specified' },
    { label: '🏢 Organization:', value: organizationName || 'N/A' },
    { label: '📅 Joined Date:', value: student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A' }
  ];
  
  doc.setFontSize(11);
  profileData.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
      doc.rect(20, yPos - 5, 170, 10, 'F');
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(74, 144, 226);
    doc.text(item.label, 25, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(44, 62, 80);
    doc.text(item.value, 85, yPos);
    
    yPos += 12;
  });
  
  // Login credentials section (highlighted)
  yPos += 10;
  doc.setFillColor(255, 243, 205);
  doc.roundedRect(15, yPos - 8, 180, 50, 3, 3, 'F');
  doc.setDrawColor(255, 193, 7);
  doc.setLineWidth(2);
  doc.roundedRect(15, yPos - 8, 180, 50, 3, 3);
  
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 53, 69);
  doc.text('🔐 Login Credentials', 105, yPos + 3, { align: 'center' });
  
  yPos += 15;
  doc.setFontSize(11);
  doc.setTextColor(44, 62, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('Login Email:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(student.email || 'N/A', 85, yPos);
  
  yPos += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Current Password:', 25, yPos);
  
  // Show password in special formatting
  const password = student.password || (student.rollNumber || student.roll_number) + '@CN';
  doc.setTextColor(220, 53, 69);
  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.text(password, 85, yPos);
  
  // Important notice
  yPos += 25;
  doc.setFillColor(232, 245, 255);
  doc.roundedRect(15, yPos, 180, 25, 3, 3, 'F');
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(74, 144, 226);
  doc.text('⚠️ IMPORTANT:', 25, yPos);
  
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('• This document contains sensitive information. Keep it secure and confidential.', 25, yPos);
  yPos += 5;
  doc.text('• Student can change their password after logging in to the system.', 25, yPos);
  yPos += 5;
  doc.text('• Do not share credentials with unauthorized persons.', 25, yPos);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Document generated: ${new Date().toLocaleString()}`,
    105,
    280,
    { align: 'center' }
  );
  doc.setTextColor(220, 53, 69);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'CONFIDENTIAL DOCUMENT',
    105,
    285,
    { align: 'center' }
  );
  
  // Save the PDF
  const fileName = `${student.name?.replace(/\s+/g, '_') || 'Student'}_Profile_${new Date().getTime()}.pdf`;
  doc.save(fileName);
  
  return fileName;
};
