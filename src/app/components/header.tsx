"use client"
import Image from "next/image";
import { K2D } from "next/font/google";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useCookies } from "react-cookie";
import Cookies from 'js-cookie';

import { getAllUserData } from "@/pages/api/users/usersAPI";
import { logoutHandler } from "@/pages/api/users/usersAPI";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

const MobileMode: React.FC<{ isMenuOpen: boolean; toggleMenu: () => void }> = ({ isMenuOpen, toggleMenu }) => (
    <div className="lg:hidden absolute right-0 mr-5">
        <div className={`flex flex-col gap-2 cursor-pointer onClick`} onClick={toggleMenu}>
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
    const [userData, setUserData] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
    const [isAuth, setIsAuth] = useState(false);

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
                try {
                    const data = await getAllUserData(cookies);
                    setUserData(data);
                } catch (error) {
                    console.log("fetching data error", error);
                }
            };
            fetchUserData();
        } else {
            setIsAuth(false);
        }
    }, [cookies]);

    return (
        <div className={`fixed w-full z-50 `}>
            <div className={`fixed top-0 z-50 h-[100px] w-full px-3 flex lg:justify-between items-center bg-black ${MainFont.className} ${isOptionsMenuOpen ? "outline outline-[rgba(245,136,90,.9)]" : "outline-none"}`}>

                <MobileMode isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

                <Link href="#" className="mx-auto lg:mx-0">
                    <Image src="/header/logo.svg" alt="Logo" width={100} height={75} />
                </Link>

                <div className="hidden lg:flex flex-row items-center gap-5">
                    <Link href="#">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.9)] transition duration-150 ease-in-out ">
                            about
                        </div>
                    </Link>

                    <Link href="#">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.9)] transition duration-150 ease-in-out ">
                            News
                        </div>
                    </Link>

                    <Link href="#">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.9)] transition duration-150 ease-in-out ">
                            Support
                        </div>
                    </Link>

                    <Link href="#">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.9)] transition duration-150 ease-in-out ">
                            Universe
                        </div>
                    </Link>
                </div>
                {isAuth && userData ?
                    <div className="relative hidden lg:block">
                        <button onClick={optionsMenu}>
                            <div className={`py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.9)]${isOptionsMenuOpen ? "text-red-500" : "text-white"}`}>
                                <p>{userData.username}</p>
                            </div>
                        </button>
                        <div className={`absolute flex flex-col justify-center items-center h-auto w-[250px] px-7 py-2 top-[70px] left-[-134px] gap-2 rounded-b-lg bg-[#000000] text-white text-2xl border-4 border-t-0 border-[rgba(245,136,90,.9)] ${isOptionsMenuOpen ? "flex flex-col" : "hidden"}`}>
                            <p className="w-full text-center border-b-2 border-[rgba(245,136,90,.9)]">{userData.username}</p>
                            {/* {userData && (
                                <Link href={`/profile/[id]`} as={`/profile/${userData.id}`} key={userData.id} className="uppercase text-left hover:bg-[rgba(245,136,90,.9)] py-1 px-3 rounded transition duration-150 ease-in-out ">
                                    <div>
                                        PROFILE
                                    </div>
                                </Link>
                            )} */}
                            {userData && (
                                <Link href={`/profile/verify`} as={`/profile/${userData.id}`} key={userData.id} className="uppercase text-left hover:bg-[rgba(245,136,90,.9)] py-1 px-3 rounded transition duration-150 ease-in-out ">
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
                        <Link href={`/profile/[id]`} as={`/profile/${userData.id}`} key={userData.id} className={`w-full py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,0.7)] transition duration-150 ease-in-out ${isAuth ? "block" : "hidden"}`}>
                            <div>
                                PROFILE
                            </div>
                        </Link>
                    )}

                    <Link href="#" className="w-full">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,0.7)] transition duration-150 ease-in-out ">
                            about
                        </div>
                    </Link>

                    <Link href="#" className="w-full">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.7)] transition duration-150 ease-in-out ">
                            News
                        </div>
                    </Link>

                    <Link href="#" className="w-full">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.7)] transition duration-150 ease-in-out ">
                            Support
                        </div>
                    </Link>

                    <Link href="#" className="w-full">
                        <div className="py-1 px-3 rounded uppercase text-white text-2xl hover:bg-[rgba(245,136,90,.7)] transition duration-150 ease-in-out ">
                            Universe
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