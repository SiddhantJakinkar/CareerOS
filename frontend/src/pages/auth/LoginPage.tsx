import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/services/endpoints';
import { useAuthStore } from '@/store';
import { getErrorMessage } from '@/services/api';
import type { User } from '@/types';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

const twoFactorSchema = z.object({
  code: z.string().length(6, 'Enter 6-digit code'),
});

type FormData = z.infer<typeof schema>;
type TwoFactorData = z.infer<typeof twoFactorSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [twoFactor, setTwoFactor] = useState<{ token: string; user: User } | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const twoFactorForm = useForm<TwoFactorData>({
    resolver: zodResolver(twoFactorSchema),
  });

  const finishLogin = (user: User, accessToken?: string, csrfToken?: string) => {
    if (!accessToken) {
      toast.error('Login failed — no access token');
      return;
    }
    setAuth(user, accessToken, csrfToken);
    toast.success('Welcome back!');
    navigate(user.onboardingCompleted ? '/dashboard' : '/onboarding');
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      const payload = res.data.data;
      if (payload.requiresTwoFactor && payload.twoFactorToken) {
        setTwoFactor({ token: payload.twoFactorToken, user: payload.user });
        toast.message('Enter your authenticator code');
        return;
      }
      finishLogin(payload.user, payload.accessToken, payload.csrfToken);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const onTwoFactor = async (data: TwoFactorData) => {
    if (!twoFactor) return;
    setLoading(true);
    try {
      const res = await authApi.verifyTwoFactor({
        twoFactorToken: twoFactor.token,
        code: data.code,
      });
      const payload = res.data.data;
      finishLogin(payload.user, payload.accessToken, payload.csrfToken);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome to CareerOS</h1>
          <p className="mt-2 text-text-muted">Your AI-powered placement copilot</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{twoFactor ? 'Two-Factor Authentication' : 'Sign In'}</CardTitle>
            <CardDescription>
              {twoFactor ? 'Enter the code from your authenticator app' : 'Enter your credentials to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {twoFactor ? (
              <form onSubmit={twoFactorForm.handleSubmit(onTwoFactor)} className="space-y-4">
                <Input
                  label="Authenticator code"
                  inputMode="numeric"
                  maxLength={6}
                  error={twoFactorForm.formState.errors.code?.message}
                  {...twoFactorForm.register('code')}
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Verify & Sign In
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setTwoFactor(null)}>
                  Back
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
                <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
                <Button type="submit" className="w-full" loading={loading}>
                  Sign In
                </Button>
              </form>
            )}
            <p className="mt-6 text-center text-sm text-text-muted">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
