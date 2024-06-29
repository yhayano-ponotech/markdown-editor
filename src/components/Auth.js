import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { supabase } from '../utils/supabaseClient';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Link, 
  InputAdornment, 
  IconButton,
  Paper,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
});

const Auth = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const getErrorMessage = (error) => {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'The email or password you entered is incorrect. Please try again.';
      case 'User already registered':
        return 'An account with this email already exists. Please try logging in or use a different email.';
      case 'Email not confirmed':
        return 'Please confirm your email address before logging in. Check your inbox for a confirmation email.';
      case 'Rate limit exceeded':
        return 'Too many attempts. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage('');
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (error) {
        setErrorMessage(getErrorMessage(error));
      } else {
        setSignUpSuccess(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        setErrorMessage(getErrorMessage(error));
      } else {
        onLogin();
      }
    }
    
    setLoading(false);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  if (signUpSuccess) {
    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Sign Up Successful!
        </Typography>
        <Typography variant="body1" paragraph>
          Thank you for signing up. Please check your email to confirm your account.
        </Typography>
        <Button
          fullWidth
          variant="contained"
          onClick={() => {
            setSignUpSuccess(false);
            setIsSignUp(false);
          }}
        >
          Return to Login
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {isSignUp ? 'Sign Up' : 'Login'}
      </Typography>
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 400 }}>
          {errorMessage}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, width: '100%', maxWidth: 400 }}>
        <Controller
          name="email"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              {...field}
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              autoComplete="email"
              autoFocus
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
        />
        <Controller
          name="password"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              {...field}
              margin="normal"
              required
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          )}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login')}
        </Button>
        <Box sx={{ textAlign: 'center' }}>
          <Link
            component="button"
            variant="body2"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage('');
            }}
          >
            {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default Auth;