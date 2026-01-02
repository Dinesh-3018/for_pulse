import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { savePreferences, updateStep as updateStepAction, completeOnboarding } from "../store/slices/authSlice";

const OnboardingModal = ({ isOpen = true, onClose = () => {} }) => {
  const [step, setStep] = useState(0);
  const [selectedAnalyzer, setSelectedAnalyzer] = useState("hybrid");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const analyzers = [
    {
      id: "hybrid",
      name: "Hybrid AI Analysis",
      icon: "🤖",
      description: "Combines computer vision and deep learning models for the most comprehensive and accurate content detection",
      features: ["Multi-layer detection system", "Best overall accuracy", "Real-time frame analysis", "Advanced pattern recognition"],
      accuracy: "65%",
      recommended: true,
      privacy: false
    },
    {
      id: "google",
      name: "Cloud-Based AI",
      icon: "☁️",
      description: "Leverages powerful cloud infrastructure with continuously updated AI models for the fastest and most accurate results",
      features: ["Latest neural networks", "Fastest processing speed", "Automatic model updates", "Scene understanding"],
      accuracy: "75%",
      recommended: false,
      privacy: false
    },
    {
      id: "tensorflow",
      name: "On-Device Processing",
      icon: "💻",
      description: "All analysis happens locally on your device, ensuring complete privacy and data security without any cloud uploads",
      features: ["100% private processing", "Works offline", "No data leaves device", "Full user control"],
      accuracy: "90%",
      recommended: false,
      privacy: true
    }
  ];

  const handleNext = async () => {
    setLoading(true);
    try {
      if (step === 0) {
        // Just move to next step, optionally update backend
        await dispatch(updateStepAction(1)).unwrap();
        setStep(1);
      } else if (step === 1) {
        // Save analyzer preference
        await dispatch(savePreferences({ analyzerPreference: selectedAnalyzer })).unwrap();
        setStep(2);
      } else if (step === 2) {
        // Complete onboarding
        await dispatch(completeOnboarding()).unwrap();
        onClose();
      }
    } catch (error) {
      console.error("Onboarding action failed:", error);
      // Still move forward in UI if error is non-critical, or show error toast
      // For now, if step update fails, we might still want to let user proceed locally
      if (step < 2) setStep(step + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-700">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {step === 0 ? "Welcome to Video Analyzer" : step === 1 ? "Choose Your Analyzer" : "You're All Set!"}
              </h1>
              <p className="text-violet-100 text-sm mt-1">
                {step === 0 ? "Step 1 of 3" : step === 1 ? "Step 2 of 3" : "Step 3 of 3"}
              </p>
            </div>
            <div className="text-5xl">{step === 0 ? "📹" : step === 1 ? "🔬" : "🎉"}</div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 0 && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  Detect Sensitive Content with AI
                </h2>
                <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                  Our advanced AI technology helps you identify and analyze sensitive content in your videos, 
                  ensuring safer content moderation and compliance.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-violet-500 transition-all">
                  <div className="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center text-2xl mb-4">
                    ⚡
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Fast Processing</h3>
                  <p className="text-slate-400 text-sm">
                    Analyze videos in minutes with real-time progress updates and notifications
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-violet-500 transition-all">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center text-2xl mb-4">
                    🎯
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">High Accuracy</h3>
                  <p className="text-slate-400 text-sm">
                    State-of-the-art AI models trained on millions of videos for precise detection
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-violet-500 transition-all">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center text-2xl mb-4">
                    📊
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Detailed Reports</h3>
                  <p className="text-slate-400 text-sm">
                    Get comprehensive analysis with timestamps, categories, and confidence scores
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 rounded-xl p-6 border border-violet-500/30">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">💡</div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">What You Can Detect</h4>
                    <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="text-violet-400">•</span> Violence and gore
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-violet-400">•</span> Explicit content
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-violet-400">•</span> Hate speech and symbols
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-violet-400">•</span> Dangerous activities
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <p className="text-slate-300 text-center text-lg">
                Select the analysis method that best fits your needs and budget
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {analyzers.map((analyzer) => (
                  <div
                    key={analyzer.id}
                    onClick={() => setSelectedAnalyzer(analyzer.id)}
                    className={`relative bg-slate-800/50 rounded-xl p-6 border-2 cursor-pointer transition-all ${
                      selectedAnalyzer === analyzer.id
                        ? "border-violet-500 shadow-lg shadow-violet-500/20"
                        : "border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    {analyzer.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        RECOMMENDED
                      </div>
                    )}
                    
                    <div className="text-center space-y-4">
                      <div className="text-5xl">{analyzer.icon}</div>
                      <h3 className="text-white font-bold text-xl">{analyzer.name}</h3>
                      <p className="text-slate-400 text-sm">{analyzer.description}</p>
                      
                      <div className="space-y-2 py-4">
                        {analyzer.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                            <span className="text-green-400">✓</span>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-slate-700 text-center">
                        <div className="text-xs text-slate-500 mb-1">Accuracy Rate</div>
                        <div className="text-white font-semibold text-lg">{analyzer.accuracy}</div>
                      </div>

                      {analyzer.privacy && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-green-400 text-xs font-medium">
                          🔒 Privacy Focused
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 text-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  Ready to Analyze!
                </h2>
                <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                  Your account is configured and ready. Start uploading videos to detect sensitive content.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-xl p-6 border border-violet-500/30">
                  <div className="text-4xl mb-3">🔬</div>
                  <h4 className="text-white font-semibold mb-2">Selected Analyzer</h4>
                  <p className="text-violet-300 font-medium">
                    {analyzers.find((a) => a.id === selectedAnalyzer)?.name}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl p-6 border border-indigo-500/30">
                  <div className="text-4xl mb-3">📊</div>
                  <h4 className="text-white font-semibold mb-2">Upload Limit</h4>
                  <p className="text-indigo-300 font-medium">10 videos to start</p>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 max-w-2xl mx-auto text-left">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span>💡</span> Quick Tips
                </h4>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="text-violet-400 mt-1">→</span>
                    <span>Upload videos in <strong className="text-white">MP4, MOV, or AVI</strong> format for best compatibility</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-violet-400 mt-1">→</span>
                    <span>Processing time typically ranges from <strong className="text-white">2-10 minutes</strong> depending on video length</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-violet-400 mt-1">→</span>
                    <span>Watch for <strong className="text-white">real-time notifications</strong> as your videos are analyzed</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-violet-400 mt-1">→</span>
                    <span>Review detailed reports with <strong className="text-white">timestamps and confidence scores</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/50 px-8 py-6 border-t border-slate-700 flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={step === 0 || loading}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              step === 0 || loading
                ? "text-slate-600 cursor-not-allowed"
                : "text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            Back
          </button>
          
          <button
            onClick={handleNext}
            disabled={loading}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-8 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{step === 2 ? "Start Analyzing" : "Continue"}</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;