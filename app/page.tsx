'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Topic {
  id: string;
  title: string;
  category: string;
  content: string;
  order_index: number;
}

export default function Home() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [courseStarted, setCourseStarted] = useState<boolean>(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    setCourseStarted(false);
  }, [selectedTopic]);

  async function fetchTopics() {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('category', { ascending: true })
      .order('order_index', { ascending: true });

    if (data && data.length > 0) {
      setTopics(data);
      setSelectedTopic(data[0]);
    } else {
      console.error('Supabase error:', error);
    }
  }

  async function handleToggleComplete() {
    if (!selectedTopic) return;

    const isDone = completedIds.includes(selectedTopic.id);

    if (isDone) {
      const { error } = await supabase
        .from('user_progress')
        .delete()
        .eq('topic_id', selectedTopic.id);

      if (!error) {
        setCompletedIds(completedIds.filter(id => id !== selectedTopic.id));
      }
    } else {
      const { error } = await supabase
        .from('user_progress')
        .insert([{ topic_id: selectedTopic.id, is_completed: true }]);

      if (!error) {
        setCompletedIds([...completedIds, selectedTopic.id]);
      }
    }
  }

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const totalTopics = topics.length > 0 ? topics.length : 1;
  const progressPercent = Math.round((completedIds.length / totalTopics) * 100);

  const groupedTopics = topics.reduce((acc, topic) => {
    if (!acc[topic.category]) {
      acc[topic.category] = [];
    }
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, Topic[]>);

  const isCurrentCompleted = selectedTopic ? completedIds.includes(selectedTopic.id) : false;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 font-sans p-6">
      <header className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-stone-200 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
          <span className="font-bold text-lg text-stone-900">DevRoadmap</span>
        </div>
        <div className="text-stone-500 font-medium">Developer Roadmap Journey</div>
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center font-semibold text-amber-800">U</div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-4 bg-white p-5 rounded-xl shadow-sm border border-stone-200 space-y-6 overflow-y-auto max-h-[85vh]">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Roadmap Paths</h2>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {progressPercent}% Done
            </span>
          </div>
          
          {Object.entries(groupedTopics).map(([category, items], catIndex) => {
            const isCollapsed = collapsedCategories[category];
            const catNumber = catIndex + 1;
            return (
              <div key={category} className="space-y-2">
                <div 
                  onClick={() => toggleCategory(category)}
                  className="font-bold text-stone-700 text-sm flex items-center justify-between cursor-pointer hover:text-amber-700 transition-colors py-1 select-none"
                >
                  <span>{catNumber}. {category} Roadmap</span>
                  <span className="text-xs text-stone-400 font-normal">
                    {isCollapsed ? '▶' : '▼'}
                  </span>
                </div>

                {!isCollapsed && (
                  <ul className="pl-3 space-y-1.5 border-l-2 border-amber-100">
                    {items.map((t, topicIndex) => {
                      const isSelected = selectedTopic?.id === t.id;
                      const isDone = completedIds.includes(t.id);
                      const lessonNumber = `${catNumber}.${topicIndex + 1}`;

                      return (
                        <li
                          key={t.id}
                          onClick={() => setSelectedTopic(t)}
                          className={`p-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-50 border border-amber-300 text-amber-900 shadow-sm'
                              : 'text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <span>{lessonNumber} {t.title}</span>
                          {isDone && <span className="text-emerald-600 text-xs font-bold">✓</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </aside>

        <main className="col-span-8 bg-white p-6 rounded-xl shadow-sm border border-stone-200 space-y-6 overflow-y-auto max-h-[85vh]">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-900 text-white flex items-center gap-1.5 shadow-sm">
                📚 Resources
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className={`px-2.5 py-1 rounded-md border transition-colors ${
                isCurrentCompleted 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isCurrentCompleted ? '✓ Completed' : '📖 Learning'}
              </span>

              <button 
                onClick={handleToggleComplete}
                className={`px-3 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                  isCurrentCompleted 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' 
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {isCurrentCompleted ? '✓ Done' : 'Mark Done'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">
                {selectedTopic?.category} TRACK
              </span>
              <h1 className="text-3xl font-extrabold text-stone-900 mt-1">
                {selectedTopic ? selectedTopic.title : 'Select a lesson'}
              </h1>
            </div>

            <div className="text-stone-700 text-sm leading-relaxed space-y-4 whitespace-pre-line border-b border-stone-100 pb-6">
              {selectedTopic ? selectedTopic.content : 'Select a topic from the left sidebar.'}
            </div>

            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                  ⭐ Recommended • Official resources by Team
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{selectedTopic?.title} Fundamentals</h4>
                  <p className="text-xs text-stone-500 mt-0.5">⏱ 60 mins • 8 lessons • 6 hands-on projects</p>
                </div>
                
                <button 
                  onClick={() => setCourseStarted(!courseStarted)}
                  className={`font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer ${
                    courseStarted 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                      : 'bg-amber-500 hover:bg-amber-600 text-stone-900'
                  }`}
                >
                  {courseStarted ? '✓ In Progress' : 'Start Course →'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1">
                🌱 Free Community Resources
              </h3>
              <div className="space-y-2 text-xs">
                <a 
                  href={`https://google.com/search?q=${encodeURIComponent((selectedTopic?.title || '') + ' documentation')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-stone-50 hover:bg-amber-50 rounded-lg border border-stone-200 hover:border-amber-300 flex items-center justify-between transition-all group"
                >
                  <span className="font-medium text-stone-700 group-hover:text-amber-900">
                    Official Documentation & Interactive Guides
                  </span>
                  <span className="text-amber-700 font-bold group-hover:translate-x-0.5 transition-transform">
                    Visit Link ↗
                  </span>
                </a>

                <a 
                  href={`https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(selectedTopic?.title || '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-stone-50 hover:bg-amber-50 rounded-lg border border-stone-200 hover:border-amber-300 flex items-center justify-between transition-all group"
                >
                  <span className="font-medium text-stone-700 group-hover:text-amber-900">
                    MDN Web Docs Architecture Reference
                  </span>
                  <span className="text-amber-700 font-bold group-hover:translate-x-0.5 transition-transform">
                    Visit Link ↗
                  </span>
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}