import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import UserForm from './form';
import { UserPlus } from 'lucide-react';

export default function CreatePanelUser() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button
                className="bg-brand h-10 gap-2 rounded-xl px-4 text-xs text-white"
                onClick={() => setOpen(true)}
            >
                <UserPlus size={15} /> Add person
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogTitle>Create user</DialogTitle>
                    <DialogDescription>Add a panel user and assign a role.</DialogDescription>
                    <UserForm onClose={() => setOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}
