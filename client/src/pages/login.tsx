import React, { useState, useEffect } from "react";
import { useSignIn, useAuth, useSignUp } from "@clerk/clerk-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";

export default function Login() {
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const { isSignedIn, getToken, signOut } = useAuth();
  const navigate = useNavigate();
  const { fetchProfile } = useUserStore();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(false);

  const checkRoleAndRedirect = async () => {
    setIsCheckingRole(true);
    try {
      const token = await getToken();
      if (!token) return;

      const role = await fetchProfile(token);
      if (!role) {
        const currentError = useUserStore.getState().error;
        if (currentError) {
          toast.error(currentError);
          await signOut();
          return;
        }
      }

      if (role === 'super_user') {
        navigate('/su', { replace: true });
      } else if (role === 'admin') {
        navigate('/', { replace: true });
      } else if (role === 'student' || role === 'user') {
        navigate('/c', { replace: true });
      }
    } catch (error) {
      console.error("Error checking role:", error);
      toast.error("Authentication failed. Please try again.");
      await signOut();
    } finally {
      setIsCheckingRole(false);
    }
  };

  // Redirect if already signed in
  useEffect(() => {
    if (isSignInLoaded && isSignedIn) {
      checkRoleAndRedirect();
    }
  }, [isSignInLoaded, isSignedIn]);

  // Loading state (prevent login flashing)
  if (!isSignInLoaded || !isSignUpLoaded || (isSignedIn && isCheckingRole)) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#020617]">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    if (!isSignInLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/login",
      });
    } catch (err: any) {
      console.error("Google Sign In Error:", err);
      toast.error(err.errors?.[0]?.message || "Failed to start Google Sign In");
    }
  };

  // Handle Email Submission (Step 1)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded || !email) return;
    setIsLoading(true);

    try {
      // 1. Try to Sign In
      try {
        const { supportedFirstFactors } = await signIn.create({ identifier: email });
        const emailCodeFactor = supportedFirstFactors?.find(f => f.strategy === "email_code");

        if (emailCodeFactor) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailCodeFactor.emailAddressId,
          });
          setStep('otp');
          return; // Exit here if user exists
        }
      } catch (err: any) {
        // 2. If user doesn't exist, start Sign Up instead
        if (err.errors?.[0]?.code === "form_identifier_not_found") {
          // We can safely use signUp because isSignUpLoaded is true
          await signUp!.create({ emailAddress: email });
          await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
          setStep('otp');
          toast.info("Creating a new account...");
          return;
        }
        throw err;
      }
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || "Error during authentication");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP Submission (Step 2)
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded || !otp) return;

    setIsLoading(true);
    try {
      // 1. Check if we are in a Sign-Up flow (New User)
      if (signUp && signUp.status === "missing_requirements") {
        const result = await signUp.attemptEmailAddressVerification({
          code: otp,
        });

        if (result.status === "complete") {
          console.log("Session created:", result.createdSessionId);
          await setActive({ session: result.createdSessionId });
          await checkRoleAndRedirect();
          return;
        } else {
          console.log("Status is:", result.status);
          console.log("Missing fields:", result.missingFields);
        }
      }

      // 2. Check if we are in a Sign-In flow (Existing User)
      if (signIn && signIn.status === "needs_first_factor") {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: otp,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          toast.success("Signed in successfully!");
          await checkRoleAndRedirect();
          return;
        }
      }

      // If we reach here, something is incomplete
      toast.error("Verification incomplete. Please check the code.");

    } catch (err: any) {
      console.error("OTP Verification Error:", err);
      toast.error(err.errors?.[0]?.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#020617] text-white p-4 font-sans relative overflow-hidden">
      {/* Simple Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            Fee<span className="text-blue-500">2</span>Flow
          </h1>
          <p className="text-slate-400 text-sm">Frictionless payments for modern institutions.</p>
        </div>

        {/* Card */}
        <div className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/50">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-1">
              {step === 'email' ? 'Welcome Back' : 'Verify Email'}
            </h2>
            <p className="text-slate-400 text-sm">
              {step === 'email'
                ? 'Please enter your email to access your account.'
                : `Enter the 6-digit code sent to ${email}`
              }
            </p>
          </div>

          <form onSubmit={step === 'email' ? handleEmailSubmit : handleOtpSubmit} className="flex flex-col gap-5">
            {step === 'email' && (
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-300">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="name@company.com"
                    required
                    autoFocus
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-slate-500 text-[20px]">mail</span>
                </div>
              </div>
            )}

            {step === 'otp' && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="otp" className="text-sm font-medium text-slate-300">Verification Code</label>
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Change Email
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all tracking-widest text-center text-lg font-mono"
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-slate-500 text-[20px]">lock</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  {step === 'email' ? 'Continue with Email' : 'Verify Code'}
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0f172a] px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-[#1e293b] border border-slate-700 hover:bg-[#334155] text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>

          {step === 'otp' && (
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Didn't receive the code?{' '}
                <button
                  onClick={handleEmailSubmit}
                  disabled={isLoading}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
                >
                  Resend
                </button>
              </p>
            </div>
          )}

          {/* {step === 'email' && (
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Don't have an account?{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Get Started</a>
              </p>
            </div>
          )} */}
        </div>

        {/* Footer Security */}
        <div className="mt-8 flex items-center justify-center gap-6 text-slate-500 text-xs font-medium tracking-wide">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            BANK-GRADE SECURITY
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            REAL-TIME SETTLEMENT
          </div>
        </div>
      </div>
    </div>
  );
}