'use client';

import { NewsStructure } from "@/lib/types/news";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/supabaseClient";
import { useRouter } from "next/navigation";
import { useCookies } from "react-cookie";

interface Props {
    postData: NewsStructure | undefined;
    userRole: string | undefined;
    editModeActive: boolean;
    deletePost: boolean;
    editModeChange: (editMode: boolean, deleteMode: boolean) => void;
    params: Record<string, string | string[]> | null;
}

export function ToolBar({ postData, userRole, editModeActive, deletePost, editModeChange, params }: Props) {

    const [cookies] = useCookies(['roleToken']);
    const router = useRouter();

    const handleDeletePost = async () => {
        try {
            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const { error } = await supabase
                    .from('news')
                    .delete()
                    .eq('id', params?.id)
                if (error) console.error(error);
                const { error: contentBlocksError } = await supabase
                    .from('content_blocks')
                    .delete()
                    .eq('news_id', params?.id)
                if (contentBlocksError) console.error(contentBlocksError);

                router.push('/news')
            } else {
                const response = await fetch(`/api/news/addNewsAPI`, {
                    method: 'DELETE',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': `Bearer ${cookies.roleToken}`
                    },
                    body: JSON.stringify({ postID: params?.id })
                });

                const result = await response.json();

                if (response.ok) {
                    router.push(result.redirectUrl);
                } else {
                    console.error('Error deleting post:');
                }
            }
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    }

    return (
        <div>
            <div className="w-full flex flex-row justify-between">
                {postData?.add_at ? (
                    <time className="text-left text-base" dateTime={`${new Date(postData?.add_at).toISOString().split('T')[0]}`}>
                        {new Date(postData.add_at).toLocaleString("ru-RU", {
                            dateStyle: 'short'
                        })}
                    </time>
                ) : (
                    null
                )}
                {userRole === "admin" && (
                    <div className="flex flex-row gap-3">
                        <button type="button" onClick={() => {
                            if (deletePost === true) {
                                editModeChange(true, false)
                            } else {
                                editModeChange(!editModeActive, false)
                            }
                        }}>EDIT</button>

                        <button type="button" onClick={() => {
                            editModeChange(false, !deletePost);
                        }}>DELETE</button>
                    </div>
                )}
            </div>

            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: deletePost ? '60px' : '0px', opacity: deletePost ? 1 : 0 }}
                transition={{ duration: .3 }}
                className={`${userRole === 'admin' ? 'block' : 'hidden'}`}
            >
                <p>Do you really want to delete this article?</p>
                <div className="flex flex-row justify-center gap-2">
                    <button type="button" onClick={() => handleDeletePost()} >Yes</button>
                    <button type="button" onClick={() => editModeChange(false, false)}>No</button>
                </div>
            </motion.div>
        </div>
    )
}