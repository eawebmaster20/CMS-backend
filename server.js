const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const setupSwagger = require('./swagger/swaggerConfig.js');

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());
setupSwagger(app);

// Auth Database
const authDb = new sqlite3.Database('./db/auth.db', (err) => {
  if (err) {
    console.error('Error opening auth database:', err.message);
  } else {
    console.log('Connected to auth.db');
    authDb.run(
      `CREATE TABLE IF NOT EXISTS users (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         email TEXT UNIQUE,
         password TEXT
       )`,
      (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
        }
      }
    );
  }
});

// Members Database
const membersDb = new sqlite3.Database('./db/members.db', (err) => {
  if (err) {
    console.error('Error opening members database:', err.message);
  } else {
    console.log('Connected to members.db');
    membersDb.run(
      `CREATE TABLE IF NOT EXISTS membersTable (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         email TEXT UNIQUE,
         firstName TEXT, 
         lastName TEXT,
         dateOfBirth TEXT,
         homeAddress TEXT,
         phoneNumber TEXT,
         haveChildren INTEGER,
         childrenIds TEXT,
         isChildrenMember INTEGER,
         maritalStatus INTEGER,
         spouseId TEXT,
         isSpouseMember INTEGER
       )`,
      (err) => {
        if (err) {
          console.error('Error creating members table:', err.message);
        }
      }
    );
  }
});

// Basic Route
app.get('/api', (req, res) => {
  res.json('Hello, the server is up on port 5000');
});

// User Registration (authDb)
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  authDb.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
    if (row) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    authDb.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, hashedPassword], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to register user', details: err.message });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
});

// User Login (authDb)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  authDb.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});

// Get Members (membersDb)
app.get('/api/members', (req, res) => {
  membersDb.all(`SELECT * FROM membersTable`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
    res.json(rows);
  });
});

// Register Member (membersDb)
app.post('/api/register-member', (req, res) => {
  membersDb.run(
    `INSERT INTO membersTable 
      (
        email,
        firstName, 
        lastName,
        dateOfBirth,
        homeAddress,
        phoneNumber,
        haveChildren,
        childrenIds,
        isChildrenMember,
        maritalStatus,
        spouseId,
        isSpouseMember
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.body.email,
      req.body.firstName, 
      req.body.lastName,
      req.body.dateOfBirth,
      req.body.homeAddress,
      req.body.phoneNumber,
      req.body.haveChildren,
      req.body.childrenIds,
      req.body.isChildrenMember,
      req.body.maritalStatus,
      req.body.spouseId,
      req.body.isSpouseMember,
    ], 
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to register member', details: err.message });
      }
      res.status(201).json({ message: 'Member registered successfully' });
    }
  );
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
