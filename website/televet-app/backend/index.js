// televet-app/backend/index.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Connected to MySQL DB');
  }
});

// -------------------------------------------------------------
// 🟢 USER LOGIN
// -------------------------------------------------------------
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  const sql = 'SELECT * FROM user_t WHERE usr_email = ? AND usr_password = ?';

  db.query(sql, [email, password], (err, result) => {
    if (err) {
      console.error('❌ Login query error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (result.length === 0)
      return res.status(401).json({ message: 'Invalid email or password' });

    const user = result[0];

    // 🧾 Log the login event with all key details
    console.log("✅ Login successful for user:");
    console.log({
      usr_id: user.usr_id,
      usr_firstName: user.usr_firstName,
      usr_lastName: user.usr_lastName,
      usr_email: user.usr_email,
      usr_type: user.usr_type
    });

    res.status(200).json({
      message: 'Login successful',
      userId: user.usr_id,
      firstName: user.usr_firstName,
      lastName: user.usr_lastName,
      userType: user.usr_type
    });
  });
});


// -------------------------------------------------------------
// 🟢 FETCH PETS (by user ID)
// -------------------------------------------------------------
app.get('/api/pets/:usr_id', (req, res) => {
  const usr_id = req.params.usr_id;

  const sql = `
    SELECT p.pet_id, p.pet_name, p.pet_species, p.pet_breed, p.pet_age, p.pet_gender,
           p.pet_hasVaccination, p.pet_vaccinationDate, p.pet_hasMedication,
           p.pet_medicationDetails, p.pet_hasAllergies, p.pet_allergyDetails,
           p.pet_dietType, p.pet_weight, p.pet_behavioralNotes, p.pet_lastUpdated
    FROM pet_t p
    JOIN pet_parent_t pp ON p.pp_id = pp.pp_id
    WHERE pp.usr_id = ?
  `;

  db.query(sql, [usr_id], (err, result) => {
    if (err) {
      console.error('❌ Fetch pets error:', err);
      return res.status(500).json({ error: 'Failed to fetch pets' });
    }
    res.status(200).json(result);
  });
});

