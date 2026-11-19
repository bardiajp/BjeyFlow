import { useState } from 'react';
import { changePassword } from '../api/change-password';
import { Button } from '@/components/ui/button';
import { ChevronDown, LockKeyhole } from 'lucide-react';
import { useId } from 'react';
import PasswordForm from './password-form';
import { ExpandableContent } from '@/components/expandable-content';

export default function ChangePassword() {
    const [open, setOpen] = useState(false);
    const id = useId();
    return (
        <div className="w-full">
            <Button
                type="button"
                variant="outline"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen(!open)}
                className="h-10 w-full justify-between gap-2 rounded-xl text-xs"
            >
                <span className="flex items-center gap-2">
                    <LockKeyhole size={14} />
                    Change password
                </span>
                <ChevronDown
                    size={13}
                    className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
                />
            </Button>
            <ExpandableContent id={id} open={open}>
                <div className="editor-form border-input mt-4 border-t pt-4">
                    <p className="text-muted-foreground mb-4 text-[11px] leading-relaxed">
                        A new password for a little peace of mind.
                    </p>
                    <PasswordForm
                        ownPassword
                        action={changePassword}
                        onClose={() => setOpen(false)}
                    />
                </div>
            </ExpandableContent>
        </div>
    );
}
