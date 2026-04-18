import express from 'express';
import { generateInvoice, getInvoiceList } from '../controllers/invoiceController.js';

const router = express.Router();

// Download single invoice
router.get('/download/:paymentId', generateInvoice);

// Get all invoices
router.get('/list', getInvoiceList);

export default router;