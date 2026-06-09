'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MoreHorizontalIcon,
  FileTextIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/project-helpers';
import { createNote, updateNote, deleteNote } from '@/actions/notes';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type Note = typeof import('@/db/schema').notes.$inferSelect;

// ---------- Schemas ----------

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  content: z.string().optional(),
});

type NoteForm = z.infer<typeof noteSchema>;

// ---------- Create/Edit Note Dialog ----------

function NoteFormDialog({
  projectId,
  note,
  open,
  onOpenChange,
  onSaved,
}: {
  projectId: number;
  note?: Note | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (note: Note) => void;
}) {
  const [isPending, startTransition] = React.useTransition();
  const isEditing = !!note;

  const form = useForm<NoteForm>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: note?.title ?? '',
      content: note?.content ?? '',
    },
  });

  // Reset form when the dialog opens or the note changes
  React.useEffect(() => {
    form.reset({
      title: note?.title ?? '',
      content: note?.content ?? '',
    });
  }, [note, form]);

  function onSubmit(data: NoteForm) {
    startTransition(async () => {
      try {
        let saved: Note;
        if (isEditing && note) {
          saved = await updateNote(note.id, projectId, {
            title: data.title,
            content: data.content || null,
          });
        } else {
          saved = await createNote({
            projectId,
            title: data.title,
            content: data.content || null,
          });
        }
        toast.success(isEditing ? 'Note updated' : 'Note created');
        onSaved(saved);
        onOpenChange(false);
        if (!isEditing) form.reset();
      } catch (error) {
        toast.error(isEditing ? 'Failed to update note' : 'Failed to create note');
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Note' : 'Add Note'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your note details.' : 'Create a new note for this project.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl><Input placeholder="Note title" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[160px] resize-y font-mono text-sm"
                      placeholder="Write in Markdown..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter showCloseButton>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Note'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Delete Note Confirmation ----------

function DeleteNoteDialog({
  note,
  open,
  onOpenChange,
  onDeleted,
}: {
  note: Note | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    if (!note) return;
    startTransition(async () => {
      try {
        await deleteNote(note.id, note.projectId);
        toast.success('Note deleted');
        onDeleted();
        onOpenChange(false);
      } catch (error) {
        toast.error('Failed to delete note');
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Note</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{note?.title}&rdquo;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Note Item ----------

function NoteItem({
  note,
  onEdit,
  onDelete,
}: {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}) {
  const contentPreview = note.content
    ? note.content.length > 120
      ? note.content.slice(0, 120) + '...'
      : note.content
    : null;

  return (
    <div className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <FileTextIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground/70" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{note.title}</span>
        </div>
        {contentPreview && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">
            {contentPreview}
          </p>
        )}
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{formatDate(note.createdAt)}</span>
          {note.updatedAt && note.updatedAt.getTime() !== note.createdAt.getTime() && (
            <span>Edited {formatDate(note.updatedAt)}</span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" />}>
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(note)}>
            <PencilIcon className="mr-2 size-4" /> Edit Note
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(note)}
          >
            <TrashIcon className="mr-2 size-4" /> Delete Note
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ---------- Notes Tab ----------

export function NotesTab({ projectId, initialNotes }: { projectId: number; initialNotes: Note[] }) {
  const router = useRouter();
  const [notes, setNotes] = React.useState<Note[]>(initialNotes);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = React.useState<Note | null>(null);

  function handleNoteCreated(note: Note) {
    setNotes((prev) => [note, ...prev]);
    router.refresh();
  }

  function handleNoteUpdated(note: Note) {
    setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
    setEditingNote(null);
    router.refresh();
  }

  function handleNoteDeleted() {
    if (deletingNote) {
      setNotes((prev) => prev.filter((n) => n.id !== deletingNote.id));
    }
    setDeletingNote(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <PlusIcon className="mr-1.5 size-4" /> Add Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-8 text-center">
          <FileTextIcon className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium">No notes yet</p>
          <p className="text-xs text-muted-foreground">Add a note to keep track of important information.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onEdit={setEditingNote}
              onDelete={setDeletingNote}
            />
          ))}
        </div>
      )}

      <NoteFormDialog
        projectId={projectId}
        open={showCreate}
        onOpenChange={setShowCreate}
        onSaved={handleNoteCreated}
      />

      <NoteFormDialog
        projectId={projectId}
        note={editingNote}
        open={!!editingNote}
        onOpenChange={(open) => { if (!open) setEditingNote(null); }}
        onSaved={handleNoteUpdated}
      />

      <DeleteNoteDialog
        note={deletingNote}
        open={!!deletingNote}
        onOpenChange={(open) => { if (!open) setDeletingNote(null); }}
        onDeleted={handleNoteDeleted}
      />
    </div>
  );
}