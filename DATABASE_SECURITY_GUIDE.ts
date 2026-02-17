/**
 * DATABASE SECURITY & PARAMETERIZED QUERIES GUIDE
 * 
 * ✅ SQL injection prevention
 * ✅ Parameterized query patterns
 * ✅ Supabase/PostgreSQL examples
 * ✅ Safe query execution
 * ✅ Data validation + sanitization
 * 
 * Date: February 17, 2026
 */

// ============================================================
// SQL INJECTION VULNERABILITY
// ============================================================

/**
 * WHAT IS SQL INJECTION?
 * 
 * SQL injection is when an attacker inserts malicious SQL code
 * into user input, which then gets executed by the database.
 * 
 * EXAMPLE ATTACK:
 * 
 * ❌ Vulnerable code:
 * const email = req.body.email; // "user@example.com' OR '1'='1"
 * const query = `SELECT * FROM users WHERE email = '${email}'`;
 * 
 * Generated SQL:
 * SELECT * FROM users WHERE email = 'user@example.com' OR '1'='1'
 *                                                          ^^^^^^^ Always true!
 * 
 * Result: Returns ALL users instead of just one!
 * 
 * WORSE ATTACK:
 * 
 * Email input: "' OR '1'='1'; DROP TABLE users; --"
 * 
 * Generated SQL:
 * SELECT * FROM users WHERE email = '' OR '1'='1'; DROP TABLE users; --'
 *                                                   ^^^^^^^^^^^^^^^^^ Deletes entire table!
 * 
 * SOLUTION: Use parameterized queries!
 */

// ============================================================
// PARAMETERIZED QUERIES (THE FIX)
// ============================================================

/**
 * Parameterized queries separate SQL code from data.
 * 
 * The database sees:
 * - SQL code (structure)
 * - Parameters (data)
 * 
 * The database NEVER interprets data as code.
 * 
 * ✅ SAFE: Data is always treated as data, never as SQL code
 * 
 * EXAMPLE:
 * 
 * ✅ Correct method:
 * const email = req.body.email; // Even if malicious input
 * const query = 'SELECT * FROM users WHERE email = $1';
 * const result = await db.query(query, [email]); // Parameters passed separately
 * 
 * The database sees:
 * - Query: "SELECT * FROM users WHERE email = ?"
 * - Parameter: "user@example.com' OR '1'='1"
 * - Treats parameter as a STRING, never tries to parse it as SQL
 * - Returns 0 results (no user with that email)
 * 
 * Even if input is: "'; DROP TABLE users; --"
 * Result: Looks for user with that exact email, finds nothing
 */

// ============================================================
// PARAMETERIZED QUERIES WITH SUPABASE
// ============================================================

/**
 * Supabase uses PostgREST API (REST layer on PostgreSQL)
 * 
 * ✅ SAFE - Uses built-in parameterized queries
 * 
 * Example: Find user by email
 * 
 * const { data, error } = await supabase
 *   .from('users')
 *   .select('*')
 *   .eq('email', userEmail); // Parameter passed here
 * 
 * Internally, Supabase generates:
 * SELECT * FROM users WHERE email = $1
 * And executes with: [userEmail]
 * 
 * Your email input is NEVER concatenated into the query string.
 */

// ============================================================
// PARAMETERIZED QUERIES WITH PG LIBRARY
// ============================================================

/**
 * If using the 'pg' npm package directly:
 * 
 * npm install pg
 * 
 * Example 1: SELECT by email
 * 
 * const { Pool } = require('pg');
 * const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 * 
 * const email = req.body.email; // User input (potentially malicious)
 * const query = 'SELECT * FROM users WHERE email = $1';
 * const values = [email]; // Parameters as separate array
 * 
 * const result = await pool.query(query, values);
 * // result.rows contains the results
 * 
 * Even if email = "' OR '1'='1", the database treats it as a literal string.
 * 
 * Example 2: INSERT with multiple parameters
 * 
 * const query = 'INSERT INTO users (email, display_name, password_hash) VALUES ($1, $2, $3)';
 * const values = [email, displayName, passwordHash];
 * 
 * const result = await pool.query(query, values);
 * 
 * Example 3: UPDATE with WHERE clause
 * 
 * const query = 'UPDATE users SET display_name = $1 WHERE id = $2';
 * const values = [newName, userId];
 * 
 * const result = await pool.query(query, values);
 */

