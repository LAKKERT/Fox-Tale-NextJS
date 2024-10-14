import { Header } from "../components/header";
import { SignUpPage } from "../components/signup/signupPage";
export default function SignUp() {
    return (
        <div className="h-[90vh] w-full mt-[100px] bg-[url('/login/gradient_bg.png')] flex justify-center items-center object-cover bg-cover bg-center bg-no-repeat overflow-hidden">
            <Header />
            <SignUpPage />
        </div>
    );
}