import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkflowDetails from "@/components/dashboard/WorkflowDetails";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function WorkflowPage({
  params,
}: Props) {
  const { id } = await params;

  return (
    <DashboardLayout>
      <WorkflowDetails workflowId={id} />
    </DashboardLayout>
  );
}