'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { draftReply } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface DraftReplyButtonProps {
    originalSubject: string;
    originalBody: string;
    onDraftedReply: (draft: string) => void;
}

export function DraftReplyButton({ originalSubject, originalBody, onDraftedReply }: DraftReplyButtonProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleDraftReply = async () => {
        setLoading(true);
        const result = await draftReply({ originalSubject, originalBody });
        if ('error' in result) {
            toast({
                variant: 'destructive',
                title: 'Error Drafting Reply',
                description: result.error,
            });
        } else {
            onDraftedReply(result.replyBody);
        }
        setLoading(false);
    };

    return (
        <Button
            type="button"
            variant="outline"
            onClick={handleDraftReply}
            disabled={loading}
        >
            <Sparkles className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Drafting...' : 'Draft with AI'}
        </Button>
    );
}
