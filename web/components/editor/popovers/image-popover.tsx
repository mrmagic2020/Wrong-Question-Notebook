import { useCallback, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Image as ImageIcon } from 'lucide-react';

interface ImagePopoverProps {
  editor: Editor;
  disabled: boolean;
}

function validateImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    const dangerousProtocols = [
      'javascript:',
      'data:',
      'file:',
      'blob:',
      'ftp:',
    ];
    if (
      dangerousProtocols.some(protocol =>
        url.toLowerCase().startsWith(protocol)
      )
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function ImagePopover({ editor, disabled }: ImagePopoverProps) {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  const handleInsertImage = useCallback(() => {
    if (!imageUrl.trim()) return;

    const trimmedUrl = imageUrl.trim();
    if (!validateImageUrl(trimmedUrl)) {
      toast.error('Please enter a valid image URL (http/https)');
      return;
    }

    editor
      .chain()
      .focus()
      .setResizableImage({
        src: trimmedUrl,
        alt: imageAlt.trim() || '',
        caption: imageAlt.trim() || '',
      })
      .run();

    setImageUrl('');
    setImageAlt('');
    setOpen(false);
    toast.success('Image inserted successfully');
  }, [editor, imageUrl, imageAlt]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setImageUrl('');
    setImageAlt('');
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          title="Add image"
          className="h-8 w-8 p-0"
          onClick={() => {
            setImageUrl('');
            setImageAlt('');
            setOpen(true);
          }}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">Add Image</div>

          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleInsertImage();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">Enter an image URL</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-alt">Alt text (optional)</Label>
            <Input
              id="image-alt"
              placeholder="Description of the image"
              value={imageAlt}
              onChange={e => setImageAlt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Alt text helps with accessibility
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleInsertImage}
              disabled={!imageUrl.trim()}
            >
              Insert Image
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
