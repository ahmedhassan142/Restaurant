// app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();

        const user = await User.findOne({ 
          email: credentials.email.toLowerCase(),
          isActive: true 
        });

        if (!user || !(await user.comparePassword(credentials.password))) {
          return null;
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    }),
    CredentialsProvider({
      id: 'signup',
      name: 'signup',
      credentials: {
        name: { label: 'Full Name', type: 'text' },
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        confirmPassword: { label: 'Confirm Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.name) {
          throw new Error('Name, email, and password are required');
        }

        if (credentials.password !== credentials.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (credentials.password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ 
          email: credentials.email.toLowerCase() 
        });

        if (existingUser) {
          throw new Error('User with this email already exists');
        }

        // Create new user
        const user = new User({
          name: credentials.name.trim(),
          email: credentials.email.toLowerCase(),
          password: credentials.password,
          role: 'staff' // Default role for new signups
        });

        await user.save();

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account, credentials }) {
      // Allow sign in for both existing users and new registrations
      if (account?.provider === 'signup' || account?.provider === 'credentials') {
        return true;
      }
      return false;
    }
  },
  pages: {
    signIn: '/oginin',
    signUp: '/signup',
    
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };