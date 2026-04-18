import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String },
  signature: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  movieTitle: { type: String },
  invoiceGenerated: { type: Boolean, default: false },
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;