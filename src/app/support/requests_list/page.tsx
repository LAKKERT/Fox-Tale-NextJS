'use client';
import { Header } from '@/app/components/header';
import Image from 'next/image';
import { Loader } from "@/app/components/load";
import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { K2D } from "next/font/google";
import { supabase } from "@/lib/supabase/supabaseClient";
import { Requests } from "@/lib/interfaces/supportChat";

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

const ITEMS_PER_PAGE = 6;

export default function AllSupporRequests() {

    const [isLoading, setIsLoading] = useState(true);
    const [requests, setRequests] = useState<Requests[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [cookies] = useCookies(['roleToken']);
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredRequests, setFilteredRequests] = useState<Requests[]>([]);

    const handleRole = (role: string) => {
        if (role !== 'admin') {
            router.push('/');
        } else {
            setIsLoading(false);
        };
    };

    useEffect(() => {
        const fetchAllRequests = async () => {
            try {
                if (process.env.NEXT_PUBLIC_ENV === 'production') {
                    const { data, error } = await supabase
                        .from('chat_room')
                        .select('*')
                    if (error) {
                        console.error(error);
                    } else {
                        setRequests(data);
                    }
                } else {
                    const response = await fetch('/api/support/getAllRequestsAPI', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${cookies.roleToken}`
                        }
                    })

                    const result = await response.json();

                    if (response.ok) {
                        setRequests(result.result || []);
                    } else {
                        console.error('Error fetching data');
                        router.push(result.redirectUrl);
                    }
                }
            } catch (error) {
                console.error("Error fetching requests:", error);
            }
        };

        fetchAllRequests();

    }, [cookies, router]);

    useEffect(() => {
        if (Array.isArray(requests)) {
            const filteredRequests = requests.filter((req) =>
                req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.status.toString().includes(searchTerm.toLowerCase())
            );

            setFilteredRequests(filteredRequests);
        }
    }, [searchTerm, requests]);

    const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);

    const paginatedRequests = filteredRequests.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    }
    return (
        <div className={`min-h-[calc(100vh-100px)] mt-[100px]`}>
            <div className="fixed inset-0 -z-10">
                <Image
                    src="/login/gradient_bg.png"
                    alt="background"
                    className="w-full h-full object-cover"
                    fill
                />
            </div>

            <div className="flex flex-col">
                <Header role={handleRole}/>
                <div className={`w-full h-full flex flex-col items-center gap-4 mx-auto px-4 ${MainFont.className} text-[#F5DEB3] caret-transparent ${MainFont.className}`}>
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
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: .3 }}
                            className="h-full w-full flex flex-col items-center gap-5 mt-3"
                        >
                            <input
                                className="focus:caret-white peer w-full max-w-[1070px] h-11 block rounded-md outline-none focus:outline-none transition duration-75 ease-in-out focus:outline-2 focus:outline-white border-0 py-[9px] px-[10px] text-lg tracking-wider shadow-[8px_9px_6px_0px_rgba(34,60,80,0.2)] bg-[rgba(6,6,6,.65)] placeholder:text-white"
                                type="text"
                                onChange={(e) => setSearchTerm(e.target.value)}
                                value={searchTerm}
                                placeholder="Search by ID, Title, or Status"
                            />

                            <div className="hidden md:grid grid-cols-4 gap-2 p-4 w-full max-w-[1070px] text-center text-xl uppercase bg-[rgba(6,6,6,.65)] shadow-[8px_9px_6px_0px_rgba(34,60,80,0.2)] rounded-xl">
                                <div className="border-r-2 border-white">
                                    id
                                </div>

                                <div className="border-r-2 border-white">
                                    title
                                </div>

                                <div className="border-r-2 border-white">
                                    status
                                </div>

                                <div>
                                    link
                                </div>
                            </div>

                            <div className={`flex flex-col items-center gap-5 w-full`}>
                                {paginatedRequests.map(request => (
                                    <motion.div
                                        key={request.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex flex-col md:grid grid-cols-4 gap-4 md:gap-2 p-4 min-w-5xl w-full max-w-[1070px] text-center text-md text-balance bg-[rgba(6,6,6,.65)] rounded-xl shadow-[8px_9px_6px_0px_rgba(34,60,80,0.2)] transition-all duration-150 ease-in-out hover:outline outline-[#f5885a]"
                                    >
                                        <div className="border-b-2 md:border-r-2 md:border-b-0 border-white flex justify-center items-center truncate">
                                            {request.title}
                                        </div>

                                        <div className="border-b-2 md:border-r-2 md:border-b-0 border-white flex justify-center items-center">
                                            {request.id}
                                        </div>

                                        <div className={`border-b-2 md:border-r-2 md:border-b-0 border-white flex justify-center items-center ${request.status ? 'text-green-600' : 'text-red-500'}`}>
                                            {request.status === true ? 'solved' : 'not solved'}
                                        </div>

                                        <Link href={`/support/${request.id}`} className="w-full flex justify-center">
                                            <div className="flex justify-center items-center w-[150px] h-[50px] text-lg tracking-wider transition-colors duration-75 rounded border border-[#F5DEB3] bg-[#C2724F] hover:bg-[#b66847] uppercase select-none">
                                                OPEN
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}

                                <div className="flex justify-center gap-2 my-4">
                                    {Array.from({ length: totalPages }, (value, i) => i + 1)
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
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}