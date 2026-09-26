import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { goTo } from '../utils/navigation';
import { readPageCache, writePageCache } from '../utils/navigation';
import { useAuth } from '../hooks/useAuth';
import StudyWorkspace from '../components/resource/StudyWorkspace';
import axios from '../services/apiClient';
import { toast } from 'react-hot-toast';

const ResourceViewerPage = () => {
  const { resourceId } = useParams();
  const { user } = useAuth();
  const cachedResourceRef = useRef(readPageCache(`notsy-resource:${resourceId}`));
  const cachedResource = cachedResourceRef.current;
  const [resource, setResource] = useState(cachedResource);
  const [loading, setLoading] = useState(!cachedResource);
  const handleBack = () => goTo(resource?.topicId ? `/dashboard/topic/${resource.topicId}` : '/dashboard', { replace: true });

  useEffect(() => {
    const fetchResource = async () => {
      try {
            setLoading(!cachedResourceRef.current);
            const response = await axios.get(`/resource/${resourceId}`);
            console.log('Resource response:', response.data);
            
            if (response.data.resource) {
                const resourceData = response.data.resource;
                console.log('Resource source array:', resourceData.source);
                
                // Ensure source is always an array
                if (!Array.isArray(resourceData.source)) {
                    resourceData.source = [resourceData.source];
                }
                
            setResource(resourceData);
            writePageCache(`notsy-resource:${resourceId}`, resourceData);
            } else {
                throw new Error('Resource data not found in response');
            }
        } catch (error) {
            console.error('Error fetching resource:', error);
            toast.error(error.response?.data?.msg || 'Failed to load resource');
        } finally {
            setLoading(false);
        }
    };

    if (resourceId) {
        fetchResource();
    }
  }, [resourceId]);

  if (loading) {
    return (
      <div className="resource-page resource-loading flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="resource-page resource-loading flex justify-center items-center h-screen">
        <p className="text-red-500">Resource not found</p>
      </div>
    );
  }

  return (
    <div className="resource-page h-screen w-screen overflow-hidden">
      <header className="resource-page-header"><button type="button" onClick={handleBack} className="resource-back">← Back to topic</button><div className="resource-title"><span className="resource-type">{resource.type === 'pdf' ? 'PDF resource' : 'Video resource'}</span><strong>{resource.title || 'Study resource'}</strong></div><span className="resource-user">{user?.name || 'Workspace'}</span></header>
      <div className="resource-page-body h-full">
        <StudyWorkspace key={resource._id} resource={resource} />
      </div>
    </div>
  );
};

export default ResourceViewerPage;
