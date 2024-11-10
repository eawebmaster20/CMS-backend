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
         password TEXT,
         username TEXT
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

    membersDb.run(
      `CREATE TABLE IF NOT EXISTS eventsTable (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         title TEXT UNIQUE,
         start INTEGER, 
         end INTEGER,
         className TEXT
       )`,
       
       (err) => {
         if (err) {
           console.error('Error creating members table:', err.message);
         }
       })
  }
});

// Basic Route
app.get('/api', (req, res) => {
  res.json('Hello, the server is up on port 5000');
});

// User Registration (authDb)
app.post('/api/register', (req, res) => {
  const { email, password, username } = req.body;
  authDb.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Server error', details: err });
    }
    if (row) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    authDb.run(`INSERT INTO users (email, password, username) VALUES (?, ?, ?)`, [email, hashedPassword, username], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to register user', details: err.message });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
});

// User Login (authDb)
app.post('/api/login', (req, res) => {
  console.log('USER LOGIN');
  const { email, password } = req.body;
  authDb.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
    if (!user) {
      return res.status(400).json({ message: 'user doesn\'t exist' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
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

// Get Members (membersDb)
app.get('/api/members', (req, res) => {
  membersDb.all(`SELECT * FROM membersTable`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
    res.json(rows);
  });
});


app.post('/api/add-event', (req, res) => {
  console.log('ADD EVENT')
  membersDb.run(
    `INSERT INTO eventsTable 
      (
        title,
        start, 
        end,
        className
      ) VALUES (?, ?, ?, ?)`,
    [
      req.body.title,
      req.body.start, 
      req.body.end,
      req.body.className,
    ], 
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to register member', details: err.message });
      }
      res.status(201).json({ message: 'Event Added successfully' });
    }
  );
})


app.get('/api/events', (req, res) => {
  membersDb.all(`SELECT * FROM eventsTable`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
    res.json(rows);
  });
});

// Get Members (membersDb)
app.post('/api/update-event', (req, res) => {
  const { id, title, className } = req.body;
  
  if (!id || !title || !className) {
    console.log('UPDATE EVENT')
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  membersDb.run(
    `UPDATE eventsTable 
    SET title = ?, className = ? 
    WHERE id = ?`,
    [title, className, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update event', details: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.status(200).json({ message: 'Event updated successfully' });
    }
  );
});


app.delete('/api/delete-event/:id', (req, res) => {
  const { id } = req.params;
  console.log('DELETE EVENT')
  if (!id) {
    return res.status(400).json({ error: 'Missing event ID' });
  }

  membersDb.run(
    `DELETE FROM eventsTable WHERE id = ?`,
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete event', details: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.status(200).json({ message: 'Event deleted successfully' });
    }
  );
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
