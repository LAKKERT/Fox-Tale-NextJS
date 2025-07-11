'use client';

import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/supabaseClient";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface Props {
    userRole: string;
    modeChange: (editMode: boolean, deleteMode: boolean) => void;
    isDelete: boolean;
    isEditMode: boolean;
    params: Record<string, string | string[]> | null;
    cookies: {
        auth_token?: unknown;
    }
    router: AppRouterInstance;
}

export function ToolBar({ userRole, modeChange, isDelete, isEditMode, params, cookies, router }: Props) {

    const onDelete = async () => {
        try {
            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const { error } = await supabase
                    .from('universe')
                    .delete()
                    .eq('id', params?.id);
                if (error) console.error(error);
            } else {
                const response = await fetch(`/api/universe/universeAPI?universeID=${params?.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${cookies.auth_token}`
                    }
                })

                if (response.ok) {
                    router.push('/universe');
                } else {
                    console.log('error occurred');
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="w-full flex flex-col items-center mt-5">
            {userRole === "admin" && (
                <div className="flex flex-row gap-3 justify-between">
                    <button type="button" onClick={() => {
                        if (isDelete === true) {
                            modeChange(true, false)
                        } else {
                            modeChange(!isEditMode, false)
                        }
                    }}>EDIT</button>
                    <button type="button" onClick={() => {
                        modeChange(false, !isDelete);
                    }} >DELETE</button>
                </div>
            )}

            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: isDelete ? '60px' : '0px', opacity: isDelete ? 1 : 0 }}
                transition={{ duration: .3 }}
                className={`flex flex-col items-center ${userRole === 'admin' ? 'block' : 'hidden'}`}
            >
                <p className={`${isDelete ? 'block' : 'hidde pointer-events-none'}`}>Do you really want to delete this article?</p>
                <div className={`flex flex-row justify-center gap-2 ${isDelete ? 'block' : 'hidde pointer-events-none'}`}>
                    <button type="button" onClick={() => onDelete()}>Yes</button>
                    <button type="button" onClick={() => modeChange(false, false)} >No</button>
                </div>
            </motion.div>
        </div>
    )
}