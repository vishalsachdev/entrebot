import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, Search } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import {
  Container,
  PageHeader,
  Button,
  Card,
  CardContent,
  Grid,
  Input,
  Badge,
} from '../components/ui';
import { ProjectCard, CreateProjectModal } from '../components/projects';

const Projects = () => {
  const { projects, switchProject } = useProject();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeProjects = filteredProjects.filter((p) => p.status === 'active');
  const otherProjects = filteredProjects.filter((p) => p.status !== 'active');

  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title="Projects"
          description="Manage your entrepreneurship ventures"
          actions={
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              New Project
            </Button>
          }
        />

        {projects.length > 0 ? (
          <>
            {/* Search and Filters */}
            <div className="mb-6 flex items-center gap-4">
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="max-w-md"
              />
              <div className="flex items-center gap-2">
                <Badge variant="neutral">
                  {projects.length} total
                </Badge>
                <Badge variant="success">
                  {activeProjects.length} active
                </Badge>
              </div>
            </div>

            {/* Active Projects */}
            {activeProjects.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                  Active Projects
                </h2>
                <Grid cols={3} gap={6}>
                  {activeProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => switchProject(project.id)}
                    />
                  ))}
                </Grid>
              </div>
            )}

            {/* Other Projects */}
            {otherProjects.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                  Other Projects
                </h2>
                <Grid cols={3} gap={6}>
                  {otherProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => switchProject(project.id)}
                    />
                  ))}
                </Grid>
              </div>
            )}

            {filteredProjects.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-neutral-600">
                    No projects found matching "{searchQuery}"
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* Empty State */
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center">
                  <FolderKanban className="h-8 w-8 text-neutral-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                No projects yet
              </h3>
              <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                Start your entrepreneurship journey by creating your first project.
                Work with AI agents to validate ideas and build your venture.
              </p>
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </Container>
  );
};

export default Projects;
