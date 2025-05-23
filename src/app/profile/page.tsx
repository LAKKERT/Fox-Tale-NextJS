"use client";
import { Header } from "../components/header";
import { Loader } from "@/app/components/load";
import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserData } from "@/lib/types/supportChat";
import { K2D } from "next/font/google";
import { supabase } from "@/lib/supabase/supabaseClient";

const ITEMS_PER_PAGE = 8;

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

export default function AllUsersProfiles() {
    const [isLoading, setIsLoading] = useState(true);
    const [usersData, setUsersData] = useState<UserData[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortedUsersData, setSortedUsersData] = useState<UserData[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [cookies] = useCookies(["auth_token"]);
    const router = useRouter();

    const handleRole = async (role: string) => {

        if (role === 'admin') {
            try {
                if (process.env.NEXT_PUBLIC_ENV === 'production') {
                    const { data, error } = await supabase
                        .from('users')
                        .select('id')
                    console.log(data,error);
                } else {
                    const response = await fetch(`/api/users/getAllusersAPI`, {
                        method: "GET",
                        headers: {
                            'Authorization': `Bearer ${cookies.auth_token}`
                        }
                    });
    
                    const users = await response.json();
    
                    if (response.ok) {
                        setIsLoading(false);
                        setUsersData(users.result || []);
                    } else {
                        console.error("Error fetching users:");
                    }
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        } else {
            router.push('/');
        }
    }

    useEffect(() => {
        if (Array.isArray(usersData)) {
            const filteredUsers = usersData.filter((user) =>
                user?.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user?.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSortedUsersData(filteredUsers);
        }
    }, [searchTerm, usersData]);

    const totalPages = Math.ceil(sortedUsersData.length / ITEMS_PER_PAGE);

    const paginatedRequests = sortedUsersData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    }

    return (
        <div className={`w-full h-full bg-[url('/login/gradient_bg.png')] object-cover bg-cover bg-center bg-no-repeat overflow-hidden ${MainFont.className} caret-transparent`}>
            <Header role={handleRole} />
            <div className={`min-h-[calc(100vh-100px)] w-full mt-[100px] pt-8 flex flex-col justify-top items-center gap-5 text-white caret-transparent`}>
                {isLoading ? (
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: .3 }}
                        className=" bg-black fixed inset-0 flex justify-center items-center"
                    >
                        <Loader />
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`lg:max-w-6xl w-full mx-auto ${MainFont.className} py-4 pt-8 flex flex-col justify-top items-center gap-5 text-white caret-transparent`}
                    >
                        <h1 className="text-4xl">All Users</h1>
                        <input
                            className="peer max-w-6xl w-[1070px] h-11 block rounded-md outline-none focus:outline-none transition duration-75 ease-in-out focus:outline-2 focus:outline-white border-0 py-[9px] pl-10 text-lg tracking-wider shadow-[8px_9px_6px_0px_rgba(34,60,80,0.2)] bg-[rgba(6,6,6,.65)] placeholder:text-white"
                            placeholder="Search by ID, Username, Roles, or Email"
                            onChange={(e) => setSearchTerm(e.target.value)}
                            value={searchTerm}
                        />

                        {sortedUsersData.length > 0 ? (
                            <div className="max-w-6xl flex flex-col gap-5">
                                <div className="grid grid-cols-5 gap-2 p-4 min-w-5xl w-[1070px] text-center text-xl uppercase bg-[rgba(6,6,6,.65)] shadow-[8px_9px_6px_0px_rgba(34,60,80,0.2)] rounded-xl">
                                    <div className="border-r-2 border-white">
                                        id
                                    </div>

                                    <div className="border-r-2 border-white">
                                        username
                                    </div>

                                    <div className="border-r-2 border-white">
                                        Role
                                    </div>

                                    <div className="border-r-2 border-white">
                                        email
                                    </div>

                                    <div>
                                        Profile link
                                    </div>
                                </div>

                                <div className="flex flex-col gap-5">
                                    {paginatedRequests.map(data => (
                                        <div key={data?.id} className="grid grid-cols-5 gap-2 p-4 min-w-5xl w-[1070px] text-center text-md text-balance bg-[rgba(6,6,6,.65)] rounded-xl shadow-[8px_9px_6px_0px_rgba(34,60,80,0.2)] transition-all duration-150 ease-in-out hover:outline outline-[#f5885a]">
                                            <div className="border-r-2 border-white flex justify-center items-center">
                                                {data?.id}
                                            </div>

                                            <div className="border-r-2 border-white flex justify-center items-center">
                                                {data?.username}
                                            </div>

                                            <div className="border-r-2 border-white flex justify-center items-center">
                                                {data?.email}
                                            </div>

                                            <div className="flex justify-center items-center">
                                                <Link href={`/profile/[id]`} as={`/profile/${data?.id}`}>Profile link</Link>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex justify-center gap-2 mt-4">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(page => {
                                                const startPage = Math.max(1, currentPage - 2);
                                                const endPage = Math.min(totalPages, currentPage + 3);
                                                return page >= startPage && page <= endPage;
                                            })
                                            .map(page => (
                                                <button
                                                    key={page}
                                                    className={`px-4 py-2 rounded ${currentPage === page
                                                        ? "bg-[#f5885a] text-white"
                                                        : "bg-gray-200 text-gray-800"
                                                        }`}
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <p>No users found...</p>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
