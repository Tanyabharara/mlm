"use client";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import ReactFlow, { Background, Controls, Node, Edge } from "reactflow";
import "reactflow/dist/style.css";

async function fetchNetwork(uid: string) {
    const res = await fetch("/api/network", {
        method: "POST",
        body: JSON.stringify({ uid }),
    });
    if (!res.ok) throw new Error("Failed to fetch network");
    return res.json();
}

export default function NetworkPage() {
    const { user } = useAuth();
    const { data, isLoading } = useQuery({
        queryKey: ["network", user?.uid],
        queryFn: () => fetchNetwork(user!.uid),
        enabled: !!user?.uid,
    });
    
    if (isLoading) return <div className="p-6">Loading Visual Tree...</div>;
    
    return (
        <div className="h-[600px] border border-gray-200 rounded-xl bg-white dark:bg-zinc-800">
            <ReactFlow nodes={data?.nodes || []} edges={data?.edges || []} fitView>
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}
