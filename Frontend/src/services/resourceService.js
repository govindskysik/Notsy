import axios from '../utils/axios';

export const uploadPDFs = async (files, topicId) => {
  const formData = new FormData();
  
  // Append each PDF file
  files.forEach(file => {
    formData.append('pdf', file);
  });
  
  // Add topicId
  formData.append('topicId', topicId);

  try {
    const response = await axios.post('/upload/uploadPdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    return response.data;
  } catch (error) {
    console.error('PDF upload error details:', error.response?.data);
    throw error;
  }
};