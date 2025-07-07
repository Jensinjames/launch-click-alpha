import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import { AssemblyGrid, CreateAssemblyDialog } from "@/components/assembly";
import PageHeader from "@/components/shared/PageHeader";

const Assemblies = () => {
  return (
    <AuthGuard requireAuth={true}>
      <Layout>
        <div className="max-w-6xl mx-auto">
          <PageHeader
            title="Content Assemblies"
            description="Combine multiple content pieces into cohesive marketing campaigns"
            action={
              <CreateAssemblyDialog
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assembly
                  </Button>
                }
              />
            }
          />

          <AssemblyGrid />
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Assemblies;