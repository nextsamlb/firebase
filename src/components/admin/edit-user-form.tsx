

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Player } from '@/lib/data'
import { useEffect, useState } from 'react'
import { Separator } from '../ui/separator'

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  role: z.enum(['admin', 'player']),
  password: z.string().optional(),
})

interface EditUserFormProps {
  user: Player | null
  isCreating: boolean
  onSave: (user: Omit<Player, 'id'> | Player, action?: {type: 'refund' | 'deduct', amount: number}) => void
  onCancel: () => void
}

export function EditUserForm({
  user,
  isCreating,
  onSave,
  onCancel,
}: EditUserFormProps) {
  const [balanceAction, setBalanceAction] = useState<{type: 'refund' | 'deduct' | null, amount: string}>({type: null, amount: ''})

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'player',
      password: '',
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
      })
    } else {
      form.reset({
        name: '',
        email: '',
        role: 'player',
        password: '',
      })
    }
  }, [user, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    const dataToSend = {
      ...(user || {}),
      ...values,
    } as Player
    
    if (isCreating && !values.password) {
      form.setError("password", { message: "Password is required for new users." });
      return;
    }
    
    const { id, ...rest } = dataToSend;

    onSave(isCreating ? rest : dataToSend)
  }

  function handleBalanceUpdate(type: 'refund' | 'deduct') {
    const amount = parseFloat(balanceAction.amount);
    if (!amount || amount <= 0) {
      // Basic validation
      alert('Please enter a valid positive amount.');
      return;
    }
    if (user) {
      onSave(user, { type, amount });
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Full Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="player">Player</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={
                    isCreating ? 'Required' : 'Leave blank to keep current'
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>

        {!isCreating && user && (
            <>
                <Separator className="my-6" />
                <div className="space-y-4">
                    <h3 className="font-medium">Balance Management</h3>
                    <p className="text-sm text-muted-foreground">
                        Current Balance: <span className="font-bold text-foreground">${user.balance.toLocaleString()}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="number" 
                            placeholder="Amount"
                            value={balanceAction.amount}
                            onChange={(e) => setBalanceAction({...balanceAction, amount: e.target.value})}
                        />
                         <Button type="button" variant="outline" onClick={() => handleBalanceUpdate('refund')}>Refund</Button>
                        <Button type="button" variant="destructive" onClick={() => handleBalanceUpdate('deduct')}>Deduct</Button>
                    </div>
                </div>
            </>
        )}
      </form>
    </Form>
  )
}
