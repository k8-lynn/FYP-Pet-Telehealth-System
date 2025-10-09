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

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  console.log("🟢 Received login request:", { email, password }); // Log input

  if (!email || !password) {
    console.log("❌ Missing email or password");
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const sql = 'SELECT * FROM user WHERE email = ? AND password = ?';

  db.query(sql, [email, password], (err, result) => {
    if (err) {
      console.error('❌ Login query error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    console.log("🔍 Query result:", result);

    if (result.length === 0) {
      console.log("❌ Invalid credentials for:", email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result[0];
    console.log("✅ Login successful for:", user.email, " | Type:", user.userType);

    res.status(200).json({
      message: 'Login successful',
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType
    });
  });
});


app.post('/register', (req, res) => {
  const {
    firstName, lastName, email, password, userType,
    animalType, petName, breed, age, gender,
    hasVaccination, vaccinationDate, hasCurrentMedication, medicationDetails,
    hasAllergies, allergies, dietType, weight, behavioralNotes
  } = req.body;

  const sqlUser = `
    INSERT INTO user (firstName, lastName, email, password, userType)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sqlUser, [firstName, lastName, email, password, userType], (err, result) => {
    if (err) {
      console.error('Insert user error:', err);

      // ✅ Handle duplicate email error
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Email already exists. Please use a different email.' });
      }

      return res.status(500).json({ error: 'Failed to register user' });
    }

    const userId = result.insertId;

    if (userType === 'petParent') {
      const sqlPetParent = `
        INSERT INTO pet_parent (
          user_id, animalType, petName, breed, age, gender,
          hasVaccination, vaccinationDate, hasCurrentMedication, medicationDetails,
          hasAllergies, allergies, dietType, weight, behavioralNotes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;


      const safeVaccinationDate = vaccinationDate ? vaccinationDate : null;

      db.query(sqlPetParent, [
        userId, animalType, petName, breed, age, gender,
        hasVaccination, safeVaccinationDate, hasCurrentMedication, medicationDetails,
        hasAllergies, allergies, dietType, weight, behavioralNotes
      ], (err2) => {
        if (err2) {
          console.error('Insert pet_parent error:', err2);
          return res.status(500).json({ error: 'Failed to save pet details' });
        }

        res.status(200).json({ message: 'Pet parent registered successfully' });
      });
    } else {
      res.status(200).json({ message: 'Vet registered successfully' });
    }
  });
});


app.get('/api/pet/:userId', (req, res) => {
  const { userId } = req.params;
  const sql = 'SELECT * FROM pet_parent WHERE user_id = ?';
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Fetch pet info error:', err);
      return res.status(500).json({ error: 'Failed to fetch pet info' });
    }
    res.status(200).json(result);
  });
});

// ✅ Fetch pets for a specific user
app.get('/api/pets/:user_id', (req, res) => {
  const userId = req.params.user_id;

  const sql = `
    SELECT 
      id,
      petName AS name,
      animalType AS species,
      breed,
      gender,
      age,
      weight,
      dietType,
      behavioralNotes,
      hasVaccination,
      vaccinationDate,
      hasCurrentMedication,
      medicationDetails,
      hasAllergies,
      allergies
    FROM pet_parent
    WHERE user_id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Fetch pets error:', err);
      return res.status(500).json({ error: 'Failed to fetch pets' });
    }
    res.status(200).json(results);
  });
});


// ✅ Add new pet for existing user
app.post('/api/add-pet', (req, res) => {
  const {
    userId,
    animalType,
    petName,
    breed,
    age,
    gender,
    hasVaccination,
    vaccinationDate,
    hasCurrentMedication,
    medicationDetails,
    hasAllergies,
    allergies,
    dietType,
    weight,
    behavioralNotes
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // ✅ Convert gender values to match ENUM('m', 'f')
  const safeGender =
    gender?.toLowerCase() === 'male' ? 'm' :
    gender?.toLowerCase() === 'female' ? 'f' :
    null;

  const safeVaccinationDate = vaccinationDate || null;
  const safeAge = age ? parseInt(age) : null;
  const safeWeight = weight ? parseFloat(weight) : null;

  const sqlAddPet = `
    INSERT INTO pet_parent (
      user_id, animalType, petName, breed, age, gender,
      hasVaccination, vaccinationDate, hasCurrentMedication, medicationDetails,
      hasAllergies, allergies, dietType, weight, behavioralNotes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sqlAddPet,
    [
      userId,
      animalType,
      petName,
      breed,
      safeAge,
      safeGender, // ✅ mapped here
      hasVaccination,
      safeVaccinationDate,
      hasCurrentMedication,
      medicationDetails,
      hasAllergies,
      allergies,
      dietType,
      safeWeight,
      behavioralNotes
    ],
    (err) => {
      if (err) {
        console.error('Add pet error:', err.sqlMessage || err);
        return res.status(500).json({ error: 'Failed to add pet' });
      }

      res.sendStatus(200);
    }
  );
});

app.delete('/api/pets/:petId', (req, res) => {
  const petId = req.params.petId;

  if (!petId) {
    return res.status(400).json({ error: "Pet ID is required" });
  }

  const sql = "DELETE FROM pet_parent WHERE id = ?";

  db.query(sql, [petId], (err, result) => {
    if (err) {
      console.error("Error deleting pet:", err);
      return res.status(500).json({ error: "Failed to delete pet" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pet not found" });
    }

    res.json({ message: "Pet deleted successfully" });
  });
});
// ✅ Update an existing pet
app.put('/api/pets/:petId', (req, res) => {
  const petId = req.params.petId;
  const updatedPet = req.body;

  if (!petId) {
    return res.status(400).json({ error: "Pet ID is required" });
  }

  // Map frontend field names to DB column names
  const {
    name,         // from React
    species,      // from React
    breed,
    gender,
    age,
    weight,
    dietType,
    behavioralNotes,
    hasVaccination,
    vaccinationDate,
    hasCurrentMedication,
    medicationDetails,
    hasAllergies,
    allergies
  } = updatedPet;

  // Validate and clean up data
  const safeGender =
    gender?.toLowerCase() === 'male' ? 'm' :
    gender?.toLowerCase() === 'female' ? 'f' :
    gender === 'm' || gender === 'f' ? gender : null;

  const safeVaccinationDate = vaccinationDate || null;
  const safeAge = age ? parseInt(age) : null;
  const safeWeight = weight ? parseFloat(weight) : null;

  const sql = `
    UPDATE pet_parent
    SET
      petName = ?,
      animalType = ?,
      breed = ?,
      gender = ?,
      age = ?,
      weight = ?,
      dietType = ?,
      behavioralNotes = ?,
      hasVaccination = ?,
      vaccinationDate = ?,
      hasCurrentMedication = ?,
      medicationDetails = ?,
      hasAllergies = ?,
      allergies = ?
    WHERE id = ?
  `;

  db.query(sql, [
    name,
    species,
    breed,
    safeGender,
    safeAge,
    safeWeight,
    dietType,
    behavioralNotes,
    hasVaccination,
    safeVaccinationDate,
    hasCurrentMedication,
    medicationDetails,
    hasAllergies,
    allergies,
    petId
  ], (err, result) => {
    if (err) {
      console.error("Error updating pet:", err.sqlMessage || err);
      return res.status(500).json({ error: "Failed to update pet" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pet not found" });
    }

    res.status(200).json({ message: "Pet updated successfully" });
  });
});



app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

app.get('/', (req, res) => {
    res.send('Server is running');
  });