
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
import { type League } from '@/lib/data'
import { useEffect } from 'react'

const formSchema = z.object({
  name: z.string().min(3, 'League name must be at least 3 characters.'),
  status: z.enum(['upcoming', 'active', 'completed']),
  entryFee: z.coerce.number().min(0),
  prizePool: z.coerce.number().min(0),
  topScorerPrize: z.coerce.number().min(0),
  pointsForWin: z.coerce.number().min(1),
})

interface EditLeagueFormProps {
  league: League | null
  onSave: (league: Omit<League, 'id'> | League) => void
  onCancel: () => void
}

export function EditLeagueForm({
  league,
  onSave,
  onCancel,
}: EditLeagueFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: league?.name || '',
      status: league?.status || 'upcoming',
      entryFee: league?.entryFee || 0,
      prizePool: league?.prizePool || 0,
      topScorerPrize: league?.topScorerPrize || 0,
      pointsForWin: league?.pointsForWin || 3,
    },
  })

  useEffect(() => {
    form.reset(
      league
        ? {
            name: league.name,
            status: league.status,
            entryFee: league.entryFee,
            prizePool: league.prizePool,
            topScorerPrize: league.topScorerPrize,
            pointsForWin: league.pointsForWin,
          }
        : {
            name: '',
            status: 'upcoming',
            entryFee: 0,
            prizePool: 0,
            topScorerPrize: 0,
            pointsForWin: 3,
          }
    )
  }, [league, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    const dataToSend = league ? { ...league, ...values } : values;
    onSave(dataToSend);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>League Name</FormLabel>
              <FormControl>
                <Input placeholder="E.g., PIFA Season 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="entryFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Fee ($)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="prizePool"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Prize Pool ($)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="topScorerPrize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Top Scorer Prize ($)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pointsForWin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points for a Win</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  )
}
