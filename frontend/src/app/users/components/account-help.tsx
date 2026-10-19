import { useState } from 'react';
import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const helpContent = {
    account: {
        title: 'Your administrator can help',
        description:
            'BjeyFlow accounts are created by your organization’s administrator. Contact them to request an account or get help signing in.',
    },
    password: {
        title: 'Let’s get you back in',
        description:
            'Contact your organization’s BjeyFlow administrator to reset your password. For your security, passwords can only be reset by an administrator.',
    },
    privacy: {
        title: 'Your sign-in privacy',
        description:
            'BjeyFlow uses an HTTP-only cookie to authenticate your session. Your password is not saved in browser storage. Contact your organization’s administrator for its privacy policy.',
    },
    terms: {
        title: 'Using your workspace',
        description:
            'Access to this workspace is managed by your organization. Please contact your administrator for the terms and policies that apply to your account.',
    },
};

export default function AccountHelp({
    topic = 'account',
    children,
    className,
}: {
    topic?: keyof typeof helpContent;
    children: ReactNode;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const content = helpContent[topic];
    return (
        <>
            <button type="button" className={className} onClick={() => setOpen(true)}>
                {children}
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogTitle>{content.title}</DialogTitle>
                    <DialogDescription>{content.description}</DialogDescription>
                </DialogContent>
            </Dialog>
        </>
    );
}
