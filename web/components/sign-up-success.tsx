'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Mail, Clock, CheckCircle } from 'lucide-react';

export function SignUpSuccess() {
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // Get email from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }

    // Check for existing cooldown in localStorage
    const storedResendTime = localStorage.getItem('lastResendTime');
    if (storedResendTime) {
      const timeDiff = Date.now() - parseInt(storedResendTime);
      const remainingCooldown = Math.max(0, 60000 - timeDiff); // 60 seconds cooldown
      if (remainingCooldown > 0) {
        setResendCooldown(Math.ceil(remainingCooldown / 1000));
        setLastResendTime(parseInt(storedResendTime));
      }
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setLastResendTime(null);
            localStorage.removeItem('lastResendTime');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!email) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    setIsResending(true);
    setMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/subjects`,
        },
      });

      if (error) throw error;

      setMessage('Confirmation email sent successfully!');
      setMessageType('success');
      setLastResendTime(Date.now());
      localStorage.setItem('lastResendTime', Date.now().toString());
      setResendCooldown(60); // 60 seconds cooldown
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Failed to resend email');
      setMessageType('error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Check your email!</CardTitle>
          <CardDescription>
            We've sent a confirmation link to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Please check your email and click the confirmation link to activate your account.
              You can then sign in to start organizing your learning.
            </p>
          </div>

          {/* Email input and resend functionality */}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <Button
              onClick={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
                <>
                  <Mail className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend confirmation email
                </>
              )}
            </Button>

            {message && (
              <div className={`text-sm text-center ${
                messageType === 'success' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/auth/login">Go to Login</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
