'use server'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { getMediaItems } from '@/lib/data';

export default async function MediaHubPage() {
  const mediaItems = await getMediaItems();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Media Hub</h1>
        <p className="text-muted-foreground">
          Match highlights, player interviews, and more.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon />
            Gallery
          </CardTitle>
          <CardDescription>
            A collection of moments from the PIFA League.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mediaItems.length > 0 ? (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {mediaItems.map(item => (
                <div key={item.id} className="break-inside-avoid">
                  <Image
                    src={item.src}
                    alt={item.title}
                    width={800}
                    height={600}
                    className="rounded-lg object-cover w-full h-auto shadow-md"
                    data-ai-hint={item.hint}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-4" />
              <p>No media items have been added yet.</p>
              <p className="text-sm">An administrator can add items from the admin panel.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
