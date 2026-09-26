import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import axios from '../../services/apiClient'
import { useAuth } from '../../hooks/useAuth' // Add this import

const RegisterForm = () => {
  const navigate = useNavigate()
  const { login } = useAuth() // Add this line
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const validateField = (name, value) => {
    let newErrors = { ...errors }

    switch (name) {
      case 'name':
        if (!value) {
          newErrors.name = 'Full Name is required'
        } else {
          delete newErrors.name
        }
        break
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!value) {
          newErrors.email = 'Email is required'
        } else if (!emailRegex.test(value)) {
          newErrors.email = 'Please enter a valid email address'
        } else {
          delete newErrors.email
        }
        break
      }
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required'
        } else if (value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters'
        } else {
          delete newErrors.password
        }
        break
      case 'confirmPassword':
        if (value && value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match'
        } else {
          delete newErrors.confirmPassword
        }
        break
      default:
        break
    }

    setErrors(newErrors)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    validateField(name, value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(errors).length > 0) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    try {
      setLoading(true);
      const { name, email, password } = formData;
      const registerData = { name, email, password };
      const response = await axios.post('/auth/register', registerData);

      if (response.data.token) {
        login(response.data.user, response.data.token);
        toast.success('Registration successful!');
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return ''
    if (password.length < 6) return 'weak'
    if (password.length < 8) return 'medium'
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return 'strong'
    return 'medium'
  }

  return (
    <div className="auth-form-wrap">
      <div className="auth-form-intro"><span className="auth-kicker">Start your workspace</span><h1>Create your account</h1><p>A calmer system for your most important ideas.</p></div>
      <form onSubmit={handleSubmit} className="auth-form">
        <div>
          <label htmlFor="name" className="auth-label">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder = "Username"
            value={formData.name}
            onChange={handleChange}
            className={`auth-input ${
              errors.name
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary focus:ring-primary'
            }`}
            required
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="auth-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Email id"
            value={formData.email}
            onChange={handleChange}
            className={`auth-input ${
              errors.email
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary focus:ring-primary'
            }`}
            required
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="auth-label">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`auth-input pr-10 ${
                errors.password
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-primary focus:ring-primary'
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="auth-eye absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {formData.password && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      getPasswordStrength(formData.password) === 'weak' ? 'w-1/3 bg-red-500' :
                      getPasswordStrength(formData.password) === 'medium' ? 'w-2/3 bg-yellow-500' :
                      'w-full bg-green-500'
                    }`}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {getPasswordStrength(formData.password).charAt(0).toUpperCase() +
                   getPasswordStrength(formData.password).slice(1)}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Password should be at least 8 characters with uppercase & numbers
              </div>
            </div>
          )}
          {errors.password && (
            <p className="mt-1 text-sm text-red-500 animate-fadeIn">{errors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="auth-label">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`auth-input pr-10 mb-2 ${
                errors.confirmPassword
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-primary focus:ring-primary'
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="auth-eye absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || Object.keys(errors).length > 0}
          className="auth-submit w-full transition duration-300 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p className="auth-foot">
        Already have an account?{' '}
        <Link to="/auth/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default RegisterForm