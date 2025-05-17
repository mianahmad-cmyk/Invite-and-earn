require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Models
const User = require('./models/User');
// const Admin = require('./models/Admin');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes

// Home redirects to signup
app.get('/', (req, res) => {
    res.redirect('/signup');
});

// Signup page
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Signup POST - create user after payment simulation
app.post('/signup', async (req, res) => {
  const { name, phone, referrer } = req.body;

  try {
    // Find or create admin document (only one admin)
    let admin = await Admin.findOne();
    if (!admin) {
      admin = new Admin();
      await admin.save();
    }

    // Simulate payment success - replace with real payment integration
    const paymentSuccess = true;
    if (!paymentSuccess) {
      return res.status(400).send('Payment failed');
    }

    // Check if user with this phone exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).send('User with this phone already exists.');
    }

    // Find referrer if provided
    let referrerUser = null;
    if (referrer) {
      referrerUser = await User.findById(referrer);
    }

    // Create new user with initial transaction
    const newUser = new User({
      name,
      phone,
      referrerId: referrerUser ? referrerUser._id : null,
      balance: 0,
      transactions: [{
        type: 'payment',
        amount: 50,
        status: 'completed',
        date: new Date()
      }]
    });

    await newUser.save();

    // Split payment: half to admin, half to referrer if any
    admin.balance += 25;
    await admin.save();

    if (referrerUser) {
      referrerUser.balance += 25;
      referrerUser.transactions.push({
        type: 'referral',
        amount: 25,
        status: 'completed',
        date: new Date()
      });
      await referrerUser.save();
    }

    res.redirect(`/dashboard/${newUser._id}`);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Dashboard - user view
app.get('/dashboard/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('referrerId');
    if (!user) return res.status(404).send('User not found');

    res.render('dashboard', { user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Withdraw page (GET)
app.get('/withdraw/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).send('User not found');
    res.render('withdraw', { user, message: null });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Withdraw form submission (POST)
app.post('/withdraw/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).send('User not found');

    const amount = Number(req.body.amount);
    if (amount <= 0 || amount > user.balance) {
      return res.render('withdraw', { user, message: 'Invalid amount' });
    }

    // Simulate withdrawal processing
    user.balance -= amount;
    user.transactions.push({
      type: 'withdrawal',
      amount,
      status: 'completed',
      date: new Date()
    });

    await user.save();

    res.render('withdraw', { user, message: 'Withdrawal successful!' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
