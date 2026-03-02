import '../config/env.js';
import { connectDB } from '../config/db.js';
import Admin from '../models/Admin.js';

const seed = async () => {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const name = process.env.SEED_ADMIN_NAME || 'Super Admin';

  const exists = await Admin.findOne({ email });

  if (exists) {
    console.log(`Admin already exists for ${email}`);
    process.exit(0);
  }

  await Admin.create({
    name,
    email,
    password,
    role: 'super_admin'
  });

  console.log(`Seeded super_admin: ${email}`);
  process.exit(0);
};

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
