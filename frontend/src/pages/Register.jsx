import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { register, reset } from "../redux/slices/authSlice";
import SecurePasswordInput from '../components/SecurePasswordInput';

// Frontend password strength check mirrors backend
const isStrongPassword = (password) => {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSymbol;
};

const isValidPhone = (value) => /^\d{10}$/.test(value);

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    shopName: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { name, email, password, confirmPassword, shopName, phone } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  const [validationError, setValidationError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    if (isSuccess || user) {
      navigate("/dashboard");
      dispatch(reset());
    }

    // Keep error visible; reset only on unmount
    return () => dispatch(reset());
  }, [user, isSuccess, navigate, dispatch]);

  const onChange = (e) => {
    const { name, value } = e.target;
    const nextValue =
      name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;

    setFormData((prevState) => ({
      ...prevState,
      [name]: nextValue,
    }));

    if (name === "phone") {
      if (nextValue.length > 0 && nextValue.length < 10) {
        setPhoneError("Mobile number cannot be less than 10 digits.");
      } else {
        setPhoneError("");
      }
    }

    setValidationError("");
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (!isValidPhone(phone)) {
      setValidationError("Phone number must be exactly 10 digits.");
      setPhoneError("Mobile number cannot be less than 10 digits.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    if (!isStrongPassword(password)) {
      setValidationError(
        "Password must be 8+ chars with uppercase, lowercase, number, and symbol."
      );
      return;
    }

    const userData = {
      name,
      email,
      password,
      shopName,
      phone,
    };

    dispatch(register(userData));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-indigo-600 rounded-2xl mb-4">
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className=" text-secondary mt-2">
            Start managing your billing today
          </p>
        </div>

        {/* Register Form Card */}
        <div className="bg-card rounded-2xl shadow-xl p-8">
          {(isError || validationError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">
                {validationError || message}
              </p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Name and Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Input */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium  text-secondary mb-2"
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={onChange}
                  required
                  className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2  focus:ring-primaryfocus:border-transparent transition"
                  placeholder="John Doe"
                />
              </div>

              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium  text-secondary mb-2"
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  required
                  className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2  focus:ring-primaryfocus:border-transparent transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Shop Name and Phone Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shop Name Input */}
              <div>
                <label
                  htmlFor="shopName"
                  className="block text-sm font-medium  text-secondary mb-2"
                >
                  Shop Name
                </label>
                <input
                  type="text"
                  id="shopName"
                  name="shopName"
                  value={shopName}
                  onChange={onChange}
                  className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2  focus:ring-primaryfocus:border-transparent transition"
                  placeholder="My Store"
                />
              </div>

              {/* Phone Input */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium  text-secondary mb-2"
                >
                  Phone Number
                </label>
                <div className="flex overflow-hidden rounded-xl border border-default bg-white dark:bg-slate-900 shadow-md focus-within:ring-2 focus-within:ring-indigo-400/70 focus-within:border-transparent transition">
                  <span className="px-3 py-3 bg-gradient-to-br from-indigo-600 to-indigo-500 text-white text-sm font-semibold flex items-center border-r border-indigo-500/30">
                    +91
                  </span>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={phone}
                    onChange={onChange}
                    inputMode="numeric"
                    pattern="\d{10}"
                    maxLength={10}
                    required
                    className="w-full px-4 py-3 bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 border-0 focus:ring-0"
                    placeholder="9876543210"
                  />
                </div>
                {phoneError && (
                  <p className="mt-2 text-sm text-red-600">{phoneError}</p>
                )}
              </div>
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium  text-secondary mb-2"
                >
                  Password *
                </label>
                <SecurePasswordInput
                  id="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  required
                  showPassword={showPassword}
                  onToggleVisibility={() => setShowPassword(!showPassword)}
                  placeholder="Min 8+ characters"
                  className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2  focus:ring-primaryfocus:border-transparent transition"
                />
              </div>

              {/* Confirm Password Input */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium  text-secondary mb-2"
                >
                  Confirm Password *
                </label>
                <SecurePasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  required
                  showPassword={showConfirmPassword}
                  onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2  focus:ring-primaryfocus:border-transparent transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2  focus:ring-primaryfocus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className=" text-secondary text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-600 font-medium hover:text-indigo-700 transition"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center  text-muted text-sm mt-8">
          By creating an account, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

export default Register;
