import { useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowDownToLine,
    Check,
    ChevronDown,
    FileText,
    Image,
    MonitorDown,
    Smartphone,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExpandableContent } from '@/components/expandable-content';
import { axiosInstance } from '@/lib/api';
import { cn } from '@/lib/utils';

type Asset =
    | 'linux_appimage'
    | 'linux_deb'
    | 'windows_installer'
    | 'windows_portable'
    | 'appimage_icon'
    | 'appimage_guide';
interface DesktopRelease {
    available: boolean;
    version?: string;
    assets: Partial<Record<Asset, string>>;
}

function currentOS() {
    const agent = navigator.userAgent;
    if (/android/i.test(agent)) return 'Android';
    if (/iphone|ipad|ipod/i.test(agent)) return 'iOS';
    if (/windows/i.test(agent)) return 'Windows';
    if (/cros/i.test(agent)) return 'ChromeOS';
    if (/linux/i.test(agent)) return 'Linux';
    if (/macintosh|mac os x/i.test(agent)) return 'macOS';
    return 'Unknown';
}

const packages: { key: Asset; title: string; description: string }[] = [
    { key: 'windows_installer', title: 'Windows Setup', description: 'Install on your computer' },
    { key: 'windows_portable', title: 'Windows Portable', description: 'Run without installing' },
    { key: 'linux_deb', title: 'Linux DEB', description: 'Debian and Ubuntu' },
    { key: 'linux_appimage', title: 'Linux AppImage', description: 'Portable Linux package' },
];

