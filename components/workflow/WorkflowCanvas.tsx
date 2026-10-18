"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  DndContext,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  Connection,
  Edge,
  Node,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { Undo2, Redo2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { saveVersion } from "@/lib/actions/versions";
import { defaultLabelFor, type NodeKind, type NodeCategory } from "@/lib/types/nodes";

import WorkflowNode from "./WorkflowNode";
import NodePalette from "./NodePalette";
import NodeSettings from "./NodeSettings";

const nodeTypes = {
  workflowNode: WorkflowNode,
};

const initialNodes: Node[] = [
  {
    id: "1",
    type: "workflowNode",
    position: { x: 50, y: 120 },
    data: {
      label: "Telegram",
      type: "trigger",
      kind: "trigger_telegram",
    },
  },
  {
    id: "2",
    type: "workflowNode",
    position: { x: 370, y: 120 },
    data: {
      label: "GPT-5.5",
      type: "ai",
      kind: "ai",
      config: { model: "GPT-5.5" },
    },
  },
  {
    id: "3",
    type: "workflowNode",
    position: { x: 690, y: 120 },
    data: {
      label: "Slack",
      type: "action",
      kind: "action_slack",
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
    type: "smoothstep",
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    animated: true,
    type: "smoothstep",
  },
];

interface WorkflowCanvasProps {
  workflowId: string;
}

interface HistoryEntry {
  nodes: Node[];
  edges: Edge[];
}

function Canvas({
  workflowId,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges);

  const [selectedNodes, setSelectedNodes] =
    useState<Node[]>([]);

  const [selectedEdges, setSelectedEdges] =
    useState<Edge[]>([]);

  const [selectedNode, setSelectedNode] =
    useState<Node | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const reactFlowWrapper =
    useRef<HTMLDivElement>(null);

  const { screenToFlowPosition } =
    useReactFlow();

  const supabase = createClient();

  const firstLoad = useRef(true);

  // ---- Undo / redo history -------------------------------------------
  const history = useRef<HistoryEntry[]>([]);
  const historyIndex = useRef(-1);
  const applyingHistory = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const refreshHistoryButtons = useCallback(() => {
    setCanUndo(historyIndex.current > 0);
    setCanRedo(historyIndex.current < history.current.length - 1);
  }, []);

  const pushHistory = useCallback((snapshotNodes: Node[], snapshotEdges: Edge[]) => {
    const truncated = history.current.slice(0, historyIndex.current + 1);
    truncated.push({
      nodes: JSON.parse(JSON.stringify(snapshotNodes)),
      edges: JSON.parse(JSON.stringify(snapshotEdges)),
    });
    // keep history bounded
    while (truncated.length > 50) truncated.shift();
    history.current = truncated;
    historyIndex.current = truncated.length - 1;
    refreshHistoryButtons();
  }, [refreshHistoryButtons]);

  const undo = useCallback(() => {
    if (historyIndex.current <= 0) return;
    historyIndex.current -= 1;
    const snapshot = history.current[historyIndex.current];
    applyingHistory.current = true;
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    refreshHistoryButtons();
  }, [refreshHistoryButtons, setEdges, setNodes]);

  const redo = useCallback(() => {
    if (historyIndex.current >= history.current.length - 1) return;
    historyIndex.current += 1;
    const snapshot = history.current[historyIndex.current];
    applyingHistory.current = true;
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    refreshHistoryButtons();
  }, [refreshHistoryButtons, setEdges, setNodes]);

  useEffect(() => {
    async function loadWorkflow() {
      const { data, error } = await supabase
        .from("workflows")
        .select("nodes, edges")
        .eq("id", workflowId)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      const loadedNodes = data?.nodes?.length ? data.nodes : initialNodes;
      const loadedEdges = data?.edges?.length ? data.edges : initialEdges;

      setNodes(loadedNodes);
      setEdges(loadedEdges);
      history.current = [
        {
          nodes: JSON.parse(JSON.stringify(loadedNodes)),
          edges: JSON.parse(JSON.stringify(loadedEdges)),
        },
      ];
      historyIndex.current = 0;
      refreshHistoryButtons();
    }

    loadWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  const saveWorkflow = useCallback(async (snapshotForVersion = false) => {
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("workflows")
        .update({
          nodes,
          edges,
        })
        .eq("id", workflowId);

      if (error) {
        console.error(error);
      } else if (snapshotForVersion) {
        await saveVersion(workflowId, nodes, edges);
      }
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, workflowId, supabase]);

  // Manual "Save Workflow" button (details page) also snapshots a version.
  useEffect(() => {
    const handler = () => saveWorkflow(true);
    window.addEventListener("save-workflow", handler);
    return () => window.removeEventListener("save-workflow", handler);
  }, [saveWorkflow]);

  // Version history "Restore" action.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ nodes: Node[]; edges: Edge[] }>).detail;
      if (!detail) return;
      setNodes(detail.nodes);
      setEdges(detail.edges);
      pushHistory(detail.nodes, detail.edges);
    };
    window.addEventListener("restore-version", handler as EventListener);
    return () => window.removeEventListener("restore-version", handler as EventListener);
  }, [setNodes, setEdges, pushHistory]);

  const updateNodeTitle = (id: string, label: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                label,
              },
            }
          : node
      )
    );

    setSelectedNode((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            data: {
              ...prev.data,
              label,
            },
          }
        : prev
    );
  };

  const updateNodeConfig = (id: string, config: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                config,
              },
            }
          : node
      )
    );

    setSelectedNode((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            data: {
              ...prev.data,
              config,
            },
          }
        : prev
    );
  };

  useEffect(() => {
    if (!selectedNode) return;

    const latest = nodes.find(
      (n) => n.id === selectedNode.id
    );

    if (latest) {
      setSelectedNode(latest);
    }
  }, [nodes, selectedNode]);

  const isValidConnection = (
    connection: Connection | Edge
  ) => {
    const source = nodes.find(
      (n) => n.id === connection.source
    );

    const target = nodes.find(
      (n) => n.id === connection.target
    );

    if (!source || !target) return false;

    // A Trigger cannot receive incoming connections
    if (target.data.type === "trigger") {
      return false;
    }

    return true;
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            type: "smoothstep",
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Autosave (debounced) + push to undo/redo history
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }

    if (applyingHistory.current) {
      // This change came from undo/redo — don't re-save-to-history or
      // treat it as a fresh edit, just persist it.
      applyingHistory.current = false;
      const timer = setTimeout(() => saveWorkflow(false), 400);
      return () => clearTimeout(timer);
    }

    const historyTimer = setTimeout(() => pushHistory(nodes, edges), 300);
    const saveTimer = setTimeout(() => saveWorkflow(false), 1000);

    return () => {
      clearTimeout(historyTimer);
      clearTimeout(saveTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // Don't intercept shortcuts while typing in an input
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA"
      ) {
        return;
      }

      const isMeta = event.ctrlKey || event.metaKey;

      if (isMeta && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      if (
        (isMeta && event.key.toLowerCase() === "z" && event.shiftKey) ||
        (isMeta && event.key.toLowerCase() === "y")
      ) {
        event.preventDefault();
        redo();
        return;
      }

      if (event.key !== "Delete") {
        return;
      }

      setNodes((nds) =>
        nds.filter(
          (node) =>
            !selectedNodes.some(
              (selected) => selected.id === node.id
            )
        )
      );

      setEdges((eds) =>
        eds.filter(
          (edge) =>
            !selectedEdges.some(
              (selected) => selected.id === edge.id
            )
        )
      );

      setSelectedNode(null);
    };

    window.addEventListener(
      "keydown",
      handleKeydown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeydown
      );
  }, [selectedNodes, selectedEdges, undo, redo, setNodes, setEdges]);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!reactFlowWrapper.current) return;

      const dragged = event.active.data.current as
        | { kind: NodeKind; type: NodeCategory; title: string }
        | undefined;

      if (!dragged) return;

      if (
        dragged.type === "trigger" &&
        nodes.some(
          (n) => n.data.type === "trigger"
        )
      ) {
        alert(
          "A workflow can only have one Trigger."
        );
        return;
      }

      const bounds =
        reactFlowWrapper.current.getBoundingClientRect();

      const position =
        screenToFlowPosition({
          x:
            event.delta.x +
            bounds.left +
            150,
          y:
            event.delta.y +
            bounds.top +
            150,
        });

      const newNode: Node = {
        id: crypto.randomUUID(),
        type: "workflowNode",
        position,
        data: {
          label: dragged.title ?? defaultLabelFor(dragged.kind),
          type: dragged.type,
          kind: dragged.kind,
          config: {},
        },
      };

      setNodes((nds) => [
        ...nds,
        newNode,
      ]);
    },
    [
      nodes,
      screenToFlowPosition,
      setNodes,
    ]
  );

    return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="flex items-start gap-6">

        <NodePalette />

        <div
          ref={reactFlowWrapper}
          className="h-[650px] flex-1 rounded-3xl border bg-background"
        >

        <div className="mb-4 flex items-center justify-between px-4 pt-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs disabled:opacity-40"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs disabled:opacity-40"
            >
              <Redo2 className="h-3.5 w-3.5" />
              Redo
            </button>
          </div>

          <span className="text-sm text-muted-foreground">
            {isSaving ? "Saving..." : "✓ Saved"}
          </span>
        </div>


          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            onConnect={onConnect}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            isValidConnection={isValidConnection}
            onSelectionChange={({ nodes, edges }) => {
              setSelectedNodes(nodes);
              setSelectedEdges(edges);

              if (nodes.length > 0) {
                setSelectedNode(nodes[0]);
              } else {
                setSelectedNode(null);
              }
            }}
          >
            <Background />
            <MiniMap />
            <Controls />
          </ReactFlow>
        </div>

        <NodeSettings
          node={selectedNode}
          onUpdateLabel={updateNodeTitle}
          onUpdateConfig={updateNodeConfig}
        />

      </div>
    </DndContext>
  );
}

export default function WorkflowCanvas({
  workflowId,
}: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas workflowId={workflowId} />
    </ReactFlowProvider>
  );
}
