const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to MySQL DB');
  }
});

app.post('/register', (req, res) => {
  const { firstName, lastName, email, password, userType } = req.body;

  const sql = 'INSERT INTO user (firstName, lastName, email, password, userType) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [firstName, lastName, email, password, userType], (err, result) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ error: 'Failed to register user' });
    }
    res.status(200).json({ message: 'User registered successfully' });
  });
});

app.post('/api/login', (req, res) => {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
  
    const query = 'SELECT * FROM user WHERE email = ? LIMIT 1';
    db.query(query, [email], (err, results) => {
      if (err) {
        console.error('DB query error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      if (results.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      const user = results[0];
  
      if (user.password === password) {
        return res.status(200).json({ message: 'Login successful' });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    });
  });
  
  
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

app.get('/', (req, res) => {
    res.send('Server is running');
  });