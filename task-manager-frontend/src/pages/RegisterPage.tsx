import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authApi } from '../services/api';
import { setAuth } from '../lib/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  name?: string;
  lastname?: string;
  email?: string;
  password?: string;
}

export function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', lastname: '', email: '', password: '' });
  const [touched, setTouched] = useState({ name: false, lastname: false, email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = (): FormErrors => {
    const errors: FormErrors = {};
    if (!form.name.trim() || form.name.trim().length < 2) errors.name = 'Mínimo 2 caracteres';
    if (!form.lastname.trim() || form.lastname.trim().length < 2) errors.lastname = 'Mínimo 2 caracteres';
    if (!EMAIL_REGEX.test(form.email)) errors.email = 'Email no válido';
    if (form.password.length < 6) errors.password = 'Mínimo 6 caracteres';
    return errors;
  };

  const errors = validate();
  const isValid = Object.keys(errors).length === 0;

  const field = (name: keyof typeof form) => ({
    value: form[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [name]: e.target.value }));
      setApiError('');
    },
    onBlur: () => setTouched((prev) => ({ ...prev, [name]: true })),
    error: touched[name] ? errors[name] : undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, lastname: true, email: true, password: true });
    if (!isValid) return;

    setSubmitting(true);
    setApiError('');
    try {
      await authApi.register(form);
      const { user, token } = await authApi.login(form.email, form.password);
      setAuth(user, token);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al crear la cuenta';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
            <p className="text-gray-500 mt-2">Completa los datos para registrarte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute left-3 top-[2.15rem] pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  label="Nombre"
                  placeholder="Ana"
                  className="pl-10"
                  {...field('name')}
                />
              </div>
              <div className="relative">
                <div className="absolute left-3 top-[2.15rem] pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  label="Apellido"
                  placeholder="García"
                  className="pl-10"
                  {...field('lastname')}
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-3 top-[2.15rem] pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                className="pl-10"
                {...field('email')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10 pr-10"
                  value={form.password}
                  onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setApiError(''); }}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  error={touched.password ? errors.password : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {apiError && (
              <p className="text-sm text-red-500 text-center">{apiError}</p>
            )}

            <Button type="submit" disabled={submitting} className="w-full mt-2">
              {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
