import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, FolderOpen } from 'lucide-react';
import { api, Project as ApiProject } from '../../services/api';
import { useGlobalStore } from '../../lib/store';

interface ProjectSelectorProps {
  className?: string;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [activeProject, setActiveProject] = useState<ApiProject | null>(null);
  const [loading, setLoading] = useState(true);
  const { setCurrentProject } = useGlobalStore();

  useEffect(() => {
    loadProjects();
    loadActiveProject();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await api.listProjects();
      setProjects(response.projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      // Development mock data
      if (process.env.NODE_ENV === 'development') {
        const mockProjects: ApiProject[] = [{
          id: 1,
          name: 'Demo Project',
          description: 'Development mock project',
          git_repo_url: '',
          git_initialized: false,
          mode_set: 'default',
          statistics: {
            total_words: 1250,
            total_scenes: 5,
            total_chapters: 1,
            total_cost: 0,
            total_savings: 0
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_accessed: new Date().toISOString()
        }];
        setProjects(mockProjects);
      }
    }
  };

  const loadActiveProject = async () => {
    try {
      setLoading(true);
      const response = await api.getActiveProject();
      if (response.active_project) {
        setActiveProject(response.active_project);
        // Convert API project to store project format
        setCurrentProject({
          id: response.active_project.id.toString(),
          name: response.active_project.name,
          description: response.active_project.description || '',
          createdAt: new Date(response.active_project.created_at),
          updatedAt: new Date(response.active_project.updated_at),
          owner: 'current_user', // TODO: Get from auth
          collaborators: []
        });
      }
    } catch (error) {
      console.error('Failed to load active project:', error);
      // Development mock data
      if (process.env.NODE_ENV === 'development') {
        const mockProject: ApiProject = {
          id: 1,
          name: 'Demo Project',
          description: 'Development mock project',
          git_repo_url: '',
          git_initialized: false,
          mode_set: 'default',
          statistics: {
            total_words: 1250,
            total_scenes: 5,
            total_chapters: 1,
            total_cost: 0,
            total_savings: 0
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_accessed: new Date().toISOString()
        };
        setActiveProject(mockProject);
        setCurrentProject({
          id: mockProject.id.toString(),
          name: mockProject.name,
          description: mockProject.description || '',
          createdAt: new Date(mockProject.created_at),
          updatedAt: new Date(mockProject.updated_at),
          owner: 'demo_user',
          collaborators: []
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = async (project: ApiProject) => {
    try {
      await api.activateProject(project.id);
      setActiveProject(project);
      // Convert API project to store project format
      setCurrentProject({
        id: project.id.toString(),
        name: project.name,
        description: project.description || '',
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
        owner: 'current_user', // TODO: Get from auth
        collaborators: []
      });
      setIsOpen(false);
      // Refresh the page to load the new project context
      window.location.reload();
    } catch (error) {
      console.error('Failed to activate project:', error);
      // In development, just update the state without API call
      if (process.env.NODE_ENV === 'development') {
        setActiveProject(project);
        setCurrentProject({
          id: project.id.toString(),
          name: project.name,
          description: project.description || '',
          createdAt: new Date(project.created_at),
          updatedAt: new Date(project.updated_at),
          owner: 'demo_user',
          collaborators: []
        });
        setIsOpen(false);
      }
    }
  };

  const handleCreateProject = () => {
    // Navigate to create project page
    window.location.href = '/projects/new';
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors"
        disabled={loading}
      >
        <FolderOpen className="w-4 h-4" />
        <span className="text-sm">
          {loading ? 'Loading...' : activeProject ? activeProject.name : 'Select Project'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 w-64 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border z-50">
            <div className="p-2">
              <button
                onClick={handleCreateProject}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded transition-colors text-primary"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>
            
            {projects.length > 0 && (
              <>
                <div className="border-t border-border my-2" />
                <div className="max-h-64 overflow-y-auto">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelect(project)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between ${
                        activeProject?.id === project.id ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{project.name}</div>
                        {project.description && (
                          <div className="text-xs text-muted-foreground truncate">{project.description}</div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground ml-2">
                        {project.statistics.total_words.toLocaleString()} words
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
            
            {projects.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No projects yet. Create your first project!
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
