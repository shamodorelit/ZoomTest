import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// POST /api/admin/seed — creates the default admin user if none exists
// This is a one-time-use setup endpoint. Returns 409 if admin already exists.
export async function POST() {
  try {
    await dbConnect();

    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return NextResponse.json(
        { message: 'Admin user already exists', email: adminExists.email },
        { status: 409 }
      );
    }

    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'Shamod',
      email: 'admin@shamod.com',
      password: 'Abc@12345',
      role: 'admin',
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: {
        email: admin.email,
        password: 'Abc@12345',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