// ============================================================
// PARAMETERIZED QUERIES WITH SEQUELIZE ORM
// ============================================================

/**
 * ORMs like Sequelize automatically use parameterized queries
 * 
 * npm install sequelize pg pg-hstore
 * 
 * Example: Find user by email
 * 
 * const user = await User.findOne({
 *   where: { email: userEmail } // Automatically parameterized
 * });
 * 
 * Sequelize generates: SELECT * FROM users WHERE email = ?
 * And executes with: [userEmail]
 * 
 * Create new user:
 * 
 * const user = await User.create({
 *   email: userEmail,
 *   displayName: displayName,
 *   passwordHash: hashedPassword
 * });
 * 
 * Update user:
 * 
 * await User.update(
 *   { displayName: newName },
 *   { where: { id: userId } }
 * );
 */

// ============================================================
// INPUT VALIDATION + PARAMETERIZED QUERIES
// ============================================================

/**
 * LAYERED DEFENSE (Defense in Depth)
 * 
 * You should use BOTH validation AND parameterized queries
 * 
 * Layer 1: Input Validation (Express-validator)
 * ✅ Checks email format
 * ✅ Checks password strength
 * ✅ Sanitizes HTML/special chars
 * ✅ Rejects obviously bad input
 * 
 * Layer 2: Parameterized Queries (Database)
 * ✅ Even if validation fails, SQL injection impossible
 * ✅ Data is ALWAYS treated as data
 * ✅ Database engine never interprets it as code
 * 
 * Layer 3: Type Checking (TypeScript)
 * ✅ Compile-time checks
 * ✅ Prevents passing wrong types
 * 
 * Example flow:
 * 
 * 1. Express-validator validates input
 *    Input: "user@example.com' OR '1'='1"
 *    Check: Is this a valid email? NO → Reject
 * 
 * 2. If passes validation, use parameterized query
 *    Input: "user@example.com"
 *    Query: SELECT * FROM users WHERE email = $1
 *    Parameterized: [userEmail]
 *    Result: User with email user@example.com found
 * 
 * 3. TypeScript prevents wrong types
 *    userId: number (can't pass string)
 *    email: string (can't pass undefined)
 */

// ============================================================
// IMPLEMENTATION FOR VAIRO SERVER
// ============================================================

/**
 * YOUR SERVER (server.ts) CURRENTLY:
 * 
 * ✅ Input validation added (express-validator)
 *    - Email format checked
 *    - Password strength enforced  
 *    - HTML/XSS sanitized
 *    - String lengths validated
 * 
 * ⏳ Next: When implementing route handlers:
 *    - Use parameterized queries
 *    - Never concatenate user input into SQL
 *    - Use framework ORM or parameterized libraries
 * 
 * EXAMPLE IMPLEMENTATION:
 * 
 * When handler is implemented:
 * 
 * app.post('/api/auth/login', ..., async (req: Request, res: Response) => {
 *   // At this point, input is validated and sanitized by express-validator
 *   const { email, password } = req.body;
 *   
 *   try {
 *     // ✅ GOOD: Use Supabase (parameterized)
 *     const { data: user, error } = await supabase
 *       .from('users')
 *       .select('*')
 *       .eq('email', email) // ← Parameterized, safe
 *       .single();
 *     
 *     if (error || !user) {
 *       return res.status(401).json({
 *         success: false,
 *         error: { code: 'INVALID_CREDENTIALS' }
 *       });
 *     }
 *     
 *     // Verify password...
 *     // Generate tokens...
 *     // Return user + tokens
 *   } catch (error) {
 *     res.status(500).json({
 *       success: false,
 *       error: { code: 'LOGIN_FAILED' }
 *     });
 *   }
 * });
 */

