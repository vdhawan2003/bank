// Import the necessary modules at the top
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Import CORS

// Initialize the app and middleware
const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection setup
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Vd@9410296636',  // Replace with your MySQL password if different
  database: 'bank_management'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  } else {
    console.log('Connected to the MySQL database!');
  }
});

// Signup route (POST method)
app.post('/signup', (req, res) => {
  const { name, age, account_no, phone, email, mpin, password } = req.body;

  // Validate input
  if (!name || !age || !account_no || !phone || !email || !mpin || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Check if account or email already exists
  const checkQuery = 'SELECT * FROM users WHERE account_no = ? OR email = ?';
  db.query(checkQuery, [account_no, email], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'Account number or email already exists' });
    }

    // Hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      // Insert new user into users table
      const insertQuery = `
        INSERT INTO users 
        (name, age, account_no, phone, email, mpin, password) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(insertQuery, [name, age, account_no, phone, email, mpin, hashedPassword], (err, result) => {
        if (err) {
          console.error('Error inserting data into database:', err);
          return res.status(500).json({ message: 'Error inserting data into database' });
        }

        // ✅ Correct place to access result.insertId
        const userId = result.insertId;

        // Insert default account type into account_types table
        const accountTypeQuery = `
          INSERT INTO account_types (user_id, type, created_at) 
          VALUES (?, ?, NOW())
        `;

        db.query(accountTypeQuery, [userId, 'Savings'], (err) => {
          if (err) {
            console.error('Error inserting account type:', err);
            return res.status(500).json({ message: 'Error creating account type' });
          }

          res.status(201).json({ message: 'User registered successfully with account type' });
        });
      });
    });
  });
});

// User Login Route
app.post('/login', (req, res) => {
  const { account_no, mpin, password } = req.body;

  // Validate input
  if (!account_no || (!mpin && !password)) {
    return res.status(400).json({ message: 'Account number and either MPIN or password are required' });
  }

  // Fetch user by account number
  const query = 'SELECT * FROM users WHERE account_no = ?';
  db.query(query, [account_no], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const user = results[0];

    // Verify MPIN or password
    const passwordMatch = password && bcrypt.compareSync(password, user.password);
    if ((mpin && user.mpin === mpin) || passwordMatch) {
      // Generate a JWT token
      const token = jwt.sign(
        { id: user.id, account_no: user.account_no },
        'your-secret-key',  // Replace with a strong secret or environment variable
        { expiresIn: '1h' }
      );
      // Hide sensitive data
      delete user.password;
      res.json({ message: 'Login successful', user, token });
    } else {
      res.status(401).json({ message: 'Invalid MPIN or password' });
    }
  });
});

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Protected route: Get account balance
app.get('/balance', authenticateToken, (req, res) => {
  const sql = 'SELECT balance FROM users WHERE id = ?';
  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!results.length) return res.status(404).json({ message: 'Account not found' });
    res.json({ balance: results[0].balance });
  });
});

// Protected route: Deposit amount
app.post('/deposit', authenticateToken, (req, res) => {
  const { amount } = req.body;
  const user_id = req.user.id; // Get user_id from token

  // Validate Input Amount
  const depositAmountValue = parseFloat(amount); // Ensure it's treated as a number
  if (isNaN(depositAmountValue) || depositAmountValue <= 0) {
    return res.status(400).json({ message: 'Invalid deposit amount' });
  }

  // 1. Update User's Balance
  const updateBalanceSql = 'UPDATE users SET balance = balance + ? WHERE id = ?';
  db.query(updateBalanceSql, [depositAmountValue, user_id], (updateErr, updateResult) => {
    if (updateErr) {
      console.error('Error updating balance during deposit:', updateErr);
      return res.status(500).json({ message: 'Server error processing deposit' });
    }

    // Check if the update actually affected a row (good practice)
    if (updateResult.affectedRows === 0) {
      console.error('Deposit balance update affected 0 rows for user:', user_id);
      // This indicates the user_id might not exist, though authenticateToken should prevent this.
      return res.status(404).json({ message: 'User account not found for deposit.' });
    }

    // 2. Log the Transaction AFTER successfully updating balance
    const logTransactionSql = 'INSERT INTO transactions (user_id, transaction_type, amount) VALUES (?, ?, ?)';
    db.query(logTransactionSql, [user_id, 'deposit', depositAmountValue], (logErr) => { // Use 'deposit' type
      if (logErr) {
        // Important: Balance WAS updated, but logging failed. Log this serious issue server-side.
        console.error('CRITICAL: Balance updated but failed to log deposit transaction for user:', user_id, logErr);
        // Inform user that the action succeeded but logging failed
        res.json({ message: 'Deposit successful (logging might have failed)' });
      } else {
        // 3. Send final success response ONLY if both update and log succeed
        res.json({ message: 'Deposit successful' });
      }
    }); // End log transaction query
  }); // End update balance query
}); // End route handler


// Protected route: Withdraw amount
app.post('/withdraw', authenticateToken, (req, res) => {
  // 1. Extract amount and user_id
  const { amount } = req.body;
  const user_id = req.user.id; // Provided by authenticateToken middleware

  // 2. Validate Input Amount
  const withdrawalAmount = parseFloat(amount); // Ensure it's treated as a number
  if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
    return res.status(400).json({ message: 'Invalid withdrawal amount' });
  }

  // 3. Check Current Balance FIRST
  const checkBalanceSql = 'SELECT balance FROM users WHERE id = ?';
  db.query(checkBalanceSql, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching balance for withdrawal:', err);
      return res.status(500).json({ message: 'Server error checking balance' });
    }
    if (!results.length) {
      // Should not happen if authenticateToken worked, but good safety check
      return res.status(404).json({ message: 'User account not found' });
    }

    const currentBalance = parseFloat(results[0].balance); // Ensure balance is a number

    // 4. Check for Sufficient Funds
    if (withdrawalAmount > currentBalance) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    // 5. If funds are sufficient, proceed to update balance
    const updateBalanceSql = 'UPDATE users SET balance = balance - ? WHERE id = ?';
    // Point A: Check values just before the query
    console.log(`Attempting to update balance for user_id: ${user_id} with amount: ${withdrawalAmount}`); // <-- ADD LOG
    db.query(updateBalanceSql, [withdrawalAmount, user_id], (updateErr, updateResult) => {
      // Point B: Check results after the query
      console.log('Update Balance Result:', { updateErr, updateResult }); // <-- ADD LOG
      if (updateErr) {
        console.error('Error updating balance during withdrawal:', updateErr);
        return res.status(500).json({ message: 'Server error processing withdrawal' });
      }

      // Check if the update actually affected a row
      if (updateResult.affectedRows === 0) {
         // THIS IS A LIKELY CULPRIT if you reach the logging step
         console.error('Withdrawal balance update affected 0 rows for user:', user_id);
         // IMPORTANT: Currently this returns an error, stopping before logging.
         // If logging STILL happens, this 'if' block isn't being entered correctly, OR
         // the structure is different than expected.
         return res.status(500).json({ message: 'Error applying withdrawal update (user ID match issue?).' });
      }


      // 6. Log the transaction AFTER successfully updating balance
      const logTransactionSql = 'INSERT INTO transactions (user_id, transaction_type, amount) VALUES (?, ?, ?)';
      db.query(logTransactionSql, [user_id, 'Withdrawal', withdrawalAmount], (logErr) => {
        if (logErr) {
          // Important: Balance WAS updated, but logging failed. Log this serious issue server-side.
          // For production, you'd ideally wrap steps 5 & 6 in a DB transaction.
          console.error('CRITICAL: Balance updated but failed to log withdrawal transaction for user:', user_id, logErr);
          // Inform user that the action succeeded but logging failed (optional)
          // return res.status(500).json({ message: 'Withdrawal processed but failed to log transaction history.' });

          // Or just return the success message since the core action (withdrawal) happened
           res.json({ message: 'Withdrawal successful (logging might have failed)' });
        } else {
          // 7. Send final success response ONLY if both update and log succeed
          res.json({ message: 'Withdrawal successful' });
        }
      }); // End log transaction query
    }); // End update balance query
  }); // End check balance query
}); // End route handler

// Create Transaction (Deposit/Withdrawal/Transfer)
app.post('/transaction', authenticateToken, (req, res) => {
  const { transaction_type, amount } = req.body;
  const user_id = req.user.id;

  if (!transaction_type || !amount) {
    return res.status(400).json({ message: 'Transaction type and amount are required' });
  }

  let query = 'INSERT INTO transactions (user_id, transaction_type, amount) VALUES (?, ?, ?)';
  db.query(query, [user_id, transaction_type, amount], (err, result) => {
    if (err) {
      console.error('Error inserting transaction:', err);
      return res.status(500).json({ message: 'Error inserting transaction' });
    }
    res.json({ message: 'Transaction successful' });
  });
});

// Get Transaction Details
app.get('/transactions', authenticateToken, (req, res) => {
  const user_id = req.user.id;

  let query = 'SELECT * FROM transactions WHERE user_id = ?';
  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching transactions:', err);
      return res.status(500).json({ message: 'Error fetching transactions' });
    }
    res.json({ transactions: results });
  });
});

// Create Mutual Fund Investment
app.post('/mutual-fund', authenticateToken, (req, res) => {
  const { fund_name, amount_invested, fund_type } = req.body;
  const user_id = req.user.id;

  if (!fund_name || !amount_invested || !fund_type) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  let query = 'INSERT INTO mutual_funds (user_id, fund_name, amount_invested, fund_type, date_invested) VALUES (?, ?, ?, ?, CURDATE())';
  db.query(query, [user_id, fund_name, amount_invested, fund_type], (err, result) => {
    if (err) {
      console.error('Error inserting mutual fund:', err);
      return res.status(500).json({ message: 'Error inserting mutual fund' });
    }
    res.json({ message: 'Mutual fund investment added successfully' });
  });
});

// Get Mutual Fund Investments
app.get('/mutual-funds', authenticateToken, (req, res) => {
  const user_id = req.user.id;

  let query = 'SELECT * FROM mutual_funds WHERE user_id = ?';
  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching mutual funds:', err);
      return res.status(500).json({ message: 'Error fetching mutual funds' });
    }
    res.json({ investments: results });
  });
});

// Add this within your backend server file (e.g., server.js),
// preferably near the other mutual fund routes.

// Delete Mutual Fund Investment (Protected)
app.delete('/mutual-fund/:id', authenticateToken, (req, res) => {
  const fundId = req.params.id; // Get the ID from the URL path parameter
  const userId = req.user.id;   // Get the user ID from the authenticated token

  console.log(`DELETE /mutual-fund/${fundId} triggered for user_id: ${userId}`);

  if (!fundId) {
    return res.status(400).json({ message: 'Fund ID is required.' });
  }

  // IMPORTANT: Delete only if the fund belongs to the logged-in user
  const sql = 'DELETE FROM mutual_funds WHERE id = ? AND user_id = ?';

  db.query(sql, [fundId, userId], (err, result) => {
    if (err) {
      console.error(`Error deleting mutual fund (ID: ${fundId}, User: ${userId}):`, err);
      return res.status(500).json({ message: 'Error deleting mutual fund investment.' });
    }

    // Check if any row was actually deleted
    if (result.affectedRows === 0) {
       console.warn(`No mutual fund found with ID ${fundId} belonging to user ${userId} to delete.`);
      // Could be because the ID was wrong, or it belonged to another user.
      // Send a 404 Not Found in this case.
      return res.status(404).json({ message: 'Investment not found or does not belong to the user.' });
    }

    console.log(`Mutual fund deleted successfully (ID: ${fundId}, User: ${userId})`);
    res.json({ message: 'Mutual fund investment removed successfully' });
  });
});

// Add Locker
app.post('/locker', authenticateToken, (req, res) => {
  const { locker_name } = req.body;
  const user_id = req.user.id;

  if (!locker_name) {
    return res.status(400).json({ message: 'Locker name is required' });
  }

  let query = 'INSERT INTO lockers (locker_name, user_id) VALUES (?, ?)';
  db.query(query, [locker_name, user_id], (err, result) => {
    if (err) {
      console.error('Error inserting locker:', err);
      return res.status(500).json({ message: 'Error inserting locker' });
    }
    res.json({ message: 'Locker created successfully' });
  });
});

// Get Lockers
app.get('/lockers', authenticateToken, (req, res) => {
  const user_id = req.user.id;

  let query = 'SELECT * FROM lockers WHERE user_id = ?';
  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching lockers:', err);
      return res.status(500).json({ message: 'Error fetching lockers' });
    }
    res.json({ lockers: results });
  });
});

// Add this within your backend server file (e.g., server.js),
// preferably near the other locker routes.

// Delete Locker (Protected)
app.delete('/locker/:id', authenticateToken, (req, res) => {
  const lockerId = req.params.id; // Get the locker ID from the URL parameter
  const userId = req.user.id;    // Get the user ID from the verified token

  console.log(`DELETE /locker/${lockerId} triggered for user_id: ${userId}`);

  // Basic validation for the ID from the URL
  if (!lockerId || isNaN(parseInt(lockerId))) { // Check if it's a valid number
    return res.status(400).json({ message: 'Valid Locker ID is required in the URL.' });
  }

  // SQL to delete the locker ONLY if it belongs to the logged-in user
  const sql = 'DELETE FROM lockers WHERE id = ? AND user_id = ?';

  db.query(sql, [lockerId, userId], (err, result) => {
    if (err) {
      console.error(`Error deleting locker (ID: ${lockerId}, User: ${userId}):`, err);
      return res.status(500).json({ message: 'Error deleting the locker.' });
    }

    // Check if any row was actually deleted
    if (result.affectedRows === 0) {
       console.warn(`No locker found with ID ${lockerId} belonging to user ${userId} to delete.`);
      // Send 404 Not Found if the locker didn't exist or didn't belong to the user
      return res.status(404).json({ message: 'Locker not found or you do not have permission to remove it.' });
    }

    // Deletion successful
    console.log(`Locker deleted successfully (ID: ${lockerId}, User: ${userId})`);
    res.json({ message: 'Locker removed successfully' });
  });
});

// Get Account Type
app.get('/account-type', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const sql = 'SELECT type FROM account_types WHERE user_id = ?';

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!results.length) return res.status(404).json({ message: 'Account type not found' });
    res.json({ account_type: results[0].type });
  });
});

// In server.js

// --- REMOVE THE FIRST GET ROUTE DEFINITION ---
/* // Delete this block entirely:
app.get('/personal-details', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const sql = 'SELECT * FROM personal_details WHERE user_id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!results.length) return res.status(404).json({ message: 'Personal details not found' });
    res.json({ personal_details: results[0] });
  });
});
*/


// --- KEEP AND REFINE THIS GET ROUTE ---
// GET Personal Details
app.get('/personal-details', authenticateToken, (req, res) => {
  const userId = req.user.id;
  // Select only the columns needed by the frontend/schema
  const sql = 'SELECT address, dob, pan_no, aadhar_no FROM personal_details WHERE user_id = ?';

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching personal details:", err);
      return res.status(500).json({ message: 'Error fetching personal details' });
    }

    if (results.length > 0) {
      // Send the found details (usually just one row per user)
      const details = results[0];

      // Ensure DOB is formatted as YYYY-MM-DD for <input type="date">
      // The mysql2 driver often returns DATE types as 'YYYY-MM-DD' strings already,
      // but this makes it more robust.
      if (details.dob) {
          try {
              // If it's already a string like 'YYYY-MM-DD...' just take the date part
              if (typeof details.dob === 'string') {
                  details.dob = details.dob.split('T')[0].split(' ')[0];
              } else if (details.dob instanceof Date) {
                   // If it's a Date object, format it
                   details.dob = details.dob.toISOString().split('T')[0];
              }
              // If it's some other type, it might cause issues later, but we'll send it as is for now.
          } catch (formatError) {
              console.error("Error formatting DOB from DB:", formatError);
              details.dob = null; // Send null if formatting fails
          }
      } else {
           details.dob = ''; // Send empty string if null/undefined for easier frontend handling
      }

      res.json(details); // Send the potentially formatted details object directly
    } else {
      // No details found yet for this user. Send an empty object (200 OK).
      // This is often easier for the frontend than handling a 404.
      res.json({});
    }
  });
});

// --- KEEP AND REFINE THIS POST ROUTE ---
// Add or Update Personal Details (Uses INSERT ... ON DUPLICATE KEY UPDATE)
// IMPORTANT: Requires 'user_id' to have a UNIQUE constraint in the 'personal_details' table.
app.post('/personal-details', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { address, dob, pan_no, aadhar_no } = req.body;

   // Basic validation - ADD MORE AS NEEDED (e.g., check PAN/Aadhar format, date validity)
   if (!address && !dob && !pan_no && !aadhar_no) {
       return res.status(400).json({ message: 'At least one detail must be provided to update.' });
   }

   // --- Date Handling ---
   let formattedDob = null; // Default to null if dob is not provided or invalid
   if (dob) { // Check if dob is provided and not empty/null/undefined
       try {
           // Attempt to create a valid Date object and format it to YYYY-MM-DD
           // This handles various input string formats that Date() can parse.
           const dateObj = new Date(dob);
           // Check if the date object is valid after parsing
           if (isNaN(dateObj.getTime())) {
               throw new Error('Invalid date value');
           }
           formattedDob = dateObj.toISOString().split('T')[0];
       } catch (dateError) {
           console.error("Invalid date format received for DOB:", dob, dateError);
           // Return an error if an invalid date format was *provided*
           return res.status(400).json({ message: 'Invalid date format for Date of Birth. Please use YYYY-MM-DD or a recognizable date format.' });
       }
   }
   // If dob was empty or null in the request, formattedDob remains null, which is fine for the DB.
   // --- End Date Handling ---
   console.log('--- Attempting to save personal details ---');
   console.log('User ID:', userId);
   console.log('Address:', address);
   console.log('Raw DOB from request:', req.body.dob); // Log the original value
   console.log('Formatted DOB for DB:', formattedDob); // <<< See if this is null, '', or 'YYYY-MM-DD'
   console.log('PAN:', pan_no);
   console.log('Aadhar:', aadhar_no);
   console.log('-----------------------------------------');
   
  // SQL uses ON DUPLICATE KEY UPDATE, relying on user_id being UNIQUE
  const sql = `
    INSERT INTO personal_details (user_id, address, dob, pan_no, aadhar_no)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    address = VALUES(address),
    dob = VALUES(dob),
    pan_no = VALUES(pan_no),
    aadhar_no = VALUES(aadhar_no)
  `;

  // Use the potentially null or formatted 'formattedDob' in the query
  db.query(sql, [userId, address, formattedDob, pan_no, aadhar_no], (err, result) => {
    if (err) {
       console.error("Error in POST /personal-details query:", err);
       // Check for specific errors if needed (e.g., foreign key constraint if user_id doesn't exist in users table)
       return res.status(500).json({ message: 'Error saving personal details. Please check server logs.' });
     }

     // result.affectedRows: 1 for INSERT, 2 for UPDATE (if data changed), 1 for UPDATE (if data was identical)
     // result.warningCount: might be 1 if data was identical on update
     // result.insertId: will be non-zero on successful INSERT

     if (result.affectedRows > 0 || result.insertId > 0) {
        console.log(`Personal details saved/updated successfully for user ${userId}. Result:`, result);
        res.json({ message: 'Personal details updated successfully' });
     } else if (result.affectedRows === 0 && result.warningStatus > 0) {
         // This likely means an UPDATE was attempted but the data was identical to existing data.
         console.warn(`POST /personal-details resulted in 0 affected rows but warning indicates update attempt for user ${userId}. Data might be identical.`);
         res.json({ message: 'Personal details are already up to date.' }); // Send specific message
     } else {
         // Should not ideally happen if query is correct and user_id exists, but log it.
         console.warn(`POST /personal-details resulted in unexpected result for user ${userId}:`, result);
         res.status(500).json({ message: 'An unexpected issue occurred while saving details.' });
     }
  });
});
// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});