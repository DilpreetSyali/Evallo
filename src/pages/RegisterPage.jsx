import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { authAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors }, watch } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await authAPI.register(data)
      setAuth(res.data.data)
      toast.success('Organisation registered successfully!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ name, label, type = 'text', placeholder, rules, colSpan = '' }) => (
    <div className={colSpan}>
      <label className="label">{label}</label>
      <input type={type} className="input" placeholder={placeholder}
        {...register(name, rules)} />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl shadow-lg mb-4">
            <BuildingOfficeIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your organisation</h1>
          <p className="text-gray-500 text-sm mt-1">Set up your HRMS workspace</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Organisation Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field name="orgName" label="Organisation Name" placeholder="Acme Corp"
                  colSpan="col-span-2"
                  rules={{ required: 'Organisation name is required' }} />
                <Field name="orgEmail" label="Organisation Email" type="email" placeholder="info@company.com"
                  colSpan="col-span-2"
                  rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } }} />
                <Field name="orgIndustry" label="Industry" placeholder="Technology" colSpan="col-span-2" />
              </div>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Admin Account</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field name="name" label="Full Name" placeholder="Jane Smith"
                  colSpan="col-span-2"
                  rules={{ required: 'Name is required' }} />
                <Field name="email" label="Email" type="email" placeholder="jane@company.com"
                  colSpan="col-span-2"
                  rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } }} />
                <Field name="password" label="Password" type="password" placeholder="Min 8 chars, upper+lower+number"
                  colSpan="col-span-2"
                  rules={{
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Min 8 characters' },
                    pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must contain uppercase, lowercase, and number' }
                  }} />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? 'Creating organisation…' : 'Create Organisation'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}