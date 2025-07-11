import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUser, FaPhone } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import './register.css'
// import logo from '../../images/logo.jpg'
// import wave from '../../images/Style-Inscription.png'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { JSX, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setUser } from '../../redux/slice/userSlice'
import { useNavigate } from 'react-router-dom'
import deco2 from '../../images/deco/2.png'

function Register(): JSX.Element {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()

  const ValidationSchema = yup.object({
    name: yup.string().required('Nom requis'),
    surname: yup.string().required('Prénom requis'),
    email: yup.string().email('Email invalide').required('Veuillez entrer votre email'),
    password: yup.string().min(6, 'Au moins 6 caractères').required('Mot de passe requis'),
    passwordConfirm: yup
      .string()
      .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas')
      .required('Veuillez confirmer votre mot de passe'),
    phone: yup
      .string()
      .matches(/^\+?\d{9,15}$/, 'Numéro de téléphone invalide')
      .required('Numéro de téléphone requis')
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({ resolver: yupResolver(ValidationSchema) })

  const dispatch = useDispatch()
  const onSubmit = (data: any) => {
    dispatch(setUser({ name: data.name}))
    console.log(data)
    navigate('/home')

    reset()
  }

  return (
    <div className="flex h-screen bg-white">
      <div className="w-1/2 bg-[#2F855A] text-white flex flex-col justify-center items-start pl-20 pr-10">
        <div className="mb-6 flex items-center gap-3">
          <FaUser size={45} className="text-white" />
          <h1 className="text-3xl font-extrabold tracking-wide">Espace Admin</h1>
        </div>
        <p className="text-lg leading-relaxed max-w-md">
          Créez votre compte administrateur pour gérer les utilisateurs et superviser les activités
          de tri.
        </p>
        <p className="mt-4 text-sm text-green-100 italic">* Accès réservé aux administrateurs.</p>
      </div>

      <div className="w-1/2 relative flex items-center justify-center overflow-hidden">
        <div className="absolute bg-[#6a2e3e] clip-trapeze2"></div>
        <div className="relative z-10 w-full max-w-md p-10 text-white">
          <h2 className="text-4xl font-bold text-center mb-8  text-[#2F855A]">Inscription</h2>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex gap-6">
              <div className="relative flex-1 flex flex-col">
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2F855A]" />
                  <input
                    type="text"
                    className={`bg-white text-black w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-[#2F855A] transition-all duration-300 outline-none ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Nom"
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <motion.p
                    className="text-sm text-red-400 mt-1"
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errors.name.message}
                  </motion.p>
                )}
              </div>

              <div className="relative flex-1 flex flex-col">
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2F855A]" />
                  <input
                    type="text"
                    className={`bg-white text-black w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-[#2F855A] transition-all duration-300 outline-none ${errors.surname ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Prénom"
                    {...register('surname')}
                  />
                </div>
                {errors.surname && (
                  <motion.p
                    className="text-sm text-red-400 mt-1"
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errors.surname.message}
                  </motion.p>
                )}
              </div>
            </div>

            <div className="relative flex flex-col">
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2F855A]" />
                <input
                  type="email"
                  className={`bg-white text-black w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-[#2F855A] transition-all duration-300 outline-none ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Votre e-mail"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <motion.p
                  className="text-sm text-red-400 mt-1"
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            <div className="relative flex flex-col">
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2F855A]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`bg-white text-black w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-[#2F855A] transition-all duration-300 outline-none ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Votre mot de passe"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#2F855A]"
                  onClick={() => setShowPassword((showPassword) => !showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  className="text-sm text-red-400 mt-1"
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            <div className="relative flex flex-col">
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2F855A]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`bg-white text-black w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-[#2F855A] transition-all duration-300 outline-none ${errors.passwordConfirm ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Confirmer le mot de passe"
                  {...register('passwordConfirm')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#2F855A]"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.passwordConfirm && (
                <motion.p
                  className="text-sm text-red-400 mt-1"
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.passwordConfirm.message}
                </motion.p>
              )}
            </div>

            <div className="relative flex flex-col">
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2F855A]" />
                <input
                  type="tel"
                  className={`bg-white text-black w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-[#2F855A] transition-all duration-300 outline-none ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Numéro de téléphone (+261...)"
                  {...register('phone')}
                />
              </div>
              {errors.phone && (
                <motion.p
                  className="text-sm text-red-400 mt-1"
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.phone.message}
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#2F855A] text-white p-3 rounded-lg hover:bg-[#276749] transition duration-300 font-medium"
            >
              S'inscrire
            </button>

            <div className="mt-3 text-[#2F855A]  flex justify-center">
              <p>Vous avez déjà un compte?</p>
              <Link to="/" className=" text-[#2F855A]  font-semibold hover:underline ml-2">
                Connexion
              </Link>
            </div>
          </form>
        </div>
        <img className="absolute -top-14 rotate-[100deg] -right-10" src={deco2} width={200} />
        <img className={`absolute -bottom-20 rotate-[190deg] -right-10`} src={deco2} width={225} alt=""/>
      </div>
    </div>
  )
}

export default Register
