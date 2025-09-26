

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getPlayers, getMessages, sendMessage, deleteMessage, type Player as MessageContact, type Message } from '@/lib/data'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { PlusCircle, Trash2 } from 'lucide-react'
import { ComposeMessage } from '@/components/inbox/compose-message'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function InboxPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<MessageContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null)

  const fetchMessagesAndUsers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allUsers, allMessages] = await Promise.all([
        getPlayers(),
        getMessages(user.id),
      ]);
      setUsers(allUsers);
      setMessages(allMessages);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not load messages."});
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMessagesAndUsers();
  }, [fetchMessagesAndUsers]);
  
  if (!user) return (
     <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
  );

  const getContactName = (message: Message) => {
    const contactId = message.from === user.id ? message.to : message.from;
    return users.find(u => u.id === contactId)?.name || 'Unknown User';
  }

  const getContactAvatar = (message: Message) => {
    const contactId = message.from === user.id ? message.to : message.from;
    return users.find(u => u.id === contactId)?.avatar || '';
  }

  const getInitials = (name: string) => {
    if (!name) return ''
    const names = name.split(' ')
    const initials = names.map((n) => n[0]).join('')
    return initials.toUpperCase()
  }

  const handleSendMessage = async (newMessageData: Omit<Message, 'id' | 'timestamp' | 'from'>) => {
    if (!user) return;
    const messageToSend = {
      ...newMessageData,
      timestamp: new Date().toISOString(),
      from: user.id,
    }
    try {
      const sentMessage = await sendMessage(messageToSend);
      setMessages([sentMessage, ...messages]);
      toast({ title: "Message Sent!", description: `Your message to ${users.find(u=>u.id === sentMessage.to)?.name} has been sent.`})
      setIsComposeOpen(false);
    } catch (error) {
       toast({ variant: 'destructive', title: "Error", description: "Failed to send message."})
    }
  }

  const handleDelete = (message: Message) => {
    setMessageToDelete(message)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (messageToDelete) {
      try {
        await deleteMessage(messageToDelete.id);
        setMessages(messages.filter((m) => m.id !== messageToDelete.id))
        toast({ title: 'Message Deleted', description: 'The message has been removed.'})
        if(selectedMessage?.id === messageToDelete.id) {
          setSelectedMessage(null);
        }
      } catch (error) {
        toast({ variant: 'destructive', title: "Error", description: "Failed to delete message."})
      }
    }
    setIsDeleteOpen(false)
    setMessageToDelete(null)
  }

  const uniqueConversations = Array.from(new Map(messages.map(m => {
    const contactId = m.from === user.id ? m.to : m.from;
    return [contactId, m];
  })).values());


  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground">Your recent conversations.</p>
        </div>
        <Button onClick={() => setIsComposeOpen(true)}>
            <PlusCircle className='mr-2 h-4 w-4' />
            Compose
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/3 border-r overflow-y-auto">
          {loading ? (
            <div className="p-2 space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
          <nav className="p-2">
            <ul>
              {uniqueConversations.map((message) => (
                <li key={message.id}>
                  <button
                    onClick={() => {
                        setSelectedMessage(message);
                        if (!message.read && message.to === user.id) {
                            // In a real app, you would update the message status in the DB
                            const newMessages = messages.map(m => m.id === message.id ? {...m, read: true} : m);
                            setMessages(newMessages);
                        }
                    }}
                    className={cn(
                      'w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors hover:bg-muted',
                      selectedMessage?.id === message.id && 'bg-muted',
                      !message.read && message.to === user.id && 'font-bold'
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getContactAvatar(message)} />
                      <AvatarFallback>{getInitials(getContactName(message))}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                        <div className="font-semibold">{getContactName(message)}</div>
                        <p className={cn("text-sm text-muted-foreground truncate", !message.read && message.to === user.id ? "font-normal" : "")}>{message.subject}</p>
                    </div>
                     <time className="text-xs text-muted-foreground self-start">
                        {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                      </time>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          )}
        </aside>
        <main className="flex-1 flex flex-col">
            {selectedMessage ? (
                 <div className="flex-1 flex flex-col">
                    <div className="p-4 border-b flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">{selectedMessage.subject}</h2>
                            <p className="text-sm text-muted-foreground">From: {users.find(u => u.id === selectedMessage.from)?.name} | To: {users.find(u => u.id === selectedMessage.to)?.name}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(selectedMessage)}>
                            <Trash2 className="h-5 w-5 text-destructive" />
                        </Button>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto">
                        <p>{selectedMessage.body}</p>
                    </div>
                    <div className="p-4 border-t bg-background">
                         <ComposeMessage
                            onSend={handleSendMessage}
                            allUsers={users.filter(u => u.id !== user.id)}
                            recipientId={selectedMessage.from === user.id ? selectedMessage.to : selectedMessage.from}
                            subject={`Re: ${selectedMessage.subject}`}
                            originalMessageBody={selectedMessage.body}
                            isReply={true}
                          />
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <p>Select a message to read</p>
                </div>
            )}
        </main>
      </div>
       <ComposeMessage
          isOpen={isComposeOpen}
          onOpenChange={setIsComposeOpen}
          onSend={handleSendMessage}
          allUsers={users.filter(u => u.id !== user.id)}
        />
        <AlertDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete the message permanently. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setMessageToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
    </div>
  )
}
