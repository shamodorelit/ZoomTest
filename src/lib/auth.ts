import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const signToken = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1d',
  });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const setTokenCookie = async (token: string) => {
  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  });
};

export const removeTokenCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.set('token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
};
