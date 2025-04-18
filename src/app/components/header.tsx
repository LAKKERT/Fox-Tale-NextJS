"use client";
import Image from "next/image";
import { K2D } from "next/font/google";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useCookies } from "react-cookie";
import Cookies from 'js-cookie';
import { useUserStore } from '@/stores/userStore';


const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

const MobileMode: React.FC<{ isMenuOpen: boolean; toggleMenu: () => void }> = ({ isMenuOpen, toggleMenu }) => (
    <div className="lg:hidden absolute right-0 mr-5 cursor-pointer">
        <div className={`flex flex-col gap-2`} onClick={toggleMenu}>
            <div className={`w-10 h-1 rounded bg-white transform duration-500 ease-in-out ${isMenuOpen ? "opacity-0" : "opacity-100"}`}></div>
            <div className="relative">
                <div className={`w-10 h-1 rounded bg-white transform duration-500 ease-in-out origin-center ${isMenuOpen ? "rotate-[-45deg]" : "rotate-[0deg]"}`}></div>
                <div className={`absolute top-0 opacity-0 w-10 h-1 rounded bg-white transform duration-500 ease-in-out origin-center ${isMenuOpen ? "opacity-100 rotate-[45deg]" : "rotate-[0deg]"}`}></div>
            </div>
            <div className={`w-10 h-1 rounded bg-white transform duration-500 ease-in-out ${isMenuOpen ? "opacity-0" : "opacity-100"}`}></div>
        </div>
    </div>
);

