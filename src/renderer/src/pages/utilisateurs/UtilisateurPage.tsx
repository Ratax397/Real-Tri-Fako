import { JSX, useState, useEffect } from 'react'
import { FaDollarSign, FaEye, FaUserCircle } from 'react-icons/fa'
import { useFilterData } from '@renderer/hooks/useFilterData'
import Searchbar from '@renderer/components/searchbar/Searchbar'
import Moduleinfouse from '@renderer/components/Moduleinfouser/Moduleinfouse'
import { User } from '@renderer/data/Userdata'
import React from 'react'

function UtilisateurPage(): JSX.Element {
  const [searchuser, setsearchuser] = useState('')
  const handlesearchuser = (datauser: string) => {
    setsearchuser(datauser)
  }
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formNom, setFormNom] = useState('')
  const [formEtablissement, setFormEtablissement] = useState('')
  const [formPhoto, setFormPhoto] = useState<File | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const [addLoading, setAddLoading] = useState(false)

  useEffect(() => {
    fetch('http://localhost:8000/users/')
      .then(res => res.json())
      .then(data => {
        setUsers(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Erreur de chargement des utilisateurs')
        setLoading(false)
      })
  }, [])

  const filtereusers = useFilterData(users, searchuser, ['nom', 'etablissement'])
  const [selecteduser, setSelecteduser] = useState<User | null>(null)
  const handleViewUser = (user: User) => {
    setSelecteduser(user)
  }
  const handleCloseModule = () => {
    setSelecteduser(null)
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddLoading(true)
    setAddError(null)
    const formData = new FormData()
    formData.append('nom', formNom)
    formData.append('etablissement', formEtablissement)
    if (formPhoto) formData.append('photo', formPhoto)
    try {
      const res = await fetch('http://localhost:8000/users/', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('Erreur lors de l\'ajout')
      const newUser = await res.json()
      setUsers(prev => [...prev, newUser])
      setShowAddForm(false)
      setFormNom('')
      setFormEtablissement('')
      setFormPhoto(null)
    } catch (err) {
      setAddError('Erreur lors de l\'ajout')
    } finally {
      setAddLoading(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      const res = await fetch(`http://localhost:8000/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  return (
    <div
      className={`Rigth bg-[#E6E6FA] w-full min-h-screen pl-6 pt-4 pr-4 transition-all duration-600`}
    >
      <div className="p-6 space-y-6">
        <Searchbar onSearch={handlesearchuser} />

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-[#2F855A] tracking-tight">
              Utilisateurs connectés
            </h2>
            <span className="bg-[#2F855A] text-white text-sm font-semibold rounded-full px-4 py-1 select-none shadow-sm">
              {filtereusers.length}
            </span>
          </div>

          <div className="hidden md:flex text-sm bg-[#2F855A] text-white px-4 py-2 rounded-lg font-semibold select-none">
            <div className="w-24 flex items-center justify-center">Photo</div>
            <div className="w-40 flex items-center pl-2">Nom</div>
            <div className="w-36 flex items-center pl-2">Etablissement</div>
            <div className="w-20 flex items-center justify-center">Voir</div>
          </div>

          <div className="space-y-2 mt-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300">
            {loading ? (
              <div className="text-center py-6 text-gray-500 text-sm">Chargement...</div>
            ) : error ? (
              <div className="text-center py-6 text-red-500 text-sm">{error}</div>
            ) : filtereusers.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">Aucun utilisateur trouvé</div>
            ) : (
              filtereusers.map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center px-4 py-2 rounded-xl text-sm ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  } hover:bg-green-50 border-l-2 border-transparent hover:border-[#2F855A] transition-all duration-300`}
                >
                  <div className="w-24 flex items-center justify-center">
                    {user.photo_path ? (
                      <img src={`http://localhost:8000/photos/${user.photo_path.split('/').pop()}`} alt="photo" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="bg-[#2F855A] p-2 rounded-full">
                        <FaUserCircle className="text-2xl text-white" />
                      </div>
                    )}
                  </div>
                  <div className="w-40 flex items-center pl-2 font-semibold text-gray-800 truncate">
                    {user.nom}
                  </div>
                  <div className="w-36 flex items-center pl-2 text-gray-700 truncate">
                    {user.etablissement}
                  </div>
                  <div className="w-20 flex items-center justify-center text-[#9f7126]">
                    <FaEye
                      onClick={() => handleViewUser(user)}
                      className="cursor-pointer hover:text-black transition"
                    />
                  </div>
                  <div className="w-20 flex items-center justify-center">
                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:underline text-xs">Supprimer</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowAddForm(true)} className="bg-[#2F855A] text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-[#276749] transition">Ajouter un utilisateur</button>
        </div>
        {showAddForm && (
          <div className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center">
            <form onSubmit={handleAddUser} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm space-y-4 relative">
              <button type="button" onClick={() => setShowAddForm(false)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">✕</button>
              <h3 className="text-lg font-bold text-[#2F855A]">Nouvel utilisateur</h3>
              <input type="text" placeholder="Nom" value={formNom} onChange={e => setFormNom(e.target.value)} className="w-full border rounded px-3 py-2" required />
              <input type="text" placeholder="Etablissement" value={formEtablissement} onChange={e => setFormEtablissement(e.target.value)} className="w-full border rounded px-3 py-2" required />
              <input type="file" accept="image/*" onChange={e => setFormPhoto(e.target.files?.[0] || null)} className="w-full" required />
              {addError && <div className="text-red-500 text-sm">{addError}</div>}
              <button type="submit" disabled={addLoading} className="bg-[#2F855A] text-white px-4 py-2 rounded-lg font-semibold w-full mt-2">{addLoading ? 'Ajout...' : 'Ajouter'}</button>
            </form>
          </div>
        )}
      </div>
      {selecteduser && <Moduleinfouse user={selecteduser} onClose={handleCloseModule} />}
    </div>
  )
}

export default UtilisateurPage
