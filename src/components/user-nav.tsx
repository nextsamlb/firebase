'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { LogOut, User as UserIcon, LogIn, Languages } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'
import { useTranslation } from '@/context/language-provider'

export function UserNav() {
  const { user, logout } = useAuth()
  const { setLanguage, language } = useTranslation();

  const getInitials = (name: string) => {
    const names = name.split(' ')
    const initials = names.map((n) => n[0]).join('')
    return initials.toUpperCase()
  }
  
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
        <Languages className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle Language</span>
      </Button>
      <ThemeToggle />
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={user.avatar}
                  alt={user.name}
                  data-ai-hint="person face"
                />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align={language === 'ar' ? 'start' : 'end'} forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href={`/profile/${user.id}`} passHref>
                <DropdownMenuItem>
                  <UserIcon className="me-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="me-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
         <Link href="/login">
            <Button variant="outline">
              <LogIn className="me-2 h-4 w-4" />
              Login
            </Button>
          </Link>
      )}
    </div>
  )
}
