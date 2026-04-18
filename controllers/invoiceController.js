import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Payment from '../models/Payment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure invoices folder exists
const invoicesDir = path.join(__dirname, '../invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

export const generateInvoice = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Fetch payment details
    const payment = await Payment.findById(paymentId).populate('movieId');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const invoiceNumber = `INV-${payment.orderId.slice(-8).toUpperCase()}`;
    const fileName = `Invoice_${invoiceNumber}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

    // Pipe to file
    doc.pipe(fs.createWriteStream(filePath));

    // === HEADER ===
    doc.fontSize(24).fillColor('#3B82F6').text('MovieHub', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#6B7280').text('Premium Movie Streaming Service', { align: 'center' });
    doc.moveDown(1);

    // Invoice Title
    doc.fontSize(20).fillColor('#1F2937').text('PAYMENT INVOICE', { align: 'center' });
    doc.moveDown(1);

    // Invoice Details (Two Columns)
    doc.fontSize(10).fillColor('#374151');
    
    // Left Column
    doc.text(`Invoice Number: ${invoiceNumber}`, 50, doc.y);
    doc.text(`Order ID: ${payment.orderId}`, 50, doc.y + 15);
    doc.text(`Payment ID: ${payment.paymentId || 'N/A'}`, 50, doc.y + 30);
    
    // Right Column
    const rightX = 350;
    doc.text(`Date: ${new Date(payment.createdAt).toLocaleDateString('en-IN')}`, rightX, doc.y);
    doc.text(`Time: ${new Date(payment.createdAt).toLocaleTimeString('en-IN')}`, rightX, doc.y + 15);
    doc.text(`Status: ${payment.status.toUpperCase()}`, rightX, doc.y + 30, { color: '#10B981' });
    
    doc.moveDown(3);

    // === BILL TO ===
    doc.fontSize(12).fillColor('#1F2937').text('Bill To:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#374151');
    doc.text('Customer Name: Guest User');
    doc.text('Email: guest@example.com');
    doc.text('Contact: +91 9999999999');
    doc.moveDown(1);

    // === ITEM DETAILS ===
    doc.fontSize(12).fillColor('#1F2937').text('Item Details:', { underline: true });
    doc.moveDown(0.5);

    // Table Header
    const tableTop = doc.y;
    doc.fontSize(10).fillColor('#1F2937');
    doc.text('Description', 50, tableTop);
    doc.text('Quantity', 250, tableTop, { width: 100, align: 'center' });
    doc.text('Price', 350, tableTop, { width: 100, align: 'right' });
    doc.text('Amount', 450, tableTop, { width: 100, align: 'right' });

    // Table Line
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#E5E7EB');

    // Table Row
    doc.fontSize(10).fillColor('#374151');
    doc.text(payment.movieTitle || 'Movie Purchase', 50, tableTop + 25);
    doc.text('1', 250, tableTop + 25, { width: 100, align: 'center' });
    doc.text(`₹${payment.amount - Math.round(payment.amount * 0.18)}`, 350, tableTop + 25, { width: 100, align: 'right' });
    doc.text(`₹${payment.amount}`, 450, tableTop + 25, { width: 100, align: 'right' });

    doc.moveDown(3);

    // === PAYMENT SUMMARY ===
    doc.fontSize(12).fillColor('#1F2937').text('Payment Summary:', { underline: true });
    doc.moveDown(0.5);

    const summaryX = 350;
    doc.fontSize(10).fillColor('#374151');
    doc.text('Subtotal:', summaryX, doc.y, { width: 100, align: 'right' });
    doc.text(`₹${payment.amount - Math.round(payment.amount * 0.18)}`, 450, doc.y, { width: 100, align: 'right' });
    
    doc.text('GST (18%):', summaryX, doc.y + 15, { width: 100, align: 'right' });
    doc.text(`₹${Math.round(payment.amount * 0.18)}`, 450, doc.y + 15, { width: 100, align: 'right' });
    
    doc.moveTo(350, doc.y + 25).lineTo(550, doc.y + 25).stroke('#E5E7EB');
    
    doc.fontSize(12).fillColor('#1F2937').font('Helvetica-Bold');
    doc.text('Total:', summaryX, doc.y + 35, { width: 100, align: 'right' });
    doc.text(`₹${payment.amount}`, 450, doc.y + 35, { width: 100, align: 'right' });

    doc.moveDown(2);

    // === PAYMENT METHOD ===
    doc.fontSize(10).fillColor('#374151').font('Helvetica');
    doc.text('Payment Method: Razorpay (Card/UPI)', 50, doc.y);
    doc.text('Transaction ID: ' + (payment.paymentId || 'N/A'), 50, doc.y + 15);
    doc.moveDown(1);

    // === FOOTER ===
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#E5E7EB');
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#9CA3AF').text('Thank you for your purchase!', { align: 'center' });
    doc.text('For any queries, contact: support@moviehub.com', { align: 'center' });
    doc.text('MovieHub - Your Entertainment Destination', { align: 'center' });
    doc.text('This is a computer-generated invoice. No signature required.', { align: 'center' });

    // Finalize PDF
    doc.end();

    // Wait for file to be written
    await new Promise((resolve) => {
      doc.on('end', resolve);
    });

    // Send file to client
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Optional: Delete file after download
      // fs.unlinkSync(filePath);
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceList = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'completed' })
      .select('orderId paymentId amount movieTitle createdAt')
      .sort({ createdAt: -1 });

    const invoices = payments.map(payment => ({
      invoiceNumber: `INV-${payment.orderId.slice(-8).toUpperCase()}`,
      paymentId: payment._id,
      orderId: payment.orderId,
      amount: payment.amount,
      movieTitle: payment.movieTitle,
      date: payment.createdAt,
    }));

    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};