export function DesktopSettings() {
    const os = currentOS();
    const [platform, setPlatform] = useState<'Windows' | 'Linux'>(
        os === 'Linux' ? 'Linux' : 'Windows'
    );
    const [expanded, setExpanded] = useState(false);
    const downloadsId = useId();
    const release = useQuery({
        queryKey: ['desktop-releases'],
        queryFn: async () =>
            (await axiosInstance.get<DesktopRelease>('api/desktop/releases/')).data,
        staleTime: 300_000,
        retry: false,
    });
    const assets = release.data?.assets;
    const primary: Asset = platform === 'Windows' ? 'windows_installer' : 'linux_deb';
    const secondary: Asset = platform === 'Windows' ? 'windows_portable' : 'linux_appimage';
    const download = (key: Asset, label: string, outline = false) => (
        <Button
            render={assets?.[key] ? <a href={assets[key]} /> : undefined}
            disabled={!assets?.[key]}
            variant={outline ? 'outline' : 'default'}
            className={cn(
                'h-11 w-full gap-2 rounded-xl text-xs',
                !outline && 'bg-brand text-white'
            )}
        >
            <ArrowDownToLine size={15} aria-hidden="true" />
            {label}
        </Button>
    );
    return (
        <>
            <section className="border-input bg-card rounded-[22px] border p-5 sm:p-6">
                <div className="flex items-start gap-3">
                    <span className="bg-accent text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl">
                        <MonitorDown size={20} strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-foreground text-sm font-semibold">
                            Your flow, on desktop
                        </h2>
                        <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                            A dedicated space for your everyday work.
                        </p>
                    </div>
                </div>
                <div className="border-input bg-accent/30 mt-5 rounded-2xl border p-3 sm:p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-muted-foreground text-[10px] font-medium">
                            Choose your platform
                        </span>
                        <Badge variant="outline" className="text-muted-foreground gap-1 text-[9px]">
                            <Check size={11} aria-hidden="true" /> Detected: {os}
                        </Badge>
                    </div>
                    <div
                        className="border-input bg-card grid grid-cols-2 gap-1 rounded-xl border p-1"
                        role="group"
                        aria-label="Download platform"
                    >
                        {(['Windows', 'Linux'] as const).map((item) => (
                            <button
                                type="button"
                                key={item}
                                aria-pressed={platform === item}
                                onClick={() => setPlatform(item)}
                                className={cn(
                                    'flow-control min-h-10 rounded-lg px-3 text-xs font-medium transition-colors motion-reduce:transition-none',
                                    platform === item
                                        ? 'bg-brand text-white'
                                        : 'text-muted-foreground hover:bg-accent'
                                )}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                    <p className="text-muted-foreground my-3 text-[11px] leading-relaxed">
                        {platform === 'Windows'
                            ? 'Choose Setup to install, or Portable to run without installing.'
                            : 'Choose DEB for Debian or Ubuntu, or AppImage for a portable version.'}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {download(
                            primary,
                            platform === 'Windows' ? 'Download Setup' : 'Download DEB'
                        )}
                        {download(
                            secondary,
                            platform === 'Windows' ? 'Portable version' : 'AppImage version',
                            true
                        )}
                    </div>
                    <p
                        className="text-muted-foreground mt-3 text-[10px] leading-relaxed"
                        role="status"
                    >
                        {release.isPending
                            ? 'Checking available downloads…'
                            : release.isError
                              ? 'Could not load downloads.'
                              : release.data?.available
                                ? `${release.data.version} · Intel / AMD 64-bit · Internet required`
                                : 'No desktop release published yet.'}
                    </p>
                    {release.isError && (
                        <button
                            type="button"
                            className="text-primary-foreground mt-2 text-xs underline underline-offset-4"
                            onClick={() => void release.refetch()}
                        >
                            Try again
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={downloadsId}
                    onClick={() => setExpanded((value) => !value)}
                    className="flow-control text-muted-foreground mt-3 flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-2 text-left text-xs"
                >
                    All packages & installation help
                    <ChevronDown
                        size={15}
                        className={cn(
                            'shrink-0 transition-transform duration-200 motion-reduce:transition-none',
                            expanded && 'rotate-180'
                        )}
                        aria-hidden="true"
                    />
                </button>
                <ExpandableContent open={expanded} id={downloadsId}>
                    <div className="border-input grid gap-2 border-t pt-3">
                        {packages.map((item) => (
                            <div
                                key={item.key}
                                className="bg-accent/30 flex min-w-0 items-center gap-3 rounded-xl p-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-foreground text-xs font-medium">
                                        {item.title}
                                    </p>
                                    <p className="text-muted-foreground mt-1 text-[10px] leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                                <Button
                                    render={
                                        assets?.[item.key] ? (
                                            <a href={assets[item.key]} />
                                        ) : undefined
                                    }
                                    disabled={!assets?.[item.key]}
                                    variant="outline"
                                    className="size-10 shrink-0 rounded-xl"
                                    aria-label={`Download ${item.title}`}
                                >
                                    <ArrowDownToLine size={15} />
                                </Button>
                            </div>
                        ))}
                        <div className="mt-1 grid gap-2 sm:grid-cols-2">
                            {(['appimage_guide', 'appimage_icon'] as const).map((key) => (
                                <Button
                                    key={key}
                                    variant="outline"
                                    render={assets?.[key] ? <a href={assets[key]} /> : undefined}
                                    disabled={!assets?.[key]}
                                    className="h-10 gap-2 rounded-xl text-[11px]"
                                >
                                    {key === 'appimage_guide' ? (
                                        <FileText size={14} />
                                    ) : (
                                        <Image size={14} />
                                    )}
                                    {key === 'appimage_guide' ? 'AppImage guide' : 'AppImage icon'}
                                </Button>
                            ))}
                        </div>
                    </div>
                </ExpandableContent>
            </section>
            <section className="border-input bg-card rounded-[22px] border p-5 sm:p-6">
                <div className="flex items-start gap-3">
                    <span className="bg-accent text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl">
                        <Smartphone size={20} strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-foreground text-sm font-semibold">
                            Your flow, on Android
                        </h2>
                        <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                            Signed APK · Android 7.0 or newer
                        </p>
                    </div>
                </div>
                <Button
                    render={<a href="/downloads/BjeyFlow-android.apk" download />}
                    className="bg-brand mt-4 h-11 w-full gap-2 rounded-xl text-xs text-white"
                >
                    <ArrowDownToLine size={15} /> Download Android app
                </Button>
                <p className="text-muted-foreground mt-2 text-center text-[10px]">
                    Internet connection required
                </p>
            </section>
        </>
    );
}