// -------------------------------------------------------------
// 🟢 REGISTER (Pet Parent or Vet Admin)
// -------------------------------------------------------------
app.post('/api/register', (req, res) => {
  console.log("🚀 Incoming /api/register request");

  if (!req.body) {
    console.error("❌ No body received in request");
    return res.status(400).json({ error: "Missing request body" });
  }

  console.log("🟢 Full request body:", req.body);

  const {
    firstName,
    lastName,
    email,
    password,
    userType
  } = req.body;

  // Quick validation
  if (!firstName || !lastName || !email || !password || !userType) {
    console.error("❌ Missing basic registration fields");
    return res.status(400).json({ error: "Incomplete registration data" });
  }

  console.log("📥 Attempting user_t insert for type:", userType);

  const sqlUser = `
    INSERT INTO user_t (usr_firstName, usr_lastName, usr_email, usr_password, usr_type)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sqlUser, [firstName, lastName, email, password, userType], (err, userResult) => {
    if (err) {
      console.error("❌ Error inserting into user_t:", err);
      return res.status(500).json({ error: "Failed to register user_t" });
    }

    const userId = userResult.insertId;
    console.log("✅ Inserted into user_t with usr_id =", userId);

    // 🧩 PET PARENT REGISTRATION
    if (userType === "petParent") {
      console.log("👩‍👧 Detected petParent registration");
    
      const sqlParent = `INSERT INTO pet_parent_t (usr_id, pp_lastUpdated) VALUES (?, NOW())`;
      db.query(sqlParent, [userId], (err2, parentResult) => {
        if (err2) {
          console.error("❌ Error inserting into pet_parent_t:", err2);
          return res.status(500).json({ error: "Failed to insert pet_parent_t" });
        }
    
        const pp_id = parentResult.insertId;
        console.log("✅ pet_parent_t inserted, pp_id =", pp_id);
    
        // 🐶 INSERT PET IMMEDIATELY
        const sqlPet = `
          INSERT INTO pet_t (
            pp_id, pet_name, pet_species, pet_breed, pet_age, pet_gender,
            pet_hasVaccination, pet_vaccinationDate,
            pet_hasMedication, pet_medicationDetails,
            pet_hasAllergies, pet_allergyDetails,
            pet_dietType, pet_weight, pet_behavioralNotes, pet_lastUpdated
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
    
        const values = [
          pp_id,
          req.body.petName,
          req.body.animalType,
          req.body.breed,
          req.body.age,
          req.body.gender,
          req.body.hasVaccination,
          req.body.vaccinationDate || null,
          req.body.hasMedication,
          req.body.medicationDetails || null,
          req.body.hasAllergies,
          req.body.allergies || null,
          req.body.dietType,
          req.body.weight,
          req.body.behavioralNotes
        ];
    
        db.query(sqlPet, values, (err3, petResult) => {
          if (err3) {
            console.error("❌ Error inserting pet_t:", err3);
            return res.status(500).json({ error: "Failed to insert pet_t" });
          }
    
          console.log("✅ Pet inserted successfully with pet_id =", petResult.insertId);
          return res.status(200).json({ message: "Pet parent and pet registered successfully!" });
        });
      });
    
    

    // 🧩 VET ADMIN REGISTRATION
    } else if (userType === "vetAdmin") {
      console.log("👨‍⚕️ Detected vetAdmin registration, preparing vet_admin_t insert...");

      const sqlVetAdmin = `
        INSERT INTO vet_admin_t (
          usr_id,
          va_licenseNumber,
          va_licensingAuthority,
          va_yearsOfPractice,
          va_specialization,
          va_vetLocation,
          va_clinicName,
          va_clinicPhone,
          va_clinicEmail,
          va_consent,
          va_createdAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      console.log("🧾 Inserting vet admin data for userId:", userId);
      console.log({
        licenseNumber: req.body.licenseNumber,
        licensingAuthority: req.body.licensingAuthority,
        yearsOfPractice: req.body.yearsOfPractice,
        specialization: req.body.specialization,
        vetLocation: req.body.vetLocation,
        clinicName: req.body.clinicName,
        clinicPhone: req.body.clinicPhone,
        clinicEmail: req.body.clinicEmail
      });

      db.query(sqlVetAdmin, [
        userId,
        req.body.licenseNumber,
        req.body.licensingAuthority,
        req.body.yearsOfPractice,
        req.body.specialization || null,
        req.body.vetLocation,
        req.body.clinicName,
        req.body.clinicPhone,
        req.body.clinicEmail,
        'yes'
      ], (errVet, vetResult) => {
        if (errVet) {
          console.error("❌ Error inserting into vet_admin_t:", errVet);
          return res.status(500).json({ error: "Failed to register vet admin" });
        }

        console.log("✅ vet_admin_t inserted successfully, va_id =", vetResult.insertId);
        return res.status(200).json({ message: "Vet admin registered successfully!" });
      });
    } else {
      console.warn("⚠️ Unknown userType detected:", userType);
      return res.status(400).json({ error: "Invalid userType" });
    }
  });
});



// -------------------------------------------------------------
// 🟢 UPDATE PET
// -------------------------------------------------------------
app.put('/api/pets/:pet_id', (req, res) => {
  const { pet_id } = req.params;
  const updatedPet = req.body;

  const sql = `
    UPDATE pet_t SET
      pet_name = ?, pet_species = ?, pet_breed = ?, pet_age = ?, pet_gender = ?,
      pet_hasVaccination = ?, pet_vaccinationDate = ?, pet_hasMedication = ?, pet_medicationDetails = ?,
      pet_hasAllergies = ?, pet_allergyDetails = ?, pet_dietType = ?, pet_weight = ?, pet_behavioralNotes = ?, pet_lastUpdated = NOW()
    WHERE pet_id = ?
  `;

  db.query(sql, [
    updatedPet.pet_name,
    updatedPet.pet_species,
    updatedPet.pet_breed,
    updatedPet.pet_age,
    updatedPet.pet_gender,
    updatedPet.pet_hasVaccination,
    updatedPet.pet_vaccinationDate || null,
    updatedPet.pet_hasMedication,
    updatedPet.pet_medicationDetails,
    updatedPet.pet_hasAllergies,
    updatedPet.pet_allergyDetails,
    updatedPet.pet_dietType,
    updatedPet.pet_weight,
    updatedPet.pet_behavioralNotes,
    pet_id
  ], (err, result) => {
    if (err) {
      console.error('❌ Error updating pet:', err);
      return res.status(500).json({ error: 'Failed to update pet' });
    }

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Pet not found' });

    res.status(200).json({ message: 'Pet updated successfully' });
  });
});

// -------------------------------------------------------------
// 🟢 ADD PET (for existing pet parent)
// -------------------------------------------------------------
app.post('/api/add-pet', (req, res) => {
  const {
    userId,
    petName,
    animalType,
    breed,
    age,
    gender,
    hasVaccination,
    vaccinationDate,
    hasMedication,
    medicationDetails,
    hasAllergies,
    allergies,
    dietType,
    weight,
    behavioralNotes
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  // Find the pet parent ID (pp_id) linked to this user
  const findParentSQL = "SELECT pp_id FROM pet_parent_t WHERE usr_id = ?";
  db.query(findParentSQL, [userId], (err, parentResult) => {
    if (err) {
      console.error("❌ Error finding pet parent:", err);
      return res.status(500).json({ error: "Database error while finding pet parent" });
    }

    if (parentResult.length === 0) {
      return res.status(404).json({ error: "Pet parent not found for this user" });
    }

    const pp_id = parentResult[0].pp_id;

    const insertPetSQL = `
      INSERT INTO pet_t (
        pp_id, pet_name, pet_species, pet_breed, pet_age, pet_gender,
        pet_hasVaccination, pet_vaccinationDate,
        pet_hasMedication, pet_medicationDetails,
        pet_hasAllergies, pet_allergyDetails,
        pet_dietType, pet_weight, pet_behavioralNotes, pet_lastUpdated
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      pp_id,
      petName || null,
      animalType || null,
      breed || null,
      age || null,
      gender || null,
      hasVaccination || 'no',
      vaccinationDate || null,
      hasMedication || 'no',
      medicationDetails || null,
      hasAllergies || 'no',
      allergies || null,
      dietType || null,
      weight || null,
      behavioralNotes || null
    ];


    db.query(insertPetSQL, values, (err2, result) => {
      if (err2) {
        console.error("❌ Error inserting pet:", err2);
        return res.status(500).json({ error: "Failed to add pet" });
      }

      return res.status(200).json({ message: "✅ Pet added successfully!" });
    });
  });
});


