import {useEffect} from 'react';
import {Info, ArrowRight, Sun, Copyright} from 'lucide-react';
import './login.css';
import {LabeledInput} from "@/components/form/labeled"
import {Checkbox} from "@/components/ui/checkbox"
import {Button} from "@/components/ui/button"
import {Link} from "react-router"
import ballIcon from "@/assets/ball.svg"

export default function Login() {
    return (
        <div className="grid h-dvh w-full grid-cols-1 grid-rows-[minmax(0,1fr)] p-4 lg:grid-cols-2">
            <div className={"relative hidden min-h-0 min-w-0 overflow-hidden rounded-3xl lg:block"}>
                <img src={"/images/login.png"}
                     className="absolute inset-0 h-full w-full object-cover"/>
            </div>
            <div className={"flex min-h-0 min-w-0 flex-col items-center justify-between overflow-y-auto px-10 py-4"}>
                <div className={"flex justify-between w-full"}>
                    <span className={"font-semibold text-muted"}>
                       BjeyFlow
                    </span>
                    <div className={"flex gap-2 font-semibold text-muted items-center"}>
                        <Info size={15}/>
                        <span className={"font-semibold text-muted"}>
                            Need help?
                        </span>
                    </div>
                </div>
                <form className="flex flex-col w-full max-w-170 gap-6">
                    <div className={"flex gap-2 items-center"}>
                        <Sun className={"text-secondary"}/>
                        <span className={"font-semibold"}>
                            YOUR SPACE TO FOCUS
                        </span>
                    </div>
                    <h1 className={"font-bold text-[38px]"}>Welcome back.</h1>
                    <p>Sign in to BjeyFlow and pickup where you left off.</p>
                    <LabeledInput
                        label="Username"
                        className={"py-6"}
                    />
                    <LabeledInput
                        label="Password"
                        className={"py-6"}
                    />
                    <div className={"flex justify-between"}>
                        <div className={"flex gap-2 items-center"}>
                            <Checkbox className={"w-[17px] h-[17px]"}/>
                            <span className={"text-muted font-semibold text-xs"}>Remember me</span>
                        </div>
                        <span className={"font-semibold text-muted"}>
                        Forgot password?
                    </span>
                    </div>
                    <Button className={"py-6 gap-2"}>
                        <span className={"font-bold"}>
                            Sign in
                        </span>
                        <ArrowRight size={15}/>
                    </Button>
                    <span className={"w-full text-center text-muted font-semibold"}>
                        New to BjeyFlow? <Link className={"underline text-muted font-semibold"}>
                        Create an account
                    </Link>
                    </span>
                </form>
                <div className={"flex justify-between w-full"}>
                   <div className={"flex gap-2 items-center"}>
                       <Copyright size={15}/>
                       <span className={"font-semibold text-muted font-semibold"}>BjeyFlow. A little every day.</span>
                   </div>
                    <img src={ballIcon}/>
                </div>
            </div>
        </div>
    );
}
