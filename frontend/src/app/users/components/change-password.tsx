import { useState } from 'react';
import { changePassword } from '../api/change-password';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import PasswordForm from './password-form';

export default function ChangePassword() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button variant="outline" onClick={() => setOpen(true)}>
                Change password
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogTitle>Change password</DialogTitle>
                    <DialogDescription>
                        Enter your current password and a new password.
                    </DialogDescription>
                    <PasswordForm
                        ownPassword
                        action={changePassword}
                        onClose={() => setOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
