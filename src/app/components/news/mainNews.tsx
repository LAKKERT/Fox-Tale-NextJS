'use client';
import { Loader } from "@/app/components/load";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { K2D } from "next/font/google";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/supabaseClient";

const ITEMS_PER_PAGE = 8;

const MainFont = K2D({
    style: "normal",
    subsets: ["latin"],
    weight: "400",
});

type NewsItem = {
    id: number;
    title: string;
    description: string;
    add_at: string;
    content_blocks: Array<{
        content: Array<{
            content: string;
        }>;
    }>;
};

interface userRoleInt {
    role?: string
}

export function NewsPageComponent({role}: userRoleInt) {
    const [allNews, setAllNews] = useState<NewsItem[]>([]);
    const [countOfNews, setCountOfNews] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [cookies] = useCookies(['roleToken']);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAllNews = async () => {
            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const { data, error } = await supabase
                    .from('news')
                    .select(`
                        id,
                        title,
                        description,
                        add_at,
                        content_blocks:content_blocks!inner (
                        id,
                        order_index,
                        content:content (
                            id,
                            order_index,
                            content
                        )
                        )
                    `)
                    .order('add_at', { ascending: false })
                if (error) console.error(error)
                if (data) {
                    data.map((item) => {
                        item.content_blocks.sort((a, b) => a.order_index - b.order_index);

                        item.content_blocks.forEach(block => {
                            block.content.sort((a, b) => a.order_index - b.order_index);
                        });

                    })
                    setAllNews(data)
                    setCountOfNews(data.length);
                    setTimeout(() => {
                        setIsLoading(false);
                    }, 300);
                }
            } else {
                try {
                    const response = await fetch('/api/news/fetchAllNewsAPI', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${cookies.roleToken}`
                        }
                    });

                    const result = await response.json();

                    if (response.ok) {
                        setAllNews(result.result);
                        setCountOfNews(result.result.length);
                        setTimeout(() => {
                            setIsLoading(false);
                        }, 300);
                    } else {
                        console.error('Error fetching news:', result);
                    }

                } catch (error) {
                    console.error('Error fetching news:', error);
                    router.push('/');
                }
            }
        }
        fetchAllNews();
    }, [cookies, router]);

    const totalPages = Math.ceil(countOfNews / ITEMS_PER_PAGE);

    const paginatedNews = allNews?.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    }

    return (
        <div className={`min-h-[calc(100vh-100px)] max-w-[1000px] xl:max-w-[1110px] flex flex-col items-center gap-4 mx-auto px-4 ${MainFont.className} text-[#F5DEB3] caret-transparent`}>
            {isLoading ? (
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-black fixed inset-0 flex justify-center items-center"
                >
                    <Loader />
                </motion.div>
            ) : (
                <motion.div
                    className="w-full py-5 opacity-100"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="h-full flex flex-col gap-5"
                    >
                        <div className="h-[120px] flex flex-col gap-4 text-center justify-center items-center">
                            <h2 className="uppercase text-base md:text-2xl">-NEWS-</h2>
                            <p className="text-base md:text-lg">Here you can learn something new about FOX TALE</p>
                            <Link href={'/news/create_new'} className={`flex flex-row items-center justify-end gap-2 uppercase text-xl py-2 px-4 text-white text-center rounded hover:bg-[#C2724F] transition duration-150 ease-in-out ${role === 'admin' ? '' : 'hidden'} `}>
                                add post
                            </Link>
                        </div>

                        <div className="flex flex-col justify-center items-center flex-wrap gap-5">
                            {paginatedNews && paginatedNews.length > 0 ? (
                                paginatedNews.map((newsItem) => {
                                    return (
                                        <div key={newsItem.id} className="lg:max-h-[220px] flex flex-col lg:grid lg:grid-cols-[320px_minmax(656px,1fr)] xl:grid-cols-[350px_minmax(716px,1fr)] gap-3">
                                            <div className="h-full w-[290px] md:w-[320px] xl:w-[350px]">
                                                <div className="relative py-2 lg:px-4 md:p-4 w-[290px] md:w-[320px] h-[190px] xl:w-[350px] xl:h-[220px]">
                                                    <Image src="/home/outline_card.svg" alt="outline" fill className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-[1] object-fill object-center" />
                                                    <div className="relative flex flex-col p-2 bg-[#C2724F] h-full z-[0] rounded">
                                                        <div className="text-center uppercase text-lg font-light">
                                                            {newsItem.title}
                                                        </div>

                                                        <div className="text-base p-2 overflow-hidden">
                                                            <p className="line-clamp-3 xl:line-clamp-4">
                                                                {newsItem.description}
                                                            </p>
                                                        </div>

                                                        <div className="mt-auto pl-2 pb-1">
                                                            <p className="text-sm">
                                                                {new Date(newsItem.add_at).toLocaleString("ru-RU", {
                                                                    dateStyle: 'short'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-full h-full lg:hidden flex flex-col lg:py-4 md:px-4 text-balance">
                                                    <p className="line-clamp-6">{newsItem.content_blocks[0].content[0].content || ''}</p>
                                                    <Link href={`/news/${newsItem.id}`} className="py-1 px-3 uppercase flex flex-row gap-1 mt-auto self-end items-center rounded hover:bg-[rgba(245,136,90,.9)] transition duration-150 ease-in-out">
                                                        more •
                                                        <Image src="/home/Arrow.svg" alt="arrow" width={25} height={25} className="mt-[2px]" />
                                                    </Link>
                                                </div>
                                            </div>

                                            <div className="w-full h-full hidden lg:flex flex-col sm:py-4 text-balance">
                                                <p className="line-clamp-6">{newsItem.content_blocks[0].content[0].content || ''}</p>
                                                <Link href={`/news/${newsItem.id}`} className="py-1 px-3 uppercase flex flex-row gap-1 mt-auto self-end items-center rounded hover:bg-[rgba(245,136,90,.9)] transition duration-150 ease-in-out">
                                                    more •
                                                    <Image src="/home/Arrow.svg" alt="arrow" width={25} height={25} className="mt-[2px]" />
                                                </Link>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div>No news available</div>
                            )}
                        </div>
                    </motion.div>
                    <div className="flex justify-center gap-2 mt-4">
                        {Array.from({ length: totalPages }, (value, i) => i + 1)
                            .filter(page => {
                                const startPage = Math.max(1, currentPage - 1);
                                const endPage = Math.min(totalPages, currentPage + 1);
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
                            )) || []}
                    </div>
                </motion.div>
            )}
        </div>
    );
}