// ============================================================
// PARAMETERIZED QUERY PATTERNS
// ============================================================

/**
 * PATTERN 1: Simple WHERE clause
 * 
 * const query = 'SELECT * FROM users WHERE email = $1';
 * const result = await db.query(query, [email]);
 * 
 * ─────────────────────────────────────────────────
 * PATTERN 2: Multiple conditions
 * 
 * const query = `
 *   SELECT * FROM users
 *   WHERE email = $1 AND is_active = $2
 * `;
 * const result = await db.query(query, [email, true]);
 * 
 * ─────────────────────────────────────────────────
 * PATTERN 3: INSERT with multiple fields
 * 
 * const query = `
 *   INSERT INTO users (email, display_name, password_hash, role)
 *   VALUES ($1, $2, $3, $4)
 *   RETURNING id, email, display_name, role
 * `;
 * const result = await db.query(query, [email, displayName, hash, 'user']);
 * 
 * ─────────────────────────────────────────────────
 * PATTERN 4: UPDATE with WHERE
 * 
 * const query = `
 *   UPDATE users
 *   SET display_name = $1, bio = $2, updated_at = NOW()
 *   WHERE id = $3
 *   RETURNING *
 * `;
 * const result = await db.query(query, [newName, newBio, userId]);
 * 
 * ─────────────────────────────────────────────────
 * PATTERN 5: DELETE with conditions
 * 
 * const query = 'DELETE FROM sessions WHERE user_id = $1 AND expires_at < NOW()';
 * const result = await db.query(query, [userId]);
 * 
 * ─────────────────────────────────────────────────
 * PATTERN 6: Transactions (multiple queries)
 * 
 * const client = await pool.connect();
 * try {
 *   await client.query('BEGIN');
 *   
 *   // Query 1: Create user
 *   const userResult = await client.query(
 *     'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
 *     [email, passwordHash]
 *   );
 *   const userId = userResult.rows[0].id;
 *   
 *   // Query 2: Create user profile
 *   await client.query(
 *     'INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)',
 *     [userId, displayName]
 *   );
 *   
 *   // Query 3: Log activity
 *   await client.query(
 *     'INSERT INTO activity_log (user_id, action) VALUES ($1, $2)',
 *     [userId, 'signup']
 *   );
 *   
 *   await client.query('COMMIT');
 *   return userId;
 * } catch (error) {
 *   await client.query('ROLLBACK');
 *   throw error;
 * } finally {
 *   client.release();
 * }
 */

// ============================================================
// ANTI-PATTERNS (WHAT NOT TO DO)
// ============================================================

/**
 * ❌ ANTI-PATTERN 1: String concatenation
 * 
 * const email = req.body.email;
 * const query = `SELECT * FROM users WHERE email = '${email}'`;
 * const result = await db.query(query);
 * 
 * WHY BAD:
 * If email = "admin' --", query becomes:
 * SELECT * FROM users WHERE email = 'admin' --'
 * Comment removes rest of query!
 * 
 * If email = "' OR '1'='1", query becomes:
 * SELECT * FROM users WHERE email = '' OR '1'='1'
 * Returns all users!
 * 
 * ─────────────────────────────────────────────────
 * ❌ ANTI-PATTERN 2: String.replace()
 * 
 * let query = 'SELECT * FROM users WHERE email = :email';
 * query = query.replace(':email', req.body.email); // UNSAFE!
 * 
 * WHY BAD:
 * Still vulnerable to injection if replacement not careful
 * String replacement doesn't understand SQL context
 * 
 * ─────────────────────────────────────────────────
 * ❌ ANTI-PATTERN 3: String escaping (insufficient)
 * 
 * const escaped = email.replace(/'/g, "''");
 * const query = `SELECT * FROM users WHERE email = '${escaped}'`;
 * 
 * WHY BAD:
 * Escaping is database-specific
 * May miss edge cases
 * Different databases escape differently
 * One mistake = vulnerability
 * 
 * ─────────────────────────────────────────────────
 * ❌ ANTI-PATTERN 4: Building queries dynamically
 * 
 * let query = 'SELECT * FROM ' + table + ' WHERE ' + column + ' = ' + value;
 * 
 * WHY BAD:
 * User can control table/column names!
 * Even if values are parameterized, column names aren't
 * Example: table='users; DROP TABLE users; --'
 * 
 * ─────────────────────────────────────────────────
 * ✅ CORRECT APPROACHES:
 * 
 * 1. Parameterized queries (best)
 *    const query = 'SELECT * FROM users WHERE email = $1';
 *    db.query(query, [email]);
 * 
 * 2. ORM/Query builder (good)
 *    User.findOne({ where: { email: email } });
 * 
 * 3. Prepared statements (good)
 *    statement = db.prepare('SELECT * FROM users WHERE email = ?');
 *    statement.bind([email]);
 */