export function Header() {
    const {
        isAuth, 
        userData,
        setUserData, 
        setIsAuth 
    } = useUserStore();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
    const [cookies] = useCookies(['auth_token']);


    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    }

    const optionsMenu = () => {
        setIsOptionsMenuOpen(!isOptionsMenuOpen);
    }

    const destroyCookie = () => {
        Cookies.remove('auth_token');
        window.location.reload();
    }

    useEffect(() => {
        if (cookies.auth_token) {
            setIsAuth(true);
            const fetchUserData = async () => {
                if (cookies.auth_token && (!userData || !isAuth)) {
                    try {
                        const response = await fetch('/api/users/getAllUserDataAPI', {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${cookies.auth_token}`
                            },
                        });
    
                        const result = await response.json();
                        
                        if (response.ok) {
                            setUserData(result.result);
                        } else {
                            console.error("Error fetching user data", result.message);
                            setUserData(null);
                        }
    
                    } catch (error) {
                        console.error("Fetching data error", error);
                        setUserData(null);
                    }
                }
            };
            fetchUserData();
        } else {
            setIsAuth(false);
            setUserData(null);
        }
    }, [cookies, setUserData, setIsAuth]);

    return (
        <div 
            className={`fixed w-full z-50 select-none`}>
            <div className={`fixed top-0 z-50 h-[100px] w-full px-3 flex lg:justify-between items-center bg-black ${MainFont.className} ${isOptionsMenuOpen ? "outline outline-[rgba(245,136,90,.9)]" : "outline-none"}`}>

                <MobileMode isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

                <Link href='/' className="mx-auto lg:mx-0">
                    <Image src="/header/logo.svg" alt="Logo" width={100} height={75} />
                </Link>

                <div className="hidden lg:flex flex-row items-center gap-5">
                    {/* <Link href="#">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.9)] transition duration-150 ease-in-out ">
                            about
                        </div>
                    </Link> */}

                    <Link href="/news">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.9)] transition duration-150 ease-in-out ">
                            News
                        </div>
                    </Link>

                    <Link href="/universe">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.9)] transition duration-150 ease-in-out ">
                            Universe
                        </div>
                    </Link>

                    <Link href="/characters">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.9)] transition duration-150 ease-in-out ">
                            Characters
                        </div>
                    </Link>

                    <Link href="/support">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.9)] transition duration-150 ease-in-out ">
                            Support
                        </div>
                    </Link>
                </div>
                {isAuth && userData ?
                    <div className="relative hidden lg:block">
                        <button onClick={optionsMenu}>
                            <div className={`py-1 px-3 rounded uppercase select-text text-white text-2xl hover:bg-[rgba(245,136,90,.9)]${isOptionsMenuOpen ? "text-red-500" : "text-white"}`}>
                                <p>{userData.username}</p>
                            </div>
                        </button>
                        <div className={`absolute flex flex-col justify-center items-center h-auto w-[250px] px-7 py-2 top-[70px] left-[-134px] gap-2 rounded-b-lg bg-[#000000] text-white text-2xl border-4 border-t-0 border-[rgba(245,136,90,.9)] ${isOptionsMenuOpen ? "flex flex-col" : "hidden"}`}>
                            <p className="w-full text-center border-b-2 border-[rgba(245,136,90,.9)]">{userData.username}</p>
                            {userData && (
                                <Link href={`/profile/verify`} key={userData.id} className="uppercase text-left hover:bg-[rgba(245,136,90,.9)] py-1 px-3 rounded transition duration-150 ease-in-out ">
                                    <div>
                                        PROFILE
                                    </div>
                                </Link>
                            )}
                            <button onClick={destroyCookie} className="uppercase text-left hover:bg-[rgba(245,136,90,.9)] py-1 px-3 rounded transition duration-150 ease-in-out ">
                                <div>
                                    LOGOUT
                                </div>
                            </button>
                        </div>
                    </div>
                    :
                    <div className="hidden lg:flex flex-col gap-2">
                        <Link href="/signup">
                            <div className="py-1 px-5 rounded uppercase text-white text-2xl bg-[rgba(245,136,90,.9)] hover:bg-[rgba(245,136,90,.8)] transition duration-150 ease-in-out  ">
                                Sign up
                            </div>
                        </Link>

                        <Link href="/login">
                            <div className="flex justify-center items-center py-1 px-3 uppercase text-black text-2xl rounded bg-[rgb(255,255,255)] hover:bg-[rgba(255,255,255,0.8)] transition duration-150 ease-in-out ">
                                Sign in
                            </div>
                        </Link>
                    </div>
                }
            </div>

            <div className={`absolute right-0 block lg:hidden bg-[#000000b6] h-screen w-full sm:w-1/2 transform duration-500 ease-in-out ${isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}`}>
                <div className="flex lg:hidden flex-col items-start p-5 gap-5">
                    {isAuth && userData ?
                        <div className="w-full">
                            <div className={`w-full py-1 px-3 rounded uppercase text-center text-white text-2xl`}>
                                <p>-{userData.username}-</p>
                            </div>
                        </div>

                        :
                        null
                    }

                    {userData && (
                        <Link href={`/profile/verify`} key={userData.id} className={`w-full py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,0.7)] transition duration-150 ease-in-out ${isAuth ? "block" : "hidden"}`}>
                            <div>
                                PROFILE
                            </div>
                        </Link>
                    )}

                    {/* <Link href="#" className="w-full">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,0.7)] transition duration-150 ease-in-out ">
                            about
                        </div>
                    </Link> */}

                    <Link href="/news" className="w-full">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.7)] transition duration-150 ease-in-out ">
                            News
                        </div>
                    </Link>

                    <Link href="/universe" className="w-full">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.7)] transition duration-150 ease-in-out ">
                            Universe
                        </div>
                    </Link>

                    <Link href="/characters" className="w-full">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.7)] transition duration-150 ease-in-out ">
                            Characters
                        </div>
                    </Link>

                    <Link href="/support" className="w-full">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.7)] transition duration-150 ease-in-out ">
                            Support
                        </div>
                    </Link>

                    <button onClick={destroyCookie} className={`w-full py-1 px-3 rounded uppercase text-left text-white text-2xl hover:bg-[rgba(245,136,90,0.7)] transition duration-150 ease-in-out ${isAuth ? "block" : "hidden"}`}>
                        <div>
                            LOGOUT
                        </div>
                    </button>

                    {!isAuth ?

                        <Link href="/signup" className="w-full">
                            <div className="flex justify-center items-center py-1 px-3 rounded uppercase text-white text-2xl bg-[rgba(245,136,90,.9)] hover:bg-[rgba(245,136,90,.8)] transition duration-150 ease-in-out  ">
                                Sign up
                            </div>
                        </Link>
                        :
                        null
                    }

                    {!isAuth ?

                        <Link href="/login" className="w-full">
                            <div className="flex justify-center items-center py-1 px-3 uppercase text-black text-2xl rounded bg-[rgb(255,255,255)] hover:bg-[rgba(255,255,255,0.8)] transition duration-150 ease-in-out ">
                                Sign in
                            </div>
                        </Link>
                        :
                        null
                    }
                </div>
            </div>
        </div>
    );
}