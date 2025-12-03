import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Brain,
  Users,
  Clock,
  DollarSign,
  ArrowLeft,
  FileText,
  Upload,
  Calendar,
  CheckCircle,
  Star,
  TrendingUp,
  Target,
  Lightbulb,
  Camera,
  Mic,
  Send
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SolutionTeam {
  id: string;
  name: string;
  expertise: string[];
  members: number;
  rating: number;
  completedProjects: number;
  estimatedTime: string;
  price: number;
  description: string;
  availability: 'available' | 'busy' | 'booked';
}

interface QueryAnalysis {
  complexity: 'low' | 'medium' | 'high';
  estimatedTime: string;
  requiredExperts: string[];
  suggestedApproach: string;
  budgetRange: { min: number; max: number };
}

export const SolutionQuery: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [query, setQuery] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [timeline, setTimeline] = useState<'flexible' | 'weeks' | 'month' | 'urgent'>('flexible');
  const [budget, setBudget] = useState<'flexible' | 'low' | 'medium' | 'high'>('flexible');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [analysis, setAnalysis] = useState<QueryAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);

  const solutionTeams: SolutionTeam[] = [
    {
      id: '1',
      name: 'Tech Innovation Squad',
      expertise: ['Software Development', 'AI/ML', 'Cloud Solutions', 'Mobile Apps'],
      members: 8,
      rating: 4.9,
      completedProjects: 156,
      estimatedTime: '2-4 weeks',
      price: 25000,
      description: 'Specialized in cutting-edge technology solutions and digital transformation',
      availability: 'available'
    },
    {
      id: '2',
      name: 'Business Solutions Hub',
      expertise: ['Strategy Consulting', 'Process Optimization', 'Market Research', 'Analytics'],
      members: 12,
      rating: 4.8,
      completedProjects: 203,
      estimatedTime: '3-6 weeks',
      price: 35000,
      description: 'Expert team for complex business problems and strategic consulting',
      availability: 'available'
    },
    {
      id: '3',
      name: 'Creative Design Collective',
      expertise: ['UI/UX Design', 'Branding', 'Marketing', 'Content Creation'],
      members: 6,
      rating: 4.7,
      completedProjects: 89,
      estimatedTime: '1-3 weeks',
      price: 18000,
      description: 'Creative solutions for design, marketing and brand challenges',
      availability: 'busy'
    }
  ];

  const analyzeQuery = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock analysis based on query content
    const queryLower = query.toLowerCase();
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    let estimatedTime = '2-4 weeks';
    let requiredExperts: string[] = [];
    let budgetRange = { min: 15000, max: 30000 };
    
    if (queryLower.includes('ai') || queryLower.includes('machine learning') || queryLower.includes('complex')) {
      complexity = 'high';
      estimatedTime = '4-8 weeks';
      budgetRange = { min: 30000, max: 60000 };
      requiredExperts = ['AI Specialist', 'Data Scientist', 'Software Engineer'];
    } else if (queryLower.includes('simple') || queryLower.includes('basic')) {
      complexity = 'low';
      estimatedTime = '1-2 weeks';
      budgetRange = { min: 8000, max: 20000 };
      requiredExperts = ['Developer', 'Designer'];
    } else {
      requiredExperts = ['Project Manager', 'Developer', 'Analyst'];
    }
    
    setAnalysis({
      complexity,
      estimatedTime,
      requiredExperts,
      suggestedApproach: 'Based on your query, we recommend a phased approach with regular milestone reviews.',
      budgetRange
    });
    
    setIsAnalyzing(false);
    setStep(2);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files].slice(0, 5)); // Max 5 files
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const submitQuery = async () => {
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    navigate('/orders/solution-query-456', {
      state: {
        serviceType: 'solution-query',
        query,
        attachments: attachments.map(f => f.name),
        timeline,
        budget,
        selectedTeam: solutionTeams.find(t => t.id === selectedTeam),
        analysis,
        queryId: 'SQ' + Date.now()
      }
    });
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Get Solution</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Describe your complex problem and get expert solutions</p>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">AI Powered</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= num 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {num}
                </div>
                {num < 4 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > num ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Describe Problem */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Describe Your Challenge</h2>
              <p className="text-gray-600 dark:text-gray-300">Share your problem in detail. Our AI will analyze and suggest the best approach.</p>
            </div>

            {/* Query Input */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <label className="block font-semibold text-gray-900 dark:text-white mb-3">
                What challenge are you facing?
              </label>
              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your problem, project requirements, goals, or any complex challenge you need solved. Be as detailed as possible..."
                  className="w-full px-4 py-4 pr-16 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  rows={8}
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={() => setRecordingAudio(!recordingAudio)}
                    className={`p-2 rounded-lg transition-colors ${
                      recordingAudio 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300'
                    }`}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 text-right">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {query.length} characters (minimum 100 recommended)
                </span>
              </div>
            </div>

            {/* File Attachments */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Supporting Documents (Optional)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Upload relevant files, images, or documents to help us understand your problem better.
              </p>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.png,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-300">
                    Click to upload files or drag and drop
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    PDF, DOC, TXT, JPG, PNG (max 5 files, 10MB each)
                  </p>
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline and Budget Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Timeline Preference</h3>
                <div className="space-y-2">
                  {[
                    { value: 'urgent', label: 'Urgent (1-2 weeks)', desc: 'Higher cost, immediate attention' },
                    { value: 'weeks', label: 'Standard (2-4 weeks)', desc: 'Balanced approach' },
                    { value: 'month', label: 'Extended (1-2 months)', desc: 'Thorough and cost-effective' },
                    { value: 'flexible', label: 'Flexible', desc: 'Open to suggestions' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTimeline(option.value as any)}
                      className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                        timeline === option.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Budget Range</h3>
                <div className="space-y-2">
                  {[
                    { value: 'low', label: 'Budget Friendly', desc: '₹10K - ₹25K' },
                    { value: 'medium', label: 'Standard', desc: '₹25K - ₹50K' },
                    { value: 'high', label: 'Premium', desc: '₹50K+' },
                    { value: 'flexible', label: 'Open to Discussion', desc: 'Based on solution value' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setBudget(option.value as any)}
                      className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                        budget === option.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={analyzeQuery}
              disabled={query.length < 50 || isAnalyzing}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Analyzing Your Query...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  Analyze & Get Solutions
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Analysis Results */}
        {step === 2 && analysis && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Analysis Complete</h2>
              <p className="text-gray-600 dark:text-gray-300">Here's our AI-powered analysis of your problem</p>
            </div>

            {/* Analysis Summary */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Problem Analysis</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className={`inline-block px-3 py-1 rounded-lg border ${getComplexityColor(analysis.complexity)} mb-2`}>
                    <span className="font-medium capitalize">{analysis.complexity} Complexity</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Difficulty Level</p>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{analysis.estimatedTime}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Estimated Timeline</p>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-1">
                    ₹{analysis.budgetRange.min.toLocaleString()} - ₹{analysis.budgetRange.max.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Budget Range</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Suggested Approach:</h4>
                <p className="text-gray-700 dark:text-gray-300">{analysis.suggestedApproach}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Required Expertise:</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.requiredExperts.map((expert, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg text-sm"
                    >
                      {expert}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-4 rounded-xl font-semibold transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Refine Query
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-semibold transition-colors"
              >
                View Available Teams
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Select Team */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Choose Your Solution Team</h2>
              <p className="text-gray-600 dark:text-gray-300">Select the best team based on expertise and availability</p>
            </div>

            <div className="space-y-4">
              {solutionTeams.map((team) => (
                <div
                  key={team.id}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedTeam === team.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                  } ${team.availability !== 'available' ? 'opacity-70' : ''}`}
                  onClick={() => team.availability === 'available' && setSelectedTeam(team.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl flex items-center justify-center">
                      <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{team.name}</h3>
                        {team.availability !== 'available' && (
                          <span className="bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-lg text-xs capitalize">
                            {team.availability}
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 dark:text-gray-300 mb-3">{team.description}</p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {team.expertise.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-lg text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{team.members} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span>{team.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{team.completedProjects} projects</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{team.estimatedTime}</span>
                        </div>
                      </div>

                      <div className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                        ₹{team.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-4 rounded-xl font-semibold transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Back to Analysis
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!selectedTeam}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-colors"
              >
                Continue to Submission
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Final Submission */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Submit Your Solution Request</h2>
              <p className="text-gray-600 dark:text-gray-300">Review and submit your problem for expert solution</p>
            </div>

            {/* Final Summary */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Request Summary</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Your Problem:</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">{query}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Selected Team:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {solutionTeams.find(t => t.id === selectedTeam)?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Estimated Timeline:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {solutionTeams.find(t => t.id === selectedTeam)?.estimatedTime}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Investment:</span>
                    <p className="font-medium text-purple-600 dark:text-purple-400">
                      ₹{solutionTeams.find(t => t.id === selectedTeam)?.price.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Complexity:</span>
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium border ${analysis ? getComplexityColor(analysis.complexity) : ''} ml-2`}>
                      {analysis?.complexity}
                    </span>
                  </div>
                </div>

                {attachments.length > 0 && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm block mb-2">Attachments:</span>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <span key={index} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                          {file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* What Happens Next */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                What Happens Next?
              </h3>
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">1</div>
                  <div>
                    <p className="font-medium">Team Assignment (24 hours)</p>
                    <p>Your selected team will review your problem and create a detailed solution plan.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">2</div>
                  <div>
                    <p className="font-medium">Solution Proposal (2-3 days)</p>
                    <p>Receive a comprehensive proposal with timeline, milestones, and detailed approach.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">3</div>
                  <div>
                    <p className="font-medium">Project Kickoff</p>
                    <p>Upon approval, your dedicated team starts working with regular progress updates.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-4 rounded-xl font-semibold transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Back to Teams
              </button>
              <button
                onClick={submitQuery}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Send className="h-5 w-5" />
                Submit Solution Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};