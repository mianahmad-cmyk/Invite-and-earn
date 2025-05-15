const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  balance: { type: Number, default: 0 }
});

module.exports = mongoose.model('Admin', adminSchema);
