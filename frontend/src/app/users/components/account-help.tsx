import { useState } from 'react';
import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useSiteSettings } from '@/hooks/use-site-settings';

const helpContent = {
    account: {
        title: 'Your administrator can help',
        description:
            'Create an account from Sign up and verify your email with a six-digit code. For an existing managed account or trouble signing in, contact your workspace administrator.',
    },
    password: {
        title: 'Let’s get you back in',
        description:
            'Use Forgot password on the sign-in screen to receive a secure reset link at your account email. If you no longer have access to that email, contact your workspace administrator.',
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
    const site = useSiteSettings();
    return (
        <>
            <button type="button" className={className} onClick={() => setOpen(true)}>
                {children}
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogTitle>{content.title}</DialogTitle>
                    <DialogDescription>{content.description}</DialogDescription>
                    {site.support_email && (
                        <a
                            href={`mailto:${site.support_email}`}
                            className="text-primary-foreground text-sm underline"
                        >
                            Contact support · {site.support_email}
                        </a>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
