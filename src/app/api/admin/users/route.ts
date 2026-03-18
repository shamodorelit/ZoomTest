import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return false;
  const decoded: any = verifyToken(token);
  return decoded && decoded.role === 'admin';
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  await dbConnect();
  const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, users });
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { firstName, lastName, email, password } = await req.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: 'Please provide all fields' },
        { status: 400 }
      );
    }

    await dbConnect();
    const userExists = await User.findOne({ email });

    if (userExists) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'user',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Create User Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
