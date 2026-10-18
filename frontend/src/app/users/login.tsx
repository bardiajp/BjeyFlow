import { useEffect } from 'react';
import { Info, Copyright } from 'lucide-react';
import './login.css';
import LoginForm from './components/login-form';
import AccountHelp from './components/account-help';
import ballIcon from '@/assets/ball.svg';

export default function Login() {
    useEffect(() => {
        const previousTitle = document.title;
        document.title = 'Sign in · BjeyFlow';
        return () => {
            document.title = previousTitle;
        };
    }, []);

    return (
        <div className="grid h-dvh w-full grid-cols-1 grid-rows-[minmax(0,1fr)] p-4 lg:grid-cols-2">
            <div className={'relative hidden min-h-0 min-w-0 overflow-hidden rounded-3xl lg:block'}>
                <img
                    src={'/images/login.png'}
                    className="absolute inset-0 h-full w-full object-cover"
                    alt=""
                />
            </div>
            <div
                className={
                    'flex min-h-0 min-w-0 flex-col items-center justify-between overflow-y-auto px-10 py-4'
                }
            >
                <div className={'flex w-full justify-between'}>
                    <span className={'text-muted font-semibold'}>BjeyFlow</span>
                    <AccountHelp className={'text-muted flex items-center gap-2 font-semibold'}>
                        <Info size={15} />
                        <span className={'text-muted font-semibold'}>Need help?</span>
                    </AccountHelp>
                </div>
                <LoginForm />
                <div className={'flex w-full justify-between'}>
                    <div className={'flex items-center gap-2'}>
                        <Copyright size={15} />
                        <span className={'text-muted font-semibold'}>
                            BjeyFlow. A little every day.
                        </span>
                    </div>
                    <img src={ballIcon} alt="" />
                </div>
            </div>
        </div>
    );
}
