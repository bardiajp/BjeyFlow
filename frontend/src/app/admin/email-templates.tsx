import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, FileText, KeyRound, MailCheck, Monitor, Smartphone } from 'lucide-react';
import { getEmailTemplates } from './api';
import DisplayError from '@/components/display-error';
import Loading from '@/components/loading';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AccentTitle } from '@/components/accent-title';

export default function AdminEmailTemplates() {
    const query = useQuery({ queryKey: ['admin', 'email-templates'], queryFn: getEmailTemplates });
    const [selected, setSelected] = useState('verification');
    const [mode, setMode] = useState<'html' | 'text'>('html');
    const [mobile, setMobile] = useState(false);
    if (query.isPending) return <Loading />;
    if (query.error)
        return <DisplayError error={query.error} onRetry={() => void query.refetch()} />;
    const template = query.data.find((item) => item.id === selected)!;

    return (
        <section className="bg-card border-input flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-3xl border">
            <header className="border-input flex flex-wrap items-center justify-between gap-4 border-b px-5 py-6 sm:px-6">
                <div>
                    <h1 className="text-foreground text-xl font-semibold tracking-tight">
                        <AccentTitle>A little care in every email</AccentTitle>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-xs leading-6">
                        Live templates, sample data. No email is sent and no real verification codes
                        or reset links are shown.
                    </p>
                </div>
                <span className="bg-accent text-muted-foreground rounded-full px-3 py-2 text-[10px]">
                    Read-only preview
                </span>
            </header>
            <div className="grid min-h-0 flex-1 lg:grid-cols-[260px_minmax(0,1fr)]">
                <nav
                    aria-label="Email template selection"
                    className="border-input grid content-start gap-2 border-b p-4 lg:border-r lg:border-b-0"
                >
                    {query.data.map((item) => {
                        const Icon = item.id === 'verification' ? MailCheck : KeyRound;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                aria-pressed={selected === item.id}
                                onClick={() => setSelected(item.id)}
                                className={cn(
                                    'flow-control flex items-start gap-3 rounded-2xl border p-4 text-left outline-none focus-visible:ring-2',
                                    selected === item.id
                                        ? 'border-primary/30 bg-primary/10'
                                        : 'hover:bg-accent border-transparent'
                                )}
                            >
                                <Icon
                                    size={18}
                                    className="text-primary-foreground mt-0.5 shrink-0"
                                />
                                <span className="min-w-0">
                                    <span className="text-foreground block text-xs font-medium">
                                        {item.name}
                                    </span>
                                    <span className="text-muted-foreground mt-1.5 block text-[10px] leading-5">
                                        {item.description}
                                    </span>
                                </span>
                                <ArrowUpRight
                                    size={13}
                                    className="text-muted-foreground mt-0.5 shrink-0"
                                />
                            </button>
                        );
                    })}
                    <p className="text-muted-foreground px-4 py-3 text-[10px] leading-6">
                        The preview uses the same HTML and plain-text files as outgoing account
                        emails. Templates are updated through code, not edited here.
                    </p>
                </nav>
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="border-input flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:px-6">
                        <div className="min-w-0">
                            <p className="text-muted-foreground text-[9px] tracking-widest uppercase">
                                Subject
                            </p>
                            <h2 className="text-foreground mt-1 text-xs font-medium wrap-break-word">
                                <AccentTitle trailingDot={false}>{template.subject}</AccentTitle>
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="bg-accent flex rounded-xl p-1">
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        'h-8 rounded-lg px-3 text-[11px]',
                                        mode === 'html' && 'bg-card shadow-sm'
                                    )}
                                    aria-pressed={mode === 'html'}
                                    onClick={() => setMode('html')}
                                >
                                    Design
                                </Button>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        'h-8 gap-1.5 rounded-lg px-3 text-[11px]',
                                        mode === 'text' && 'bg-card shadow-sm'
                                    )}
                                    aria-pressed={mode === 'text'}
                                    onClick={() => setMode('text')}
                                >
                                    <FileText size={12} />
                                    Plain text
                                </Button>
                            </div>
                            {mode === 'html' && (
                                <div className="border-input flex rounded-xl border p-1">
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            'size-8 rounded-lg p-0',
                                            !mobile && 'bg-accent'
                                        )}
                                        aria-label="Desktop email preview"
                                        aria-pressed={!mobile}
                                        onClick={() => setMobile(false)}
                                    >
                                        <Monitor size={14} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            'size-8 rounded-lg p-0',
                                            mobile && 'bg-accent'
                                        )}
                                        aria-label="Mobile email preview"
                                        aria-pressed={mobile}
                                        onClick={() => setMobile(true)}
                                    >
                                        <Smartphone size={14} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-workspace min-h-0 flex-1 p-3 sm:p-6">
                        {mode === 'html' ? (
                            <div
                                className="mx-auto w-full overflow-hidden rounded-2xl transition-[max-width] duration-300 motion-reduce:transition-none"
                                style={{ maxWidth: mobile ? 360 : 680 }}
                            >
                                <iframe
                                    key={template.id}
                                    title={`${template.name} email preview`}
                                    sandbox=""
                                    srcDoc={template.html}
                                    className="h-[860px] w-full border-0 bg-[#f6f8fa]"
                                />
                            </div>
                        ) : (
                            <pre className="bg-card border-input text-foreground h-full min-h-96 overflow-auto rounded-2xl border p-5 font-mono text-xs leading-7 wrap-break-word whitespace-pre-wrap">
                                {template.text}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
