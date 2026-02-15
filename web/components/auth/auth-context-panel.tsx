'use client';

import {
  BookOpen,
  CheckCircle2,
  Lock,
  Mail,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';

type AuthContextVariant =
  | 'login'
  | 'sign-up'
  | 'forgot-password'
  | 'update-password'
  | 'success'
  | 'error';

interface AuthContextPanelProps {
  variant: AuthContextVariant;
}

export function AuthContextPanel({ variant }: AuthContextPanelProps) {
  return (
    <div className="auth-context-panel">
      {/* Floating background elements */}
      <div
        className="auth-float-1 w-32 h-32 bg-amber-400/20 dark:bg-amber-600/10"
        style={{ top: '10%', left: '15%' }}
      />
      <div
        className="auth-float-2 w-24 h-24 bg-orange-400/20 dark:bg-orange-600/10"
        style={{ top: '60%', right: '20%' }}
      />
      <div
        className="auth-float-3 w-20 h-20 bg-rose-400/20 dark:bg-rose-600/10"
        style={{ bottom: '20%', left: '25%' }}
      />

      {/* Content */}
      <div className="auth-context-inner">
        {variant === 'login' && <LoginContent />}
        {variant === 'sign-up' && <SignUpContent />}
        {variant === 'forgot-password' && <ForgotPasswordContent />}
        {variant === 'update-password' && <UpdatePasswordContent />}
        {variant === 'success' && <SuccessContent />}
        {variant === 'error' && <ErrorContent />}
      </div>
    </div>
  );
}

function LoginContent() {
  return (
    <>
      <div className="auth-context-section-amber">
        <div className="flex items-center gap-3 mb-4">
          <div className="landing-icon-box bg-amber-500/10 dark:bg-amber-500/20">
            <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Welcome Back
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Pick up right where you left off with your personalized learning
          journey.
        </p>
        <div className="auth-feature-list">
          <div className="auth-feature-item">
            <BookOpen className="auth-feature-icon text-amber-600 dark:text-amber-400" />
            <span>Access all your subjects and problem sets</span>
          </div>
          <div className="auth-feature-item">
            <TrendingUp className="auth-feature-icon text-amber-600 dark:text-amber-400" />
            <span>Track your mastery progress over time</span>
          </div>
          <div className="auth-feature-item">
            <Zap className="auth-feature-icon text-amber-600 dark:text-amber-400" />
            <span>Review problems marked for practice</span>
          </div>
        </div>
      </div>
    </>
  );
}

function SignUpContent() {
  return (
    <>
      <div className="auth-context-section-orange">
        <div className="flex items-center gap-3 mb-4">
          <div className="landing-icon-box bg-orange-500/10 dark:bg-orange-500/20">
            <Sparkles className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Start Learning Smarter
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Join students who are turning their mistakes into mastery.
        </p>
        <div className="auth-feature-list">
          <div className="auth-feature-item">
            <BookOpen className="auth-feature-icon text-orange-600 dark:text-orange-400" />
            <span>Never lose track of wrong answers again</span>
          </div>
          <div className="auth-feature-item">
            <TrendingUp className="auth-feature-icon text-orange-600 dark:text-orange-400" />
            <span>See your improvement with visual progress</span>
          </div>
          <div className="auth-feature-item">
            <CheckCircle2 className="auth-feature-icon text-orange-600 dark:text-orange-400" />
            <span>Build confidence through targeted review</span>
          </div>
        </div>
      </div>
    </>
  );
}

function ForgotPasswordContent() {
  return (
    <>
      <div className="auth-context-section-rose">
        <div className="flex items-center gap-3 mb-4">
          <div className="landing-icon-box bg-rose-500/10 dark:bg-rose-500/20">
            <Mail className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Reset Your Password
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Follow these simple steps to regain access to your account:
        </p>
        <div className="auth-feature-list">
          <div className="auth-feature-item">
            <span className="landing-step-label text-rose-600 dark:text-rose-400">
              Step 1
            </span>
            <span>Enter your email address</span>
          </div>
          <div className="auth-feature-item">
            <span className="landing-step-label text-rose-600 dark:text-rose-400">
              Step 2
            </span>
            <span>Check your inbox for reset link</span>
          </div>
          <div className="auth-feature-item">
            <span className="landing-step-label text-rose-600 dark:text-rose-400">
              Step 3
            </span>
            <span>Create a new secure password</span>
          </div>
        </div>
      </div>
    </>
  );
}

function UpdatePasswordContent() {
  return (
    <>
      <div className="auth-context-section-amber">
        <div className="flex items-center gap-3 mb-4">
          <div className="landing-icon-box bg-amber-500/10 dark:bg-amber-500/20">
            <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Secure Your Account
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Create a strong password to protect your learning data:
        </p>
        <div className="auth-feature-list">
          <div className="auth-feature-item">
            <Lock className="auth-feature-icon text-amber-600 dark:text-amber-400" />
            <span>Use at least 8 characters</span>
          </div>
          <div className="auth-feature-item">
            <Lock className="auth-feature-icon text-amber-600 dark:text-amber-400" />
            <span>Mix letters, numbers, and symbols</span>
          </div>
          <div className="auth-feature-item">
            <Lock className="auth-feature-icon text-amber-600 dark:text-amber-400" />
            <span>Avoid common words or patterns</span>
          </div>
        </div>
      </div>
    </>
  );
}

function SuccessContent() {
  return (
    <>
      <div className="auth-context-section-green">
        <div className="flex items-center gap-3 mb-4">
          <div className="landing-icon-box bg-green-500/10 dark:bg-green-500/20">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            You're Almost There!
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Complete these steps to start your learning journey:
        </p>
        <div className="auth-feature-list">
          <div className="auth-feature-item">
            <span className="landing-step-label text-green-600 dark:text-green-400">
              Step 1
            </span>
            <span>Check your email inbox</span>
          </div>
          <div className="auth-feature-item">
            <span className="landing-step-label text-green-600 dark:text-green-400">
              Step 2
            </span>
            <span>Click the verification link</span>
          </div>
          <div className="auth-feature-item">
            <span className="landing-step-label text-green-600 dark:text-green-400">
              Step 3
            </span>
            <span>Start adding your first problems</span>
          </div>
        </div>
      </div>
    </>
  );
}

function ErrorContent() {
  return (
    <>
      <div className="auth-context-section-red">
        <div className="flex items-center gap-3 mb-4">
          <div className="landing-icon-box bg-red-500/10 dark:bg-red-500/20">
            <RefreshCw className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Troubleshooting Help
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          If you're experiencing issues, try these steps:
        </p>
        <div className="auth-feature-list">
          <div className="auth-feature-item">
            <RefreshCw className="auth-feature-icon text-red-600 dark:text-red-400" />
            <span>Clear your browser cache and cookies</span>
          </div>
          <div className="auth-feature-item">
            <RefreshCw className="auth-feature-icon text-red-600 dark:text-red-400" />
            <span>Check your internet connection</span>
          </div>
          <div className="auth-feature-item">
            <RefreshCw className="auth-feature-icon text-red-600 dark:text-red-400" />
            <span>Try a different browser or incognito mode</span>
          </div>
        </div>
      </div>
    </>
  );
}
