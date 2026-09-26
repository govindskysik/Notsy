import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import AddResourceModal from './AddResourceModal';
import axios from "../../services/apiClient";
import { toast } from "react-hot-toast";
import { ArrowRightIcon, DocumentTextIcon, PlayIcon } from '@heroicons/react/24/outline';
import KnowledgeMap from '../graph/KnowledgeMap';
import { goTo, writePageCache } from '../../utils/navigation';

const ResourceCard = ({ resource, onClick }) => {
  const getVideoIdFromUrl = (url) => {
    try {
      return new URL(url).searchParams.get('v');
    } catch {
      return null;
    }
  };

  // Get first URL if it's an array
  const sourceUrl = Array.isArray(resource.source) ? resource.source[0] : resource.source;
  const videoId = getVideoIdFromUrl(sourceUrl);
  const isPdf = resource.type === 'pdf';
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  const sourceName = sourceUrl?.split('/').pop() || (isPdf ? 'PDF Resource' : 'Video Resource');
  
  // Get video count if multiple sources
  const additionalCount = Array.isArray(resource.source) ? resource.source.length - 1 : 0;

  return (
    <button type="button" onClick={onClick} className="topic-resource-card">
      <div className={`topic-resource-thumb relative pt-[56.25%] ${isPdf ? 'topic-pdf-thumb' : 'topic-video-thumb'}`}>
        {isPdf ? (
          <div className="topic-pdf-art"><DocumentTextIcon /><strong>PDF</strong><small>Document</small></div>
        ) : thumbnailUrl ? (
          <img src={thumbnailUrl} alt="Video thumbnail" className="absolute top-0 left-0 w-full h-full object-cover" />
        ) : (
          <div className="topic-video-fallback"><PlayIcon /></div>
        )}
        {!isPdf && <div className="topic-video-overlay"><span className="topic-play-badge"><PlayIcon /></span><span>Video lesson</span></div>}
        {additionalCount > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-sm">
            +{additionalCount}
          </div>
        )}
      </div>
      <div className="topic-resource-card-copy">
        <div className={`topic-resource-mini-icon ${isPdf ? 'is-pdf' : 'is-video'}`}>{isPdf ? <DocumentTextIcon /> : <PlayIcon />}</div>
        <div className="topic-resource-row-copy">
          <strong>{isPdf ? sourceName : (resource.title || "Video Resource")}</strong>
          <span>{isPdf ? 'PDF document' : 'YouTube video'} · Added recently</span>
        </div>
        <ArrowRightIcon className="topic-resource-arrow" />
      </div>
    </button>
  );
};

const TopicContent = ({ topic, resources, loading, onResourcesUpdate, isResourceModalOpen, onCloseResourceModal }) => {
  const { topicId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Add loading check for both auth and topic data
  if (authLoading || loading) {
    return <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  // Verify we have both topic data and ID
  if (!topic || !topicId) {
    return <div className="flex justify-center items-center h-full">
      <p className="text-red-500">Topic not found</p>
    </div>;
  }

  const handleVideoSubmit = async (urls) => {
    try {
      // Start loading toast
      toast.loading("Processing videos...", { id: "uploadToast" });

      const response = await axios.post("/upload/uploadUrl", {
        urls,
        topicId
      });

      // Check for successful response based on backend format from video.json
      if (response.data.data && response.data.message) {
        // Update success toast with processing results
        toast.success(response.data.message, { id: "uploadToast" });
        
        // Update resources list first
        if (onResourcesUpdate) {
          await onResourcesUpdate();
        }

        // Small delay before navigation to ensure toast and updates are visible
        setTimeout(() => {
          navigate(`/dashboard/resource/${response.data.data._id}`);
        }, 1000);
      }
    } catch (error) {
      console.error("Error uploading videos:", error);
      const errorMsg = error.response?.data?.msg || "Failed to upload videos";
      toast.error(errorMsg, { id: "uploadToast" });
      throw error;
    }
  };

  const handlePDFSubmit = async (response) => { // Change parameter name to response
    const loadingToast = toast.loading('Processing PDFs...');
    
    try {
      if (!response?.data?._id) {
        throw new Error('Invalid response from server');
      }
      
      toast.success('PDFs uploaded successfully', { id: loadingToast });
      
      // Update resources list
      if (onResourcesUpdate) {
        await onResourcesUpdate();
      }

      // Navigate to resource viewer
      setTimeout(() => {
        navigate(`/dashboard/resource/${response.data._id}`);
      }, 1000);
      
    } catch (error) {
      console.error('Error processing PDFs:', error);
      toast.error(
        error.message || 'Failed to process PDFs', 
        { id: loadingToast }
      );
      throw error;
    }
  };

  const handleResourceClick = (resourceId) => {
    const selectedResource = resources?.find((resource) => resource._id === resourceId);
    if (selectedResource) writePageCache(`notsy-resource:${resourceId}`, selectedResource);
    goTo(`/dashboard/resource/${resourceId}`);
  };

  return (
    <div className="topic-workspace h-full flex flex-col">
      <section className="topic-intro topic-intro-with-map"><div className="topic-intro-copy"><p className="dashboard-eyebrow">Current topic</p><h1>{topic.title}</h1><p>Add videos, documents and other resources to keep everything for this topic in one place.</p><span className="topic-intro-context">{resources?.length || 0}<small>resources</small></span></div><div className="topic-intro-map"><KnowledgeMap compact notebooks={[{ _id: topic._id, name: topic.title }]} resources={resources || []} /></div></section>
      <section className="topic-resources-section">
        <div className="topic-resources-heading"><div><p className="dashboard-eyebrow">Your resources</p><h2>Resources</h2><p>Everything you have added to this topic.</p></div><span>{resources?.length || 0} resources</span></div>
        <div className="topic-resources-content">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : resources?.length > 0 ? (
            <div className="topic-resource-list pb-6">
              {resources.map((resource) => (
                <ResourceCard
                  key={resource._id}
                  resource={resource}
                  onClick={() => handleResourceClick(resource._id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No resources added yet</p>
            </div>
          )}
        </div>
      </section>
      {user && <AddResourceModal
        isOpen={isResourceModalOpen}
        onClose={onCloseResourceModal}
        onVideoSubmit={handleVideoSubmit}
        onPDFSubmit={handlePDFSubmit}
        topicId={topicId}
      />}
    </div>
  );
};

export default TopicContent;
