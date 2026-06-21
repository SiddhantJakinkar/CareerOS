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

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      setAuth(res.data.data.user, res.data.data.accessToken, res.data.data.refreshToken);
      toast.success('Welcome back!');
      navigate(res.data.data.user.onboardingCompleted ? '/dashboard' : '/onboarding');
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
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
              <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
              <Button type="submit" className="w-full" loading={loading}>
                Sign In
              </Button>
            </form>
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
