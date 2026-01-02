import React from 'react';
import Navbar from '../components/Navbar';
import UploadForm from '../components/UploadForm';
import { useNavigate } from 'react-router-dom';

const UploadPage = () => {
  const navigate = useNavigate();

  const handleUploadSuccess = () => {
    // The confetti and redirect logic will be handled inside UploadForm 
    // or passed here. The plan said UploadForm handles it, but passing a callback
    // is cleaner for the redirect. The confetti is UI logic inside the form usually.
    // However, keeping the redirect control here allows the Form to be reusable.
    // Let's stick to the plan: "Update UploadForm... to trigger confetti and redirect".
    // Or better: UploadForm triggers confetti, then calls onUploadSuccess, 
    // and THIS page handles the navigation? 
    // Actually, the plan says "Update UploadForm... navigate to /dashboard".
    // I will let UploadForm handle the visual success state and navigation for now as per plan,
    // or passing the navigator function might be better. 
    // Let's pass a simple callback that does nothing if UploadForm handles nav, 
    // or use it if I change my mind. Steps say UploadForm updates. regarding nav.
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Upload Content
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Share your videos securely. We'll analyze them for safety before publishing.
          </p>
        </div>
        
        <div className="flex justify-center">
             <UploadForm />
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
