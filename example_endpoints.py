"""
Example implementation for Phase 1 endpoints
Add this to your project_routes.py or create a new file
"""

from flask import Blueprint, jsonify, request, g
from plotweaver.db.database import db_session
from plotweaver.db.models import Project, User
from datetime import datetime

# This should already exist in your project_routes.py
project_bp = Blueprint('project', __name__)

@project_bp.route('/api/v1/projects', methods=['GET'])
def list_projects():
    """List all projects for the current user"""
    try:
        # For now, we'll return all projects (no auth yet)
        projects = Project.query.all()
        
        # Get active project from session
        active_project_id = g.get('active_project_id')
        
        return jsonify({
            'projects': [
                {
                    'id': p.id,
                    'name': p.name,
                    'description': p.description,
                    'git_repo_url': p.git_repo_url,
                    'git_initialized': p.git_initialized,
                    'mode_set': p.mode_set,
                    'statistics': {
                        'total_words': p.statistics.get('total_words', 0),
                        'total_scenes': p.statistics.get('total_scenes', 0),
                        'total_chapters': p.statistics.get('total_chapters', 0),
                        'total_cost': p.statistics.get('total_cost', 0.0),
                        'total_savings': p.statistics.get('total_savings', 0.0)
                    },
                    'created_at': p.created_at.isoformat(),
                    'updated_at': p.updated_at.isoformat(),
                    'last_accessed': p.last_accessed.isoformat() if p.last_accessed else p.updated_at.isoformat()
                }
                for p in projects
            ],
            'count': len(projects),
            'active_project_id': active_project_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@project_bp.route('/api/v1/projects', methods=['POST'])
def create_project():
    """Create a new project"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Project name is required'}), 400
            
        # Create project using ProjectManager
        pm = g.project_manager
        project_path = pm.create_project(
            name=data['name'],
            description=data.get('description', ''),
            mode_set=data.get('mode_set', 'professional-writer')
        )
        
        # Create database entry
        project = Project(
            name=data['name'],
            description=data.get('description', ''),
            path=str(project_path),
            mode_set=data.get('mode_set', 'professional-writer'),
            git_repo_url=data.get('git_repo_url', ''),
            statistics={
                'total_words': 0,
                'total_scenes': 0,
                'total_chapters': 0,
                'total_cost': 0.0,
                'total_savings': 0.0
            }
        )
        
        db_session.add(project)
        db_session.commit()
        
        return jsonify({
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'path': project.path,
            'created_at': project.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db_session.rollback()
        return jsonify({'error': str(e)}), 500

@project_bp.route('/api/v1/projects/<int:project_id>/activate', methods=['POST'])
def activate_project(project_id):
    """Set a project as active"""
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
            
        # Update session
        from flask import session
        session['active_project_id'] = project_id
        
        # Update last accessed
        project.last_accessed = datetime.utcnow()
        db_session.commit()
        
        # Load project in ProjectManager
        pm = g.project_manager
        pm.load_project(project.path)
        
        return jsonify({
            'message': 'Project activated',
            'project_id': project_id,
            'project': {
                'id': project.id,
                'name': project.name,
                'description': project.description
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@project_bp.route('/api/v1/projects/active', methods=['GET'])
def get_active_project():
    """Get the currently active project"""
    try:
        from flask import session
        active_project_id = session.get('active_project_id')
        
        if not active_project_id:
            return jsonify({'active_project': None})
            
        project = Project.query.get(active_project_id)
        if not project:
            return jsonify({'active_project': None})
            
        return jsonify({
            'active_project': {
                'id': project.id,
                'name': project.name,
                'description': project.description,
                'git_repo_url': project.git_repo_url,
                'git_initialized': project.git_initialized,
                'mode_set': project.mode_set,
                'statistics': project.statistics,
                'created_at': project.created_at.isoformat(),
                'updated_at': project.updated_at.isoformat(),
                'last_accessed': project.last_accessed.isoformat() if project.last_accessed else None
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Don't forget to register the blueprint in app.py:
# app.register_blueprint(project_bp)
