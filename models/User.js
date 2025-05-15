const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
 type: { type: String, enum: ['payment', 'withdrawal', 'referral'], required: true },

  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'completed'], default: 'completed' }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  balance: { type: Number, default: 0 },
  transactions: [transactionSchema]
});

module.exports = mongoose.model('User', userSchema);
