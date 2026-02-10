
import React, { useState } from 'react';
import firebase from 'firebase/compat/app';
import { auth, db } from '../services/firebase';
import { Button } from './ui/button';
import { Eye, EyeOff, User as UserIcon, MailCheck, KeyRound, ChevronLeft } from 'lucide-react';
import { UserProfile } from '../types';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationEmailSentTo, setVerificationEmailSentTo] = useState<string | null>(null);

  const syncUserProfileToFirestore = async (uid: string, userEmail: string, userName: string) => {
    try {
      const userDocRef = db.collection('users').doc(uid);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        const newProfile: UserProfile = {
          uid,
          name: userName || 'New User',
          email: userEmail,
          photoFileName: 'default_avatar.png',
          createdAt: new Date().toISOString()
        };
        await userDocRef.set(newProfile);
      }
    } catch (err) {
      console.error("Error syncing user profile in Firestore:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        await auth.sendPasswordResetEmail(email);
        setSuccess('Password reset link sent! Please check your inbox.');
        setIsForgotPassword(false);
      } else if (isSignUp) {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (user) {
          await user.updateProfile({ displayName: name });
          await syncUserProfileToFirestore(user.uid, user.email || '', name);
          await user.sendEmailVerification();
          const userEmail = user.email;
          await auth.signOut();
          setVerificationEmailSentTo(userEmail);
        }
      } else {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (user && !user.emailVerified) {
          const userEmail = user.email;
          await auth.signOut();
          setVerificationEmailSentTo(userEmail);
          setLoading(false);
          return;
        }

        if (user) {
          await syncUserProfileToFirestore(user.uid, user.email || '', user.displayName || 'BYOSE User');
        }
      }
    } catch (err: any) {
      console.error('Auth error detail:', err.code);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Incorrect email or password. Verify your credentials.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Account temporarily locked due to many attempts. Try again later.');
      } else if (err.code === 'auth/invalid-email') {
        setError('The email address provided is not valid.');
      } else {
        setError('Authentication service unavailable. Please try again in a few moments.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const userCredential = await auth.signInWithPopup(provider);
      const user = userCredential.user;

      if (user && !user.emailVerified) {
        const userEmail = user.email;
        await auth.signOut();
        setVerificationEmailSentTo(userEmail);
      } else if (user) {
        await syncUserProfileToFirestore(user.uid, user.email || '', user.displayName || 'BYOSE User');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Could not sign in with Google. Check your network or try a different browser.');
      }
    } finally {
      setLoading(false);
    }
  };

  const BrandLogo = ({ className = "" }) => (
    <div className={`flex items-center ${className} scale-75 sm:scale-100`}>
      <div className="flex flex-col gap-[3px] mr-3">
        <div className="w-[54px] h-[26px] bg-[#165b4c] rounded-tr-[13px] rounded-br-[3px]"></div>
        <div className="w-[88px] h-[42px] bg-[#165b4c] rounded-tr-[21px] rounded-br-[21px] flex items-center justify-center">
          <span className="text-white font-black text-[13px] tracking-tight">BYOSE</span>
        </div>
      </div>
      <span className="text-[#165b4c] font-bold text-[32px] tracking-tight">Tech</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-slate-900">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <BrandLogo />
          <p className="text-slate-500 font-medium mt-2 text-xs sm:text-sm">Strategic Accountant Hub</p>
        </div>

        {verificationEmailSentTo ? (
          <div className="text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MailCheck className="text-[#165b4c]" size={40} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-4">Verify Your Email</h2>
            <p className="text-slate-600 mb-8 leading-relaxed text-sm">
              We have sent a verification link to <span className="font-bold text-[#165b4c]">{verificationEmailSentTo}</span>.
              Check your inbox and junk folder.
            </p>
            <Button
              onClick={() => { setVerificationEmailSentTo(null); setIsSignUp(false); }}
              className="w-full h-12 text-lg font-bold rounded-xl"
            >
              Back to Login
            </Button>
          </div>
        ) : isForgotPassword ? (
          <div className="animate-in fade-in duration-300">
            <button
              onClick={() => setIsForgotPassword(false)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold mb-6 text-sm"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <h1 className="text-xl font-black text-slate-800 mb-2">Reset Password</h1>
            <p className="text-slate-500 text-sm mb-6">Enter your email and we'll send a recovery link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email" required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#165b4c] outline-none transition-all text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
              <Button type="submit" disabled={loading} className="w-full h-12">Send Link</Button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Full Name</label>
                <div className="relative">
                  <input
                    type="text" required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#165b4c] outline-none pl-10 text-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Accountant Name"
                  />
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Email</label>
              <input
                type="email" required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#165b4c] outline-none text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase">Password</label>
                {!isSignUp && (
                  <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] font-bold text-[#165b4c] hover:underline">Forgot?</button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#165b4c] outline-none pr-12 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] md:text-xs font-bold animate-in zoom-in-95">
                <i className="fas fa-exclamation-circle mr-2"></i>{error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold rounded-xl shadow-lg">
              {loading ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : null}
              {isSignUp ? 'Establish Account' : 'Authenticate'}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400"><span className="bg-white px-2">Social Hub</span></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-3 transition-all text-sm shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
              Sign in with Google
            </button>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-medium">
                {isSignUp ? 'Already on staff?' : "New to the hub?"}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="ml-2 font-black text-[#165b4c] hover:underline"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
