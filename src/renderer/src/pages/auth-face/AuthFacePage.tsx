import React, { useState } from 'react'

const AuthFacePage: React.FC = () => {
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!photo) return
    setLoading(true)
    setResult(null)
    const formData = new FormData()
    formData.append('photo', photo)
    try {
      const res = await fetch('http://localhost:8000/auth/face', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.authenticated) {
        setResult(`Bienvenue, utilisateur #${data.user_id} (${data.nom}) !`)
      } else {
        setResult('Visage non reconnu.')
      }
    } catch {
      setResult('Erreur lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#E6E6FA]">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-[#2F855A] mb-4">Connexion par reconnaissance faciale</h2>
        <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} className="w-full" required />
        <button type="submit" disabled={loading} className="bg-[#2F855A] text-white px-4 py-2 rounded-lg font-semibold w-full mt-2">{loading ? 'Vérification...' : 'Se connecter'}</button>
        {result && <div className="text-center mt-2 text-[#2F855A]">{result}</div>}
      </form>
    </div>
  )
}

export default AuthFacePage