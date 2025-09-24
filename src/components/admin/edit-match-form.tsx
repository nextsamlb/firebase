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
import { type Player, type Match } from '@/lib/data'
import { useEffect, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '../ui/calendar'
import { format } from 'date-fns'

const formSchema = z.object({
  matchNum: z.coerce.number().min(1),
  stageName: z.string().min(1),
  matchType: z.string().min(1),
  timestamp: z.date(),
  player1Id: z.string().min(1, 'Player 1 is required'),
  player2Id: z.string().optional(),
  player2Ids: z.array(z.string()).optional(),
  result: z.string().regex(/^\d+-\d+$/, { message: "Score must be 'X-Y' or empty" }).nullable().optional(),
})

interface EditMatchFormProps {
  match: Match | null
  players: Player[]
  isCreating: boolean
  onSave: (match: Match) => void
  onCancel: () => void
}

export function EditMatchForm({
  match,
  players,
  isCreating,
  onSave,
  onCancel,
}: EditMatchFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      matchNum: match?.matchNum || 1,
      stageName: match?.stageName || 'Group Stage',
      matchType: match?.matchType || '1v1',
      timestamp: match ? new Date(match.timestamp) : new Date(),
      player1Id: match?.player1Id || '',
      result: match?.result,
    },
  })

  const matchType = form.watch('matchType');

  useEffect(() => {
    if (match) {
      form.reset({
        matchNum: match.matchNum,
        stageName: match.stageName,
        matchType: match.matchType,
        timestamp: new Date(match.timestamp),
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        player2Ids: match.player2Ids,
        result: match.result,
      })
    } else {
       form.reset({
        matchNum: 1,
        stageName: 'Group Stage',
        matchType: '1v1',
        timestamp: new Date(),
        player1Id: '',
        player2Id: '',
        player2Ids: [],
        result: null,
      })
    }
  }, [match, form])
  
  useEffect(() => {
    // Reset opponent fields when match type changes
    form.setValue('player2Id', '');
    form.setValue('player2Ids', []);
  }, [matchType, form])


  function onSubmit(values: z.infer<typeof formSchema>) {
    const dataToSend = {
      ...(match || {}),
      ...values,
      timestamp: values.timestamp.toISOString(),
      player2Id: values.matchType === '1v1' ? values.player2Id : undefined,
      player2Ids: values.matchType !== '1v1' ? values.player2Ids : undefined,
    } as Match
    
    onSave(dataToSend)
  }

  const stages = ['Group Stage', 'Knockout Stage', 'Finals'];
  const matchTypes = ['1v1', '1v2', '1v3'];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="matchNum"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Match Number</FormLabel>
                <FormControl>
                    <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
                control={form.control}
                name="timestamp"
                render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="stageName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Stage</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {stages.map(stage => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="matchType"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Match Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {matchTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <FormField
            control={form.control}
            name="player1Id"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Player 1 (Home)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select player 1" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />

        {matchType === '1v1' && (
             <FormField
                control={form.control}
                name="player2Id"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Player 2 (Away)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select player 2" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}
        
        {matchType === '1v2' && (
             <FormField
                control={form.control}
                name="player2Ids"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Opponents (Team)</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                         <Select onValueChange={(val) => field.onChange([val, field.value?.[1] || ''])} value={field.value?.[0] || ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select opponent 1"/></SelectTrigger></FormControl>
                            <SelectContent>{players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select onValueChange={(val) => field.onChange([field.value?.[0] || '', val])} value={field.value?.[1] || ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select opponent 2"/></SelectTrigger></FormControl>
                            <SelectContent>{players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}

        {matchType === '1v3' && (
             <FormField
                control={form.control}
                name="player2Ids"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Opponents (Team)</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                         <Select onValueChange={(val) => field.onChange([val, field.value?.[1] || '', field.value?.[2] || ''])} value={field.value?.[0] || ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Opp 1"/></SelectTrigger></FormControl>
                            <SelectContent>{players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select onValueChange={(val) => field.onChange([field.value?.[0] || '', val, field.value?.[2] || ''])} value={field.value?.[1] || ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Opp 2"/></SelectTrigger></FormControl>
                            <SelectContent>{players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                         <Select onValueChange={(val) => field.onChange([field.value?.[0] || '', field.value?.[1] || '', val])} value={field.value?.[2] || ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Opp 3"/></SelectTrigger></FormControl>
                            <SelectContent>{players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}


        <FormField
            control={form.control}
            name="result"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Result</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. 3-1 (leave empty if not played)" {...field} value={field.value ?? ''} />
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
      </form>
    </Form>
  )
}
