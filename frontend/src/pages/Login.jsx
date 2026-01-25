import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login, reset } from '../redux/slices/authSlice';
import DeviceConflictModal from '../components/DeviceConflictModal';
import SecurePasswordInput from '../components/SecurePasswordInput';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const { email, password } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message, deviceConflict } = useSelector(
    (state) => state.auth
  );

  const [showConflictModal, setShowConflictModal] = useState(false);

  useEffect(() => {
    if (isSuccess || user) {
      navigate('/dashboard');
    }

    // Cleanup: reset only on unmount
    return () => dispatch(reset());
  }, [user, isSuccess, navigate, dispatch]);

  useEffect(() => {
    if (deviceConflict) {
      setShowConflictModal(true);
    }
  }, [deviceConflict]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[rgb(var(--color-bg))] dark:to-[rgb(var(--color-card))] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-indigo-600 dark:bg-[rgb(var(--color-primary))] rounded-2xl mb-4">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold  text-main dark:text-[rgb(var(--color-text))]">Welcome Back</h1>
          <p className=" text-secondary dark:text-[rgb(var(--color-text-secondary))] mt-2">Sign in to your billing account</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-2xl shadow-xl dark:shadow-2xl p-8 border dark:border-[rgb(var(--color-border))]">
          {isError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{message}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium  text-secondary dark:text-[rgb(var(--color-text))] mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-[rgb(var(--color-border))] bg-white dark:bg-[rgb(var(--color-input))]  text-main dark:text-[rgb(var(--color-text))] rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[rgb(var(--color-primary))] focus:border-transparent transition placeholder:text-gray-400 dark:placeholder:text-[rgb(var(--color-placeholder))]"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium  text-secondary dark:text-[rgb(var(--color-text))] mb-2"
              >
                Password
              </label>
              <SecurePasswordInput
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                required
                showPassword={showPassword}
                onToggleVisibility={() => setShowPassword(!showPassword)}
                placeholder="Enter your password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 dark:bg-[rgb(var(--color-primary))] text-white py-3 rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-primary-hover))] focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2 dark:focus:ring-offset-[rgb(var(--color-card))] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <p className=" text-secondary dark:text-[rgb(var(--color-text-secondary))] text-sm">
              <Link
                to="/forgot-password"
                className="text-indigo-600 dark:text-[rgb(var(--color-primary))] font-medium hover:text-indigo-700 dark:hover:text-[rgb(var(--color-primary-hover))] transition"
              >
                Forgot Password?
              </Link>
            </p>
            <p className=" text-secondary dark:text-[rgb(var(--color-text-secondary))] text-sm">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-indigo-600 dark:text-[rgb(var(--color-primary))] font-medium hover:text-indigo-700 dark:hover:text-[rgb(var(--color-primary-hover))] transition"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center  text-muted dark:text-[rgb(var(--color-text-muted))] text-sm mt-8">
          Secure billing management for your business
        </p>
      </div>

      {/* Device Conflict Modal */}
      {showConflictModal && (
        <DeviceConflictModal
          email={email}
          password={password}
          onClose={() => setShowConflictModal(false)}
        />
      )}
    </div>
  );
};

export default Login;