#!/usr/bin/env node
// Delete all students belonging to a given organization (by username or email domain match)
// Usage: node scripts/delete_students_by_org.js <organization_name>

const { pool } = require('../config/database');

async function main() {
  const orgArg = process.argv.slice(2).join(' ').trim();
  if (!orgArg) {
    console.error('Usage: node scripts/delete_students_by_org.js <organization_name>');
    process.exit(1);
  }

  const orgName = orgArg.toLowerCase();
  console.log(`🔍 Looking up organization by name: "${orgName}"`);

  const connection = await pool.getConnection();
  try {
    // Find organization user by username (case-insensitive)
    const [orgUsers] = await connection.execute(
      'SELECT id, username, email FROM users WHERE role = "organization" AND LOWER(username) = ? LIMIT 1',
      [orgName]
    );

    if (orgUsers.length === 0) {
      console.error(`❌ Organization not found for name: ${orgName}`);
      process.exit(2);
    }

    const organizationId = orgUsers[0].id;
    console.log(`🏢 Organization found: ${orgUsers[0].username} (id=${organizationId})`);

    // Fetch students to delete
    const [studentsToDelete] = await connection.execute(
      `SELECT os.student_id, u.username, u.email
       FROM organization_students os
       INNER JOIN users u ON os.student_id = u.id
       WHERE os.organization_id = ? AND os.status = 'active' AND u.role = 'student'`,
      [organizationId]
    );

    if (studentsToDelete.length === 0) {
      console.log('ℹ️ No students found for this organization. Nothing to delete.');
      process.exit(0);
    }

    console.log(`⚠️ Preparing to delete ${studentsToDelete.length} student(s).`);

    await connection.beginTransaction();

    const ids = studentsToDelete.map(s => s.student_id);
    const placeholders = ids.map(() => '?').join(',');

    // Delete from users; CASCADE will cleanup organization_students
    const [result] = await connection.execute(
      `DELETE FROM users WHERE id IN (${placeholders}) AND role = 'student'`,
      ids
    );

    await connection.commit();
    console.log(`✅ Deleted ${result.affectedRows} student account(s) for organization "${orgUsers[0].username}".`);
    process.exit(0);
  } catch (err) {
    try { await connection.rollback(); } catch {}
    console.error('❌ Error while deleting students:', err.message);
    process.exit(3);
  } finally {
    connection.release();
  }
}

main();
