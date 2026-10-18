"use client";

import { ReactFlow, ReactFlowProvider, Background, Controls, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import WorkflowNode from "./WorkflowNode";

const nodeTypes = { workflowNode: WorkflowNode };

interface Props {
  nodes: Node[];
  edges: Edge[];
}

export default function ReadOnlyCanvas({ nodes, edges }: Props) {
  return (
    <ReactFlowProvider>
      <div className="h-[600px] w-full rounded-3xl border bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnScroll
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}