// -------------------------------------------------------------
// 🟢 DELETE PET
// -------------------------------------------------------------
app.delete('/api/pets/:pet_id', (req, res) => {
  const { pet_id } = req.params;
  const sql = 'DELETE FROM pet_t WHERE pet_id = ?';

  db.query(sql, [pet_id], (err, result) => {
    if (err) {
      console.error('❌ Error deleting pet:', err);
      return res.status(500).json({ error: 'Failed to delete pet' });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Pet not found' });

    res.status(200).json({ message: 'Pet deleted successfully' });
  });
});

// -------------------------------------------------------------
app.get('/', (req, res) => res.send('🐾 Server is running...'));
app.listen(process.env.PORT || 8080, () => console.log(`🚀 Server on port ${process.env.PORT}`));

// Add these endpoints to your backend/index.js

// -------------------------------------------------------------
// 🟢 GET USER PROFILE (Pet Parent or Vet Admin)
// -------------------------------------------------------------
app.get('/api/profile/:usr_id', (req, res) => {
  const { usr_id } = req.params;

  // First get basic user info
  const userSQL = 'SELECT usr_id, usr_firstName, usr_lastName, usr_email, usr_password, usr_type FROM user_t WHERE usr_id = ?';
  
  db.query(userSQL, [usr_id], (err, userResult) => {
    if (err) {
      console.error('❌ Error fetching user:', err);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];

    // If pet parent, get pet_parent_t data
    if (user.usr_type === 'petParent') {
      const parentSQL = 'SELECT pp_id, pp_reminder, pp_lastUpdated, pp_schedule FROM pet_parent_t WHERE usr_id = ?';
      
      db.query(parentSQL, [usr_id], (err2, parentResult) => {
        if (err2) {
          console.error('❌ Error fetching pet parent:', err2);
          return res.status(500).json({ error: 'Failed to fetch pet parent data' });
        }

        if (parentResult.length === 0) {
          return res.status(404).json({ error: 'Pet parent data not found' });
        }

        res.status(200).json({
          ...user,
          ...parentResult[0]
        });
      });
    } 
    // If vet admin, get vet_admin_t data
    else if (user.usr_type === 'vetAdmin') {
      const vetSQL = `
        SELECT va_id, va_licenseNumber, va_licensingAuthority, va_yearsOfPractice, 
               va_specialization, va_vetLocation, va_clinicName, va_clinicPhone, 
               va_clinicEmail, va_consent, va_createdAt 
        FROM vet_admin_t 
        WHERE usr_id = ?
      `;
      
      db.query(vetSQL, [usr_id], (err2, vetResult) => {
        if (err2) {
          console.error('❌ Error fetching vet admin:', err2);
          return res.status(500).json({ error: 'Failed to fetch vet admin data' });
        }

        if (vetResult.length === 0) {
          return res.status(404).json({ error: 'Vet admin data not found' });
        }

        res.status(200).json({
          ...user,
          ...vetResult[0]
        });
      });
    } else {
      return res.status(400).json({ error: 'Invalid user type' });
    }
  });
});

// -------------------------------------------------------------
// 🟢 UPDATE USER PROFILE (Pet Parent)
// -------------------------------------------------------------
app.put('/api/profile/petparent/:usr_id', (req, res) => {
  const { usr_id } = req.params;
  const { usr_firstName, usr_lastName, usr_email, usr_password } = req.body;

  // Update user_t table
  const updateUserSQL = `
    UPDATE user_t 
    SET usr_firstName = ?, usr_lastName = ?, usr_email = ?, usr_password = ?
    WHERE usr_id = ?
  `;

  db.query(updateUserSQL, [usr_firstName, usr_lastName, usr_email, usr_password, usr_id], (err, result) => {
    if (err) {
      console.error('❌ Error updating user:', err);
      return res.status(500).json({ error: 'Failed to update user data' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update pet_parent_t lastUpdated
    const updateParentSQL = 'UPDATE pet_parent_t SET pp_lastUpdated = NOW() WHERE usr_id = ?';
    db.query(updateParentSQL, [usr_id], (err2) => {
      if (err2) {
        console.error('❌ Error updating pet parent timestamp:', err2);
      }
      res.status(200).json({ message: 'Profile updated successfully' });
    });
  });
});

// -------------------------------------------------------------
// 🟢 UPDATE USER PROFILE (Vet Admin)
// -------------------------------------------------------------
app.put('/api/profile/vetadmin/:usr_id', (req, res) => {
  const { usr_id } = req.params;
  const {
    usr_firstName,
    usr_lastName,
    usr_email,
    usr_password,
    va_licenseNumber,
    va_licensingAuthority,
    va_yearsOfPractice,
    va_specialization,
    va_vetLocation,
    va_clinicName,
    va_clinicPhone,
    va_clinicEmail
  } = req.body;

  // Update user_t table
  const updateUserSQL = `
    UPDATE user_t 
    SET usr_firstName = ?, usr_lastName = ?, usr_email = ?, usr_password = ?
    WHERE usr_id = ?
  `;

  db.query(updateUserSQL, [usr_firstName, usr_lastName, usr_email, usr_password, usr_id], (err, result) => {
    if (err) {
      console.error('❌ Error updating user:', err);
      return res.status(500).json({ error: 'Failed to update user data' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update vet_admin_t table
    const updateVetSQL = `
      UPDATE vet_admin_t 
      SET va_licenseNumber = ?, va_licensingAuthority = ?, va_yearsOfPractice = ?,
          va_specialization = ?, va_vetLocation = ?, va_clinicName = ?,
          va_clinicPhone = ?, va_clinicEmail = ?
      WHERE usr_id = ?
    `;

    db.query(updateVetSQL, [
      va_licenseNumber,
      va_licensingAuthority,
      va_yearsOfPractice,
      va_specialization,
      va_vetLocation,
      va_clinicName,
      va_clinicPhone,
      va_clinicEmail,
      usr_id
    ], (err2, vetResult) => {
      if (err2) {
        console.error('❌ Error updating vet admin:', err2);
        return res.status(500).json({ error: 'Failed to update vet admin data' });
      }

      res.status(200).json({ message: 'Profile updated successfully' });
    });
  });
});