import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Lock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Alert } from '../components/ui';

const ILLINOIS_DOMAIN = 'illinois.edu';

const isValidIllinoisEmail = (email: string): boolean =>
  email.toLowerCase().endsWith(`@${ILLINOIS_DOMAIN}`);

const Login = () => {
  const [email, setEmail] = useState('');
  const [emailValid, setEmailValid] = useState(true);
  const [linkSent, setLinkSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [apiError, setApiError] = useState('');
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);
  const [isSubmittingMagicLink, setIsSubmittingMagicLink] = useState(false);
  const navigate = useNavigate();

  const {
    signInWithGoogle,
    signInWithIllinoisEmail,
    isAuthenticated,
    isLoading,
  } = useAuth();

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => setCooldown(prev => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim().toLowerCase();
    setEmail(value);
    setLinkSent(false);

    if (!value) {
      setEmailValid(true);
      setApiError('');
      return;
    }

    const valid = isValidIllinoisEmail(value);
    setEmailValid(valid);
    setApiError(
      valid ? '' : `Only @${ILLINOIS_DOMAIN} email addresses are allowed.`
    );
  };

  const handleGoogleSignIn = async () => {
    setLinkSent(false);
    setApiError('');
    setIsSubmittingGoogle(true);

    try {
      await signInWithGoogle();
      // Redirect is handled by Supabase callback + AuthContext
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Google sign in failed. Please try again.'
      );
    } finally {
      setIsSubmittingGoogle(false);
    }
  };

  const handleMagicLinkSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setApiError('');
    setLinkSent(false);

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidIllinoisEmail(normalizedEmail)) {
      setEmailValid(false);
      setApiError(`Only @${ILLINOIS_DOMAIN} email addresses are allowed.`);
      return;
    }

    if (cooldown > 0) {
      setApiError('Please wait before requesting another magic link.');
      return;
    }

    setIsSubmittingMagicLink(true);
    try {
      await signInWithIllinoisEmail(normalizedEmail);
      setLinkSent(true);
      setCooldown(30);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Failed to send magic link. Please try again.'
      );
    } finally {
      setIsSubmittingMagicLink(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Illinois Sign In
            </h1>
            <p className="text-neutral-600">
              Use your <span className="font-semibold">@illinois.edu</span>{' '}
              account to access EntreBot
            </p>
          </div>

          {apiError && (
            <Alert
              variant="error"
              className="mb-6"
              onClose={() => setApiError('')}
            >
              {apiError}
            </Alert>
          )}

          <div className="space-y-4">
            <Button
              type="button"
              variant="primary"
              className="w-full"
              isLoading={isSubmittingGoogle}
              disabled={isSubmittingGoogle || isSubmittingMagicLink}
              onClick={handleGoogleSignIn}
            >
              Sign in with Google
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-500">
                  or use email magic link
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@illinois.edu"
              value={email}
              onChange={handleEmailChange}
              error={!emailValid && email ? 'Please use @illinois.edu' : ''}
              leftIcon={<Mail className="h-4 w-4" />}
              autoComplete="email"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmittingMagicLink}
              disabled={
                isSubmittingMagicLink ||
                isSubmittingGoogle ||
                !emailValid ||
                cooldown > 0
              }
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Magic Link'}
            </Button>
          </form>

          {linkSent && (
            <Alert variant="success" className="mt-4">
              Magic link sent to <span className="font-semibold">{email}</span>.
              Check your inbox to continue.
            </Alert>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">No Separate Registration</p>
                <p className="text-blue-700">
                  EntreBot now uses Illinois authentication only. Sign in with
                  Google or an Illinois magic link.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="flex items-start gap-2 text-sm text-neutral-700">
              <Lock className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                Access is restricted to users with an{' '}
                <span className="font-semibold">@{ILLINOIS_DOMAIN}</span> email
                address.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
