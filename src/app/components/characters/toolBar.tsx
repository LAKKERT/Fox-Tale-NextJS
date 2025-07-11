'use client';

import { supabase } from "@/lib/supabase/supabaseClient";
import { motion } from "framer-motion";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface Props {
    userRole: string | undefined;
    isEditMode: boolean,
    isDelete: boolean;
    router: AppRouterInstance;
    params: Record<string, string | string[]> | null;
    cookies: {
        auth_token?: unknown;
    };
    modeChange: (editMode: boolean, deleteMode: boolean) => void
}

export function ToolBar({ userRole, isEditMode, isDelete, router, params, cookies, modeChange }: Props) {

    const onDelete = async () => {
        try {
            if (process.env.NEXT_PUBLIC_ENV === 'production') {
                const { error } = await supabase
                    .from('characters')
                    .delete()
                    .eq('id', params?.id)
                if (error) console.error(error)
            } else {
                const response = await fetch(`/api/characters/charactersAPI?characterID=${params?.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${cookies.auth_token}`
                    }
                })

                if (response.ok) {
                    router.push('/characters');
                } else {
                    console.error('error occurred');
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="flex flex-col items-center">
            <div className="flex flex-row justify-between mt-2">
                {userRole === "admin" && (
                    <div className="flex flex-row gap-3">
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
            </div>

            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: isDelete ? '60px' : '0px', opacity: isDelete ? 1 : 0 }}
                transition={{ duration: .3 }}
                className={`${userRole === 'admin' ? 'block' : 'hidden'}`}
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