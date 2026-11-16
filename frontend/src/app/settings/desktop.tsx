import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Image, MonitorDown, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { axiosInstance } from '@/lib/api';

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

export function DesktopSettings() {
    const os = currentOS();
    const release = useQuery({
        queryKey: ['desktop-releases'],
        queryFn: async () =>
            (await axiosInstance.get<DesktopRelease>('api/desktop/releases/')).data,
        staleTime: 300_000,
        retry: false,
    });
    const assets = release.data?.assets;
    const download = (
        key: Asset,
        label: string,
        icon = <Download size={15} />,
        outline = false
    ) => {
        const url = assets?.[key];
        return url ? (
            <Button
                key={key}
                render={<a href={url} />}
                variant={outline ? 'outline' : 'default'}
                className="gap-2 rounded-xl"
            >
                {icon}
                {label}
            </Button>
        ) : (
            <Button
                key={key}
                disabled
                variant={outline ? 'outline' : 'default'}
                className="gap-2 rounded-xl"
            >
                {icon}
                {label}
            </Button>
        );
    };
    return (
        <>
            <section className="border-input bg-card overflow-hidden rounded-[22px] border">
                <div className="surface-wash border-input relative overflow-hidden border-b p-5 sm:p-6">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-14 -right-12 size-36 rounded-full border-[22px] border-white/30"
                    />
                    <div className="relative flex items-start gap-3">
                        <span className="bg-card text-primary-foreground border-input flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm">
                            <MonitorDown size={20} strokeWidth={1.6} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-muted-foreground text-[9px] font-semibold tracking-[0.13em]">
                                TAKE YOUR FLOW WITH YOU
                            </p>
                            <h2 className="text-foreground mt-1 text-base font-semibold tracking-tight">
                                BjeyFlow for desktop
                            </h2>
                            <p className="text-muted-foreground mt-1.5 text-[11px] leading-relaxed">
                                A little more focus, right from your desktop.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-foreground text-xs font-medium">
                            Choose your download
                        </span>
                        <Badge
                            variant="outline"
                            className="bg-accent text-muted-foreground gap-1.5 px-2.5 py-1 text-[10px]"
                        >
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Detected: {os}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">
                        Online app for 64-bit Intel or AMD computers. Choose the package that fits
                        your system.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {os === 'Linux' && (
                            <>
                                {download('linux_deb', 'Linux · DEB')}
                                {download('linux_appimage', 'Linux · AppImage', undefined, true)}
                            </>
                        )}
                        {os === 'Windows' && (
                            <>
                                {download('windows_installer', 'Windows · Setup')}
                                {download(
                                    'windows_portable',
                                    'Windows · Portable',
                                    undefined,
                                    true
                                )}
                            </>
                        )}
                        {os !== 'Linux' && os !== 'Windows' && (
                            <p className="text-muted-foreground text-xs">
                                No desktop build for {os}. Linux and Windows downloads are available
                                below.
                            </p>
                        )}
                    </div>
                    {os === 'Linux' && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {download(
                                'appimage_guide',
                                'AppImage shortcut guide',
                                <FileText size={14} />,
                                true
                            )}
                            {download('appimage_icon', 'AppImage icon', <Image size={14} />, true)}
                        </div>
                    )}
                    <p
                        className="text-muted-foreground mt-3 text-[10px] leading-relaxed"
                        role="status"
                    >
                        {release.isPending
                            ? 'Checking for a release…'
                            : release.isError
                              ? 'Could not check releases right now. Please try again later.'
                              : release.data?.available
                                ? `${release.data.version} · x86-64`
                                : 'A desktop release has not been published yet.'}
                    </p>
                    <details className="border-input bg-accent/40 mt-4 rounded-xl border p-3">
                        <summary className="text-foreground cursor-pointer text-xs font-medium">
                            All downloads
                        </summary>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {download('linux_deb', 'Linux · DEB', undefined, true)}
                            {download('linux_appimage', 'Linux · AppImage', undefined, true)}
                            {download('windows_installer', 'Windows · Setup', undefined, true)}
                            {download('windows_portable', 'Windows · Portable', undefined, true)}
                            {download(
                                'appimage_guide',
                                'AppImage shortcut guide',
                                <FileText size={14} />,
                                true
                            )}
                            {download('appimage_icon', 'AppImage icon', <Image size={14} />, true)}
                        </div>
                    </details>
                </div>
            </section>
            <section className="border-input bg-card rounded-[22px] border p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="bg-accent text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl">
                            <Smartphone size={20} />
                        </span>
                        <div>
                            <h2 className="text-foreground text-sm font-semibold">
                                BjeyFlow for Android
                            </h2>
                            <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                                Signed APK · Android 7.0 or newer · Internet connection required
                            </p>
                        </div>
                    </div>
                    <Button
                        render={<a href="/downloads/BjeyFlow-android.apk" download />}
                        className="gap-2 rounded-xl"
                    >
                        <Download size={15} /> Android · APK
                    </Button>
                </div>
            </section>
        </>
    );
}
