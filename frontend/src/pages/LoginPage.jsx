import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

import AuthLayout from '../components/layout/AuthLayout';
import Input from '../components/ui/Input';
import PasswordInput from '../components/ui/PasswordInput';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

import { validateEmail } from '../utils/validators';
import authService from '../services/authService';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setApiError('');

    try {
      const payload = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
      };

      const response = await authService.login(payload);

      
      const accessToken = response.accessToken;
      const refreshToken = response.refreshToken;
      const userData = {
        role: response.role,
        fullName: response.fullName,
      };

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', userId);
      localStorage.setItem('fullName', fullName);
      localStorage.setItem('role', role);
     
      login(userData, accessToken,  refreshToken); 

      toast.success('Welcome back!', {
        duration: 3000,
        style: {
          background: '#F0FDF4',
          color: '#15803D',
          border: '1px solid #BBF7D0',
        },
      });
       window.location.reload();
       switch (response.role) {
       case "ADMIN":
        navigate("/admin");
        break;

       case "EMPLOYEE":
        navigate("/employee");
        break;

        case "FINANCE":
        navigate("/finance");
        break;

        case "MANAGER":
        navigate("/manager");
        break;

    case "PROCUREMENT":
        navigate("/procurement");
        break;

    case "SUPPLIER":
        navigate("/supplier");
        break;

    default:
        navigate("/login");
   }
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Invalid email or password. Please try again.';

      setApiError(message);

      toast.error('Login failed', {
        style: {
          background: '#FEF2F2',
          color: '#B91C1C',
          border: '1px solid #FECACA',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your procurement account to continue."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* API error */}
        {apiError && (
          <Alert
            type="error"
            dismissible
            onDismiss={() => setApiError('')}
          >
            {apiError}
          </Alert>
        )}

        {/* Email */}
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          icon={Mail}
          required
          autoComplete="email"
          {...register('email', { validate: validateEmail })}
          error={errors.email?.message}
        />

        {/* Password */}
        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          icon={Lock}
          required
          autoComplete="current-password"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          })}
          error={errors.password?.message}
        />

        {/* Remember Me + Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              {...register('rememberMe')}
            />
            <span className="text-sm text-slate-600">Remember me</span>
          </label>

          <button
            type="button"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
            onClick={() =>
              toast('Password reset functionality coming soon!', {
                icon: '🔒',
                style: {
                  background: '#F0F9FF',
                  color: '#0C4A6E',
                  border: '1px solid #BAE6FD',
                },
              })
            }
          >
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          leftIcon={<LogIn className="h-4 w-4" />}
        >
          Sign In
        </Button>

        {/* Register link */}
        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
