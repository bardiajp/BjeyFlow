import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import UserForm from './form';

export default function CreatePanelUser() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setOpen(true)}>Create user</Button>
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
