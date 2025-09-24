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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { type Player, type Message } from '@/lib/data'
import { useEffect } from 'react'
import { DraftReplyButton } from './draft-reply-button'

const formSchema = z.object({
  to: z.string().min(1, 'Recipient is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Message body cannot be empty'),
})

interface ComposeMessageProps {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onSend: (message: Omit<Message, 'id' | 'timestamp' | 'from' | 'read'>) => void
  allUsers: Player[]
  recipientId?: string
  subject?: string
  originalMessageBody?: string,
  isReply?: boolean
}

export function ComposeMessage({
  isOpen,
  onOpenChange,
  onSend,
  allUsers,
  recipientId,
  subject,
  originalMessageBody,
  isReply = false,
}: ComposeMessageProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      to: '',
      subject: '',
      body: '',
    },
  })

  useEffect(() => {
    form.reset({
      to: recipientId || '',
      subject: subject || '',
      body: '',
    })
  }, [recipientId, subject, form, isOpen]) // also reset on open
  
  const handleDraftedReply = (draft: string) => {
    form.setValue('body', draft);
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSend(values)
    form.reset()
  }

  const content = (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {!isReply && (
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a recipient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
           {!isReply && (
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input placeholder="Message subject" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          )}
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={isReply ? "Write your reply..." : "Write your message..."}
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <div className="flex justify-end items-center gap-2">
            {isReply && subject && originalMessageBody && (
              <DraftReplyButton 
                originalSubject={subject} 
                originalBody={originalMessageBody}
                onDraftedReply={handleDraftedReply}
                />
            )}
            <Button type="submit">
                Send
            </Button>
           </div>
        </form>
      </Form>
  )

  if (isReply) {
    return content;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Compose Message</DialogTitle>
          <DialogDescription>
            Send a message to another user.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            {content}
        </div>
      </DialogContent>
    </Dialog>
  )
}
