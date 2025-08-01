import React, { useState } from 'react';
import { X, Upload, MessageCircle, Loader2 } from 'lucide-react';
import { analyzeChatConversation } from '../lib/openai';
import { extractTextFromImage } from '../lib/ocr';

interface ChatAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatAnalysisModal({ isOpen, onClose }: ChatAnalysisModalProps) {
  const [conversationText, setConversationText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setOcrLoading(true);
    try {
      const extractedText = await extractTextFromImage(file);
      if (extractedText.trim()) {
        setConversationText(extractedText);
      } else {
        alert('No text could be extracted from this image. Please try a clearer screenshot or type the conversation manually.');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to extract text from image. Please try typing the conversation manually.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleAnalyze = async () => {
    if (!conversationText.trim()) {
      alert('Please enter a conversation to analyze');
      return;
    }

    setLoading(true);
    try {
      const result = await analyzeChatConversation(conversationText);
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      setAnalysis('Sorry bro, something went wrong with the analysis. Try again in a bit! 🤷‍♂️');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setConversationText('');
    setAnalysis('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">AI Chat Analysis</h2>
          <button
            onClick={onClose}
            className="bg-green-400 hover:bg-green-500 px-6 py-3 rounded-lg text-black font-medium transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive || ocrLoading
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {ocrLoading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="animate-spin text-blue-400 mb-4" size={32} />
                  <h3 className="text-lg font-semibold text-white mb-2">Extracting Text...</h3>
                  <p className="text-gray-400 text-sm">Reading your chat screenshot</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="text-gray-400" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Upload Chat Screenshot</h3>
                  <p className="text-gray-400 text-sm mb-4">Drag & drop or click to upload</p>
                  <label className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer inline-block">
                  <label className="bg-green-400 hover:bg-green-500 disabled:bg-green-600 text-black px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer inline-block">
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      className="hidden"
                      disabled={ocrLoading}
                    />
                  </label>
                  <p className="text-gray-500 text-xs mt-2">
                    AI will automatically extract text from your screenshot
                  </p>
                </>
              )}
            </div>

            {/* Text Input */}
            <div>
              <label className="block text-white font-medium mb-3">
                Conversation Text
              </label>
              <textarea
                value={conversationText}
                onChange={(e) => setConversationText(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
                rows={12}
                placeholder="Paste your conversation here...

Example:
You: Hey, how was your day?
Her: Pretty good! Just got back from yoga
You: Nice! I've been thinking about trying yoga
Her: You should! It's really relaxing"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleReset}
                disabled={ocrLoading}
                className="flex-1 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleAnalyze}
                disabled={loading || ocrLoading || !conversationText.trim()}
                className="flex-1 bg-green-400 text-black py-3 rounded-lg hover:bg-green-500 disabled:bg-green-600 transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle size={20} />
                    <span>Analyze Chat</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">AI Analysis</h3>
              <div className="bg-gray-800 rounded-lg p-6 min-h-[400px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Loader2 className="animate-spin text-blue-400 mb-4" size={32} />
                    <p className="text-gray-300">Your personal dating coach is analyzing this conversation...</p>
                    <p className="text-gray-400 text-sm mt-2">This might take a few seconds</p>
                  </div>
                ) : analysis ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                        <MessageCircle className="text-white" size={16} />
                      </div>
                      <span className="text-blue-400 font-semibold">Your Playboi Coach Says:</span>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{analysis}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className="text-gray-400 mb-4" size={48} />
                    <p className="text-gray-400 mb-2">No analysis yet</p>
                    <p className="text-gray-500 text-sm">Upload a screenshot or paste your conversation to get AI insights</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}