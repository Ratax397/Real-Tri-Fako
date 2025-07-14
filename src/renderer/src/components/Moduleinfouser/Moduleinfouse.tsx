import React from 'react'
import { FaTimes, FaUserCircle } from 'react-icons/fa'
import { User } from '@renderer/data/Userdata'

interface ModuleUserInfoProps {
  user: User | null
  onClose: () => void
}

const Moduleinfouse: React.FC<ModuleUserInfoProps> = ({ user, onClose }) => {
  if (!user) return null

  return (
    <div className="fixed inset-0 bg-[#2F855A]/30 backdrop-blur-sm z-50 flex justify-center items-center px-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-fadeIn border border-[#d8e7de]">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"
          onClick={onClose}
        >
          <FaTimes size={20} />
        </button>

        <div className="flex flex-col items-center mb-6">
          {user.photo_path ? (
            <img src={`http://localhost:8000/photos/${user.photo_path.split('/').pop()}`} alt="photo" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="bg-[#2F855A] p-4 rounded-full shadow-md">
              <FaUserCircle className="text-white text-5xl" />
            </div>
          )}
          <h2 className="text-xl font-bold text-[#2F855A] mt-2">
            {user.nom}
          </h2>
        </div>

        <div className="space-y-4 text-sm text-gray-800">
          <div className="flex items-center gap-3">
            <span>Etablissement : <strong>{user.etablissement}</strong></span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#2F855A] hover:bg-[#276749] text-white px-5 py-2 rounded-lg font-semibold shadow-md transition duration-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export default Moduleinfouse
