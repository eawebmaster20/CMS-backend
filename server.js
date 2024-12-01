const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const admin = require('firebase-admin');
const setupSwagger = require('./swagger/swaggerConfig.js');

dotenv.config();

// Firebase Admin SDK init
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://angular-auth-9fec9.firebaseio.com"
});

const db = admin.firestore();
const app = express();
app.use(bodyParser.json());
app.use(cors());
setupSwagger(app);

const saltRounds = 10;
// Basic Route
app.get('/api', (req, res) => {
  res.json('Hello, the server is up on port 5000');
});

// User Registration
app.post('/api/register', async (req, res) => {
  const { email, password, username } = req.body;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password: hashedPassword,
      displayName: username,
    });

    await db.collection('users').doc(userRecord.uid).set({
      email,
      password: hashedPassword,
      username,
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register user', details: err.message });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (userSnapshot.empty) {
      return res.status(400).json({ message: "User doesn't exist" });
    }

    const user = userSnapshot.docs[0].data();
    const isMatch = bcrypt.compareSync(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'invalid credentials'});
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, message:'success' });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
});

// Register Member
app.post('/api/members/add', async (req, res) => {
  try {
    const memberData = req.body;
    await db.collection('members').add(memberData);
    res.status(201).json({ message: 'Member registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register member', details: err.message });
  }
});

// Get Members
app.get('/api/members/get-all', async (req, res) => {
  try {
    const membersSnapshot = await db.collection('members').get();
    const members = membersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// get one member

app.get('/api/members/get/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const memberSnapshot = await db.collection('members').doc(id).get();
    if (!memberSnapshot.exists) {
      return res.status(404).json({ error: 'Member not found' });
    }
    const member = memberSnapshot.data();
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Add Event
app.post('/api/add-event', async (req, res) => {
  try {
    const eventData = req.body;
    await db.collection('events').add(eventData);
    res.status(201).json({ message: 'Event added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add event', details: err.message });
  }
});

// Get Events
app.get('/api/events', async (req, res) => {
  try {
    const eventsSnapshot = await db.collection('events').get();
    const events = eventsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Update Event
app.post('/api/update-event', async (req, res) => {
  const { id, title, className } = req.body;

  if (!id || !title || !className) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await db.collection('events').doc(id).update({ title, className });
    res.status(200).json({ message: 'Event updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event', details: err.message });
  }
});

// Delete Event
app.delete('/api/delete-event/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Missing event ID' });
  }

  try {
    await db.collection('events').doc(id).delete();
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event', details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
