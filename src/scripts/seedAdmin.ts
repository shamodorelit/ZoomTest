import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log('MONGODB_URI from process.env:', process.env.MONGODB_URI);
import dbConnect from '../lib/db';
import User from '../models/User';

async function createAdmin() {
  await dbConnect();

  const adminExists = await User.findOne({ role: 'admin' });

  if (adminExists) {
    console.log('Admin already exists');
    process.exit(0);
  }

  const admin = await User.create({
    firstName: 'Admin',
    lastName: 'Shamod',
    email: 'admin@shamod.com',
    password: 'Abc@12345',
    role: 'admin',
  });

  console.log('Admin created successfully:', admin.email);
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
