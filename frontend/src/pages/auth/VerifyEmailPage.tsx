import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';
import { authApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  useEffect(() => {
    if (status === 'success') toast.success('Email verified!');
    if (status === 'error' && token) toast.error(getErrorMessage(new Error('Verification failed')));
  }, [status, token]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && <p className="text-text-muted">Verifying your email…</p>}
          {status === 'success' && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <p>Your email has been verified. You can sign in now.</p>
              <Button asChild className="w-full">
                <Link to="/login">Go to Sign In</Link>
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <p>Invalid or expired verification link.</p>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/login">Back to Sign In</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
