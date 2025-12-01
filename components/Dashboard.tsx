import React, { useEffect, useState } from 'react';
import { getUserStats, getAttempts, getAllQuestions } from '../services/storageService';
import { UserStats, Attempt, Question } from '../types';
import { SUBJECT_COLORS } from '../constants.ts';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Target, Zap, Clock, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<Record<string, Attempt[]>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const loadedAttempts = getAttempts();
      console.log('Dashboard loaded attempts:', Object.keys(loadedAttempts).length, 'questions with attempts');
      console.log('Sample attempt data:', loadedAttempts);

      const loadedQuestions = await getAllQuestions();
      setAttempts(loadedAttempts);
      setQuestions(loadedQuestions);
      setLoading(false);
    };
    loadData();
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // --- Dynamic Stats Calculation ---
  const calculateStats = () => {
    const allAttempts = Object.values(attempts).flat();
    const uniqueQuestionIds = Object.keys(attempts);

    // 1. Total Questions Attempted
    const totalQuestionsAttempted = uniqueQuestionIds.length;

    // 2. Correct Answers (Unique Questions Solved)
    const correctAnswers = uniqueQuestionIds.filter(qId =>
      attempts[qId].some(a => a.isCorrect)
    ).length;

    // 3. Accuracy
    const accuracy = totalQuestionsAttempted > 0
      ? Math.round((correctAnswers / totalQuestionsAttempted) * 100)
      : 0;

    // 4. Time Spent
    const totalTimeSeconds = allAttempts.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0);

    // 5. Streak Calculation
    // Get all unique dates with activity
    const activityDates = Array.from(new Set(
      allAttempts.map(a => new Date(a.timestamp).toISOString().split('T')[0])
    )).sort().reverse(); // Newest first

    let streak = 0;
    if (activityDates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Check if streak is active (activity today or yesterday)
      if (activityDates[0] === today || activityDates[0] === yesterday) {
        streak = 1;
        let currentDate = new Date(activityDates[0]);

        for (let i = 1; i < activityDates.length; i++) {
          const prevDate = new Date(activityDates[i]);
          const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            streak++;
            currentDate = prevDate;
          } else {
            break;
          }
        }
      }
    }

    return {
      totalQuestionsAttempted,
      correctAnswers,
      accuracy,
      totalTimeSeconds,
      streak
    };
  };

  const stats = calculateStats();

  if (loading) return <div className="p-8 text-center">Loading stats...</div>;

  // Calculate Subject Performance based on attempts
  const subjectData = questions.reduce((acc, q) => {
    const qAttempts = attempts[q.id] || [];
    if (qAttempts.length > 0) {
      if (!acc[q.subject]) acc[q.subject] = { total: 0, correct: 0 };
      acc[q.subject].total += 1; // Count unique questions, not total attempts
      if (qAttempts.some(a => a.isCorrect)) {
        acc[q.subject].correct += 1;
      }
    }
    return acc;
  }, {} as Record<string, { total: number, correct: number }>);

  const pieData = Object.entries(subjectData).map(([subject, data]) => ({
    name: subject,
    value: data.total,
    accuracy: Math.round((data.correct / data.total) * 100)
  }));

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
        <button
          onClick={() => navigate('/notes')}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <BookOpen size={16} />
          My Notes
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Trophy} label="Total Questions" value={stats.totalQuestionsAttempted} color="bg-blue-500" />
        <StatCard icon={Target} label="Accuracy" value={`${stats.accuracy}%`} color="bg-green-500" />
        <StatCard icon={Zap} label="Day Streak" value={stats.streak} color="bg-orange-500" />
        <StatCard icon={Clock} label="Time Spent" value={formatTime(stats.totalTimeSeconds)} color="bg-purple-500" />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Subject Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Topic Distribution</h3>
          <div className="h-64 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SUBJECT_COLORS[entry.name as any] || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No data yet. Take a quiz!
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[entry.name as any] }}></span>
                <span className="text-gray-600 flex-1">{entry.name}</span>
                <span className="font-semibold">{entry.accuracy}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Areas List */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Weak Areas (Under 60%)</h3>
          <div className="space-y-3">
            {pieData.filter(d => d.accuracy < 60).length > 0 ? (
              pieData.filter(d => d.accuracy < 60).map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className="px-2 py-1 bg-white rounded-lg text-sm font-bold text-red-600 border border-red-100">
                    {item.accuracy}%
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-green-600 bg-green-50 rounded-xl">
                🎉 No weak areas identified yet! Keep studying.
              </div>
            )}
          </div>


        </div>
      </div>
    </div>
  );
};

export default Dashboard;
