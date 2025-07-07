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
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
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
          <div className="absolute top-full mt-2 right-0 w-64 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
            <div className="p-2">
              <button
                onClick={handleCreateProject}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700 rounded transition-colors text-blue-400"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>
            
            {projects.length > 0 && (
              <>
                <div className="border-t border-gray-700 my-2" />
                <div className="max-h-64 overflow-y-auto">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelect(project)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors flex items-center justify-between ${
                        activeProject?.id === project.id ? 'bg-gray-700' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{project.name}</div>
                        {project.description && (
                          <div className="text-xs text-gray-400 truncate">{project.description}</div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 ml-2">
                        {project.statistics.total_words.toLocaleString()} words
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
            
            {projects.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-400">
                No projects yet. Create your first project!
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
