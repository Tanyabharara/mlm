"use client";
import React, { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState, ConnectionMode, Panel } from "reactflow";
import "reactflow/dist/style.css";
import { User, Crown, Users, Loader2 } from "lucide-react";

async function fetchNetwork(uid: string, idToken: string) {
    const res = await fetch("/api/network", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid }),
    });
    if (!res.ok) throw new Error("Failed to fetch network");
    return res.json();
}

const CustomNode = ({ data, selected }: { data: any; selected: boolean }) => {
    const isRoot = data.isRoot;
    
    return (
        <div
            className={`px-3 py-2.5 rounded-lg border transition-all ${
                isRoot
                    ? "bg-[#e6f0ff] dark:bg-[#1e2a3a] border-[#a8b5ff] dark:border-[#6b7fd7]"
                    : selected
                    ? "bg-white dark:bg-[#252932] border-[#a8b5ff] dark:border-[#6b7fd7]"
                    : "bg-white dark:bg-[#252932] border-[#e8ecf0] dark:border-[#2d3441] hover:border-[#c5d0ff] dark:hover:border-[#4a5a7a]"
            }`}
        >
            <div className="flex items-center gap-2">
                {isRoot ? (
                    <Crown className="w-3.5 h-3.5 flex-shrink-0 text-[#4a7cff] dark:text-[#6b9aff]" />
                ) : (
                    <User className={`w-3.5 h-3.5 flex-shrink-0 ${selected ? "text-[#4a7cff] dark:text-[#6b9aff]" : "text-[#a0aec0] dark:text-[#64748b]"}`} />
                )}
                <div className="min-w-0">
                    <p
                        className={`font-medium text-xs truncate ${
                            isRoot ? "text-[#2d3748] dark:text-[#e2e8f0]" : "text-[#2d3748] dark:text-[#e2e8f0]"
                        }`}
                    >
                        {data.label}
                    </p>
                    {data.level !== undefined && (
                        <p className={`text-xs mt-0.5 ${isRoot ? "text-[#718096] dark:text-[#94a3b8]" : "text-[#a0aec0] dark:text-[#64748b]"}`}>
                            Level {data.level}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
    input: CustomNode,
};

export default function NetworkPage() {
    const { user } = useAuth();
    const { data, isLoading } = useQuery({
        queryKey: ["network", user?.uid],
        queryFn: async () => {
            const token = await user!.getIdToken();
            return fetchNetwork(user!.uid, token);
        },
        enabled: !!user?.uid,
    });

    const processedNodes = useMemo(() => {
        if (!data?.nodes || !Array.isArray(data.nodes)) return [];
        return data.nodes.map((node: any, index: number) => {
            const isRoot = node.type === "input" || index === 0;
            return {
                ...node,
                id: node.id || `node-${index}`,
                type: "custom",
                data: {
                    label: node.data?.label || "User",
                    ...node.data,
                    isRoot,
                    level: node.position?.y ? Math.floor(node.position.y / 100) : 0,
                },
                position: node.position || { x: 0, y: 0 },
                style: {
                    ...node.style,
                    width: 160,
                },
            };
        });
    }, [data]);

    const processedEdges = useMemo(() => {
        if (!data?.edges || !Array.isArray(data.edges)) return [];
        return data.edges.map((edge: any) => ({
            ...edge,
            id: edge.id || `edge-${edge.source}-${edge.target}`,
            type: "smoothstep",
            animated: true,
            style: {
                stroke: "#a8b5ff",
                strokeWidth: 1.5,
            },
            markerEnd: {
                type: "arrowclosed",
                color: "#a8b5ff",
            },
        }));
    }, [data]);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    React.useEffect(() => {
        setNodes(processedNodes);
        setEdges(processedEdges);
    }, [processedNodes, processedEdges, setNodes, setEdges]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[500px] md:h-[600px]">
                <div className="text-center">
                    <Loader2 className="w-7 h-7 animate-spin text-[#a8b5ff] dark:text-[#6b7fd7] mx-auto mb-3" />
                    <p className="text-sm text-[#718096] dark:text-[#94a3b8]">Loading network visualization...</p>
                </div>
            </div>
        );
    }

    const nodeCount = nodes.length;
    const edgeCount = edges.length;

    return (
        <div className="space-y-4 md:space-y-5">
            <div>
                <h1 className="text-2xl md:text-3xl font-semibold mb-1.5 text-[#2d3748] dark:text-[#e2e8f0] tracking-tight">
                    My Network
                </h1>
                <p className="text-sm md:text-base text-[#718096] dark:text-[#94a3b8]">Visualize your referral network structure</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 md:mb-4">
                <div className="bg-white dark:bg-[#252932] p-3 md:p-4 rounded-xl border border-[#e8ecf0] dark:border-[#2d3441]">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[#e6f0ff] dark:bg-[#1e2a3a] rounded-lg border border-[#c5d0ff] dark:border-[#3a4a6a]">
                            <Users className="w-4 h-4 text-[#4a7cff] dark:text-[#6b9aff]" />
                        </div>
                        <div>
                            <p className="text-xs text-[#718096] dark:text-[#94a3b8]">Total Members</p>
                            <p className="text-base md:text-lg font-semibold text-[#2d3748] dark:text-[#e2e8f0]">{nodeCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#252932] p-3 md:p-4 rounded-xl border border-[#e8ecf0] dark:border-[#2d3441]">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[#f0e6ff] dark:bg-[#2a1e3a] rounded-lg border border-[#d6c5ff] dark:border-[#4a3a6a]">
                            <Users className="w-4 h-4 text-[#8b4aff] dark:text-[#a86bff]" />
                        </div>
                        <div>
                            <p className="text-xs text-[#718096] dark:text-[#94a3b8]">Connections</p>
                            <p className="text-base md:text-lg font-semibold text-[#2d3748] dark:text-[#e2e8f0]">{edgeCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#252932] p-3 md:p-4 rounded-xl border border-[#e8ecf0] dark:border-[#2d3441]">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[#e6ffe6] dark:bg-[#1e3a2a] rounded-lg border border-[#b8e6d3] dark:border-[#2a4a3a]">
                            <Crown className="w-4 h-4 text-[#4aaf7c] dark:text-[#6bc99a]" />
                        </div>
                        <div>
                            <p className="text-xs text-[#718096] dark:text-[#94a3b8]">Your Level</p>
                            <p className="text-base md:text-lg font-semibold text-[#2d3748] dark:text-[#e2e8f0]">Root</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-[500px] md:h-[600px] lg:h-[700px] border border-[#e8ecf0] dark:border-[#2d3441] rounded-xl bg-[#fafbfc] dark:bg-[#1a1d24] overflow-hidden">
                {nodes.length === 0 && !isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Users className="w-8 h-8 text-[#a0aec0] dark:text-[#64748b] mx-auto mb-2" />
                            <p className="text-sm text-[#718096] dark:text-[#94a3b8]">No network members yet</p>
                        </div>
                    </div>
                ) : (
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    connectionMode={ConnectionMode.Loose}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.1}
                    maxZoom={2}
                    defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                >
                    <Background
                        color="#e8ecf0"
                        gap={16}
                        size={0.5}
                        className="dark:opacity-10"
                    />
                    <Controls
                        className="bg-white dark:bg-[#252932] border border-[#e8ecf0] dark:border-[#2d3441] rounded-lg shadow-sm"
                        showInteractive={false}
                    />
                    <MiniMap
                        nodeColor={(node) => {
                            if (node.data?.isRoot) return "#a8b5ff";
                            return "#cbd5e1";
                        }}
                        maskColor="rgba(0, 0, 0, 0.05)"
                        className="bg-white dark:bg-[#252932] border border-[#e8ecf0] dark:border-[#2d3441] rounded-lg shadow-sm"
                    />
                    <Panel position="top-right" className="bg-white/90 dark:bg-[#252932]/90 backdrop-blur-sm rounded-lg p-2 border border-[#e8ecf0] dark:border-[#2d3441] shadow-sm">
                        <p className="text-xs text-[#718096] dark:text-[#94a3b8]">
                            Drag to pan • Scroll to zoom
                        </p>
                    </Panel>
                </ReactFlow>
                )}
            </div>
        </div>
    );
}
