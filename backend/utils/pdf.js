const PDFDocument = require('pdfkit');

// Create a PDF buffer for bulk student credentials
// credentials: Array<{ name, email, rollNumber|roll_number, password, course, year }>
// orgName: string
function createBulkCredentialsPDFBuffer(credentials = [], orgName = 'Organization') {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.rect(0, 0, doc.page.width, 60).fill('#4A90E2');
      doc.fill('#FFFFFF').font('Helvetica-Bold').fontSize(22).text('CareerNest', { align: 'center', baseline: 'middle' });
      doc.moveDown(0.2);
      doc.font('Helvetica').fontSize(12).text('Student Credentials Report', { align: 'center' });
      doc.fontSize(10).text(`Organization: ${orgName}`, { align: 'center' });

      doc.moveDown(1.2);
      doc.fill('#000000').font('Helvetica').fontSize(9).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fill('#D9534F').font('Helvetica-Bold').text('CONFIDENTIAL - Keep this document secure', { align: 'center' });

      // Table headers
      const startY = 120;
      let y = startY;
      const colX = [40, 65, 210, 360, 430, 500, 560];
      const colTitles = ['#', 'Name', 'Email', 'Roll No.', 'Password', 'Course', 'Year'];
      const widths = [20, 135, 150, 60, 60, 60, 40];

      // Header row
      doc.fillColor('#4A90E2').font('Helvetica-Bold').fontSize(10);
      colTitles.forEach((t, i) => doc.text(t, colX[i], y));
      y += 14;
      doc.moveTo(40, y).lineTo(doc.page.width - 40, y).strokeColor('#4A90E2').lineWidth(1).stroke();
      y += 6;

      // Rows
      doc.font('Helvetica').fillColor('#2C3E50').fontSize(9);
      const maxY = doc.page.height - 60;
      credentials.forEach((cred, idx) => {
        const roll = cred.rollNumber || cred.roll_number || '';
        const row = [String(idx + 1), cred.name || '', cred.email || '', roll, cred.password || '', cred.course || '', cred.year || ''];

        // Page break if needed
        if (y > maxY) {
          doc.addPage();
          y = 60;
          doc.font('Helvetica-Bold').fillColor('#4A90E2');
          colTitles.forEach((t, i) => doc.text(t, colX[i], y));
          y += 14;
          doc.moveTo(40, y).lineTo(doc.page.width - 40, y).strokeColor('#4A90E2').lineWidth(1).stroke();
          y += 6;
          doc.font('Helvetica').fillColor('#2C3E50');
        }

        row.forEach((cell, i) => {
          const text = typeof cell === 'string' ? cell : String(cell ?? '');
          doc.text(text, colX[i], y, { width: widths[i], ellipsis: true });
        });
        y += 14;
      });

      // Footer instructions
      y += 10;
      if (y > maxY - 60) {
        doc.addPage();
        y = 60;
      }
      doc.moveDown(1);
      doc.fontSize(9).fillColor('#666666').font('Helvetica');
      doc.text('Instructions:', 40, y);
      y += 12;
      const instructions = [
        '1. Share these credentials with respective students securely.',
        '2. Students should login to Career Nest with the given email and password.',
        '3. Students should change their password after first login.',
        '4. Keep this document confidential and secure.',
        'Password format: {RollNumber}@CN (e.g., CS001@CN)'
      ];
      instructions.forEach(line => {
        doc.text(line, 40, y);
        y += 12;
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { createBulkCredentialsPDFBuffer };
