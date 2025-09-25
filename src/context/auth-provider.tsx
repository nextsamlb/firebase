'use client'

import { getPlayers, type Player } from '@/lib/data'
import { useRouter } from 'next/navigation'
import React, { createContext, useState, useEffect, useCallback } from 'react'
import { PlaceHolderImages } from '@/lib/placeholder-images'

interface AuthContextType {
  isAuthenticated: boolean
  user: Player | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  signup: (name: string, email: string, password: string) => Promise<boolean>
  updateUser: (updatedUser: Partial<Player>) => void
  loading: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  const loadUserFromStorage = useCallback(() => {
    try {
      const storedUser = localStorage.getItem('pifa-user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error)
      localStorage.removeItem('pifa-user')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUserFromStorage()
  }, [loadUserFromStorage])

  const login = async (email: string, password: string) => {
    // In a real app, this would be an API call to your backend for authentication
    const players = await getPlayers();
    const foundUser = players.find(
      (u) => u.email === email && u.password === password
    )
    if (foundUser) {
      const userToStore = { ...foundUser }
      delete userToStore.password
      localStorage.setItem('pifa-user', JSON.stringify(userToStore))
      setUser(userToStore)
      router.push('/dashboard')
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('pifa-user')
    router.push('/login')
  }

  const signup = async (name: string, email: string, password: string) => {
    // In a real app, this would be an API call to create a new user
    const players = await getPlayers();
    const existingUser = players.find((u) => u.email === email)
    if (existingUser) {
      return false // User already exists
    }
    
    // This is a mock implementation. In a real app, you'd save to Firestore.
    const newUser: Player = {
      id: String(players.length + 1),
      name,
      nickname: name,
      email,
      password,
      role: 'player',
      avatar: PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)].imageUrl,
      balance: 50000000,
      stats: { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, assists: 0 },
      bestPlayerVotes: 0,
      worstPlayerVotes: 0,
      registrationDate: new Date().toISOString(),
      bio: "New player ready to conquer the PIFA league!",
      position: "Midfielder",
      nationality: "USA",
      dateOfBirth: new Date(1998, 5, 15).toISOString(),
      height: 180,
      weight: 75,
      preferredFoot: 'Right',
      socialMedia: { instagram: `@${name.toLowerCase()}`},
      isActive: true,
    }
    
    const userToStore = { ...newUser }
    delete userToStore.password
    localStorage.setItem('pifa-user', JSON.stringify(userToStore))
    setUser(userToStore)
    // In a real app, we would add the user to the Firestore 'players' collection here.
    router.push('/dashboard')
    return true
  }

  const updateUser = (updatedUser: Partial<Player>) => {
    setUser((prevUser) => {
      if (!prevUser) return null
      const newUser = { ...prevUser, ...updatedUser }
      localStorage.setItem('pifa-user', JSON.stringify(newUser))
      return newUser
    })
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        logout,
        signup,
        updateUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
