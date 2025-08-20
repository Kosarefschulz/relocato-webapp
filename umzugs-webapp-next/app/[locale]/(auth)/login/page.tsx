'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Divider,
  Container,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { useToast } from '@/components/ui/Toaster';
import NextLink from 'next/link';

export default function LoginPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { addToast } = useToast();
  const t = useTranslations('common');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!supabase) {
        throw new Error('Supabase nicht initialisiert');
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        addToast({
          type: 'success',
          title: 'Erfolgreich angemeldet',
          message: `Willkommen zurück, ${data.user.email}!`,
        });
        
        // Redirect to dashboard
        router.push(`/${locale}/dashboard`);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      let errorMessage = 'Anmeldung fehlgeschlagen';
      
      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'Ungültige E-Mail oder Passwort';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'Bitte bestätigen Sie Ihre E-Mail-Adresse';
      }
      
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Anmeldung fehlgeschlagen',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase nicht initialisiert');
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/${locale}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Google login error:', err);
      addToast({
        type: 'error',
        title: 'Google-Anmeldung fehlgeschlagen',
        message: err.message,
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h3" component="h1" sx={{ mb: 1, fontWeight: 700 }}>
                Relocato CRM
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Melden Sie sich in Ihrem Account an
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="E-Mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                disabled={loading}
              />
              
              <TextField
                fullWidth
                label="Passwort"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                disabled={loading}
              />

              <LoadingButton
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                loading={loading}
                sx={{ mb: 2, py: 1.5 }}
              >
                Anmelden
              </LoadingButton>
            </form>

            <Divider sx={{ my: 3 }}>oder</Divider>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleGoogleLogin}
              disabled={loading}
              sx={{ mb: 3, py: 1.5 }}
            >
              Mit Google anmelden
            </Button>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Noch kein Account?{' '}
                <NextLink href={`/${locale}/register`} passHref>
                  <Link component="span" sx={{ fontWeight: 600 }}>
                    Hier registrieren
                  </Link>
                </NextLink>
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <NextLink href={`/${locale}/forgot-password`} passHref>
                  <Link component="span">
                    Passwort vergessen?
                  </Link>
                </NextLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}