// ============================================================
// TESTING PARAMETERIZED QUERIES
// ============================================================

/**
 * Test case: SQL injection attempts should fail safely
 * 
 * Test inputs:
 * 
 * 1. Normal input:
 *    email: "user@example.com"
 *    Expected: Finds user
 * 
 * 2. SQL injection attempt - OR condition:
 *    email: "' OR '1'='1"
 *    Expected: No user found (looks for that exact email)
 * 
 * 3. SQL injection attempt - comment:
 *    email: "admin' --"
 *    Expected: No user found
 * 
 * 4. SQL injection attempt - DROP:
 *    email: "'; DROP TABLE users; --"
 *    Expected: No user found, table still exists
 * 
 * 5. SQL injection attempt - UNION:
 *    email: "' UNION SELECT * FROM users --"
 *    Expected: No user found
 * 
 * 6. Unicode/special chars:
 *    email: "user+tag@example.com"
 *    Expected: Finds user (legitimate email format)
 * 
 * If all tests pass → Your database queries are safe!
 */

// ============================================================
// CHECKLIST FOR IMPLEMENTATION
// ============================================================

/**
 * When implementing route handlers:
 * 
 * ☐ Import database client (Supabase, pg, etc)
 * ☐ For each database query:
 *   ☐ Use parameterized queries
 *   ☐ Pass parameters as array/list
 *   ☐ Never concatenate user input
 *   ☐ Check for errors from database
 * 
 * ☐ For authentication routes:
 *   ☐ Use parameterized query to find user by email
 *   ☐ Use parameterized query for password reset token
 *   ☐ Use parameterized query to update user
 * 
 * ☐ For content routes:
 *   ☐ Use parameterized query to insert post
 *   ☐ Use parameterized query to find user by ID
 *   ☐ Use parameterized query to update profile
 * 
 * ☐ Testing:
 *   ☐ Test with normal inputs
 *   ☐ Test with SQL injection attempts
 *   ☐ Verify injection attempts fail safely
 * 
 * ☐ Code review:
 *   ☐ Search for string concatenation with user input
 *   ☐ Verify all queries use parameters
 *   ☐ Check error handling doesn't leak info
 */

// ============================================================
// SUMMARY
// ============================================================

/**
 * INPUT VALIDATION (Done ✅):
 * - Email format checked
 * - Password strength enforced
 * - String lengths validated
 * - HTML/XSS characters sanitized
 * - All user input validated before use
 * 
 * DATABASE SECURITY (Ready for implementation):
 * - Always use parameterized queries
 * - Never concatenate user input into SQL
 * - Use Supabase, ORM, or pg library with parameter binding
 * - Test with SQL injection attempts
 * - Verify all queries are parameterized
 * 
 * TOGETHER = SECURE API
 * 
 * Input validation catches bad input at entry point
 * Parameterized queries prevent SQL injection at database
 * Multiple layers = Defense in depth
 * 
 * Your server is now configured for security! 🔒
 */

export